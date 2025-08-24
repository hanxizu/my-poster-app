// Edge Runtime + WASM：适合 Vercel
export const runtime = 'edge';

import MarkdownIt from 'markdown-it';
import satori from 'satori';
import React from 'react';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
// Vercel/Next 的 Edge 环境支持 '?module' 方式引入 wasm
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm?module';

// ---- Markdown parser ----
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// ---- 主题配置（可自行扩展）----
const THEMES = {
  light: { bg: '#ffffff', fg: '#111827' },
  dark:  { bg: '#0b0f1a', fg: '#e5e7eb' },
  warm:  { bg: '#fff7ed', fg: '#1f2937' },
  cool:  { bg: '#f1f5f9', fg: '#0f172a' }
};

// ---- 远程加载字体（woff/ttf 可行；也可改成静态 public/ 字体）----
async function loadFont() {
  // Inter Regular（可替换你自己的字体）
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa5w.woff';
  const res = await fetch(fontUrl);
  if (!res.ok) throw new Error('Font fetch failed');
  return await res.arrayBuffer();
}

// ---- 简易分页：按 <hr> 或 --- 分隔为多页 ----
function splitByHr(markdown) {
  const hrRegex = /(^|\n)(-{3,}|<hr\s*\/?>)(\n|$)/gi;
  const parts = markdown.split(hrRegex).filter(Boolean);
  // 上面的 split 会带上分隔符残片，这里简单归并：把非 hr 段落收集
  const pages = [];
  let buf = '';
  for (const seg of parts) {
    if (/^-{3,}$/.test(seg.trim()) || /^<hr\s*\/?>$/i.test(seg.trim())) {
      if (buf.trim()) pages.push(buf);
      buf = '';
    } else {
      buf += seg;
    }
  }
  if (buf.trim()) pages.push(buf);
  return pages.length ? pages : [markdown];
}

// ---- Markdown → HTML ----
function renderMarkdownToHtml(markdown) {
  return md.render(markdown);
}

// ---- 用 Satori 把 HTML 包入 JSX（Satori 支持部分 HTML/CSS）----
function View({ html, width, height, themeName, padding, background, color }) {
  const t = THEMES[themeName] || THEMES.light;
  return (
    <div
      style={{
        width,
        height,
        background: background || t.bg,
        color: color || t.fg,
        fontFamily: 'Inter',
        lineHeight: 1.55,
        display: 'flex',
        flexDirection: 'column',
        padding,
        boxSizing: 'border-box'
      }}
    >
      {/* 这里直接塞 HTML：Satori 会过滤不支持的标签/样式 */}
      <div style={{ fontSize: 18 }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// ---- 单页渲染：Markdown → HTML → SVG → PNG(Buffer) ----
async function renderOnePage({ markdown, theme, width, height, padding, fontData, color, background }) {
  const html = renderMarkdownToHtml(markdown);

  const svg = await satori(
    React.createElement(View, { html, width, height, themeName: theme, padding, background, color }),
    {
      width,
      height,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 400,
          style: 'normal'
        }
      ]
    }
  );

  // 确保 WASM 初始化（只需一次，但多次调用也无害）
  await initWasm(resvgWasm);

  const r = new Resvg(svg, {
    // 固定宽度渲染，避免拉伸
    fitTo: { mode: 'width', value: width }
  });
  const png = r.render();
  return png.asPng(); // Uint8Array
}

// ---- API：POST /api/render ----
export async function POST(req) {
  try {
    const {
      // 基础参数
      markdown = '# Hello from API\n\nThis is **SSR** rendered PNG!',
      themeMode = 'light',  // 'light' | 'dark'
      theme = 'light',      // 'light' | 'dark' | 'warm' | 'cool'
      width = 600,
      height = 800,
      background = '',      // 自定义背景（覆盖主题）
      color = '',           // 自定义前景色（覆盖主题）
      padding = 24,

      // 分页：'none' | 'hrSplit'
      splitMode = 'none',

      // 返回格式：'auto' | 'json' | 'png'
      // auto: 单页返回 image/png，多页返回 JSON（dataURL 数组）
      // png: 始终返回单张 PNG（仅单页有效）
      // json: 始终返回 JSON（base64 数组）
      responseMode = 'auto'
    } = await req.json();

    // 加载字体
    const fontData = await loadFont();

    // 处理分页
    const pageMarkdowns =
      splitMode === 'hrSplit' ? splitByHr(markdown) : [markdown];

    // 渲染全部页面
    const pngBuffers = [];
    for (const mdPage of pageMarkdowns) {
      const buf = await renderOnePage({
        markdown: mdPage,
        theme: theme || themeMode || 'light',
        width: clamp(width, 320, 4096, 800),
        height: clamp(height, 320, 4096, 1200),
        padding: clamp(padding, 0, 120, 24),
        fontData,
        color,
        background
      });
      pngBuffers.push(buf);
    }

    // 根据返回模式决定响应
    if ((responseMode === 'auto' && pngBuffers.length === 1) || responseMode === 'png') {
      // 单页 PNG
      return new Response(pngBuffers[0], {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
      });
    }

    // 多页或强制 JSON：返回 base64 dataURL 数组
    const images = pngBuffers.map((u8) => {
      const b64 = base64FromUint8(u8);
      return `data:image/png;base64,${b64}`;
    });

    return Response.json(
      { pages: images, count: images.length },
      { status: 200 }
    );
  } catch (err) {
    console.error('Render error:', err);
    return Response.json(
      { error: String(err && err.message ? err.message : err) },
      { status: 500 }
    );
  }
}

// ---- utils ----
function clamp(v, min, max, d) {
  const n = Number.isFinite(+v) ? +v : d;
  return Math.min(max, Math.max(min, n));
}

function base64FromUint8(u8) {
  // Edge runtime 的 btoa 需要字符串
  let binary = '';
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary);
}
