import { JSDOM } from "jsdom";
import { createCanvas, loadImage, registerFont } from "canvas";
import html2canvas from "html2canvas";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownRenderer, { RenderOptions } from "./MarkdownRenderer";

// 可选：注册你的字体（提高一致性）
try {
  registerFont(require.resolve("./fonts/Inter-Regular.ttf"), { family: "Inter" });
} catch {}

type Input = {
  markdown: string;
  width?: number;
  background?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  padding?: number;
  lineHeight?: number;
};

export async function renderMarkdownToPNG(input: Input) {
  const {
    markdown,
    width = 800,
    background = "#0b1020",
    textColor = "#e5e7eb",
    fontFamily = "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize = 16,
    padding = 32,
    lineHeight = 1.8
  } = input;

  // 1) SSR：React -> 静态 HTML
  const htmlBody = renderToStaticMarkup(
    React.createElement(MarkdownRenderer, {
      markdown,
      opts: { width, background, textColor, fontFamily, fontSize, padding, lineHeight } as RenderOptions
    })
  );

  // 2) 构造最小 HTML 文档（给 jsdom + html2canvas 使用）
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"></head>
  <body>${htmlBody}</body></html>`;

  // 3) 用 jsdom 创建 DOM
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    resources: "usable",
    runScripts: "outside-only",
    url: "http://localhost/" // 让资源解析成同源
  });
  const { window } = dom as unknown as {
    window: Window & typeof globalThis & { HTMLCanvasElement: any; Image: any };
  };

  // 4) 为 html2canvas 提供 Canvas 和 Image 的服务端实现
  //    - node-canvas 的 createCanvas 提供 2D 上下文
  //    - Image 用于 <img> 元素解析（若你的 markdown 有图，可以启用）
  (window as any).HTMLCanvasElement = class HTMLCanvasElementShim {};
  (window as any).Image = (loadImage as unknown as any);

  // 绑定必要的全局对象（html2canvas 会读取）
  (global as any).window = window;
  (global as any).document = window.document;
  (global as any).HTMLElement = window.HTMLElement;
  (global as any).getComputedStyle = window.getComputedStyle;
  (global as any).devicePixelRatio = 2; // 提高清晰度
  (global as any).HTMLCanvasElement = (window as any).HTMLCanvasElement;
  (global as any).Image = (window as any).Image;

  // 5) 用 node-canvas 提前准备绘图画布（供 html2canvas 使用）
  //    我们通过 "foreignObjectRendering: true" 路径走 DOM 绘制，交给 node-canvas 输出
  const targetEl = window.document.getElementById("capture-root");
  if (!targetEl) throw new Error("capture-root not found");

  // 让容器有一个合理的高度估计：先根据内容粗略测量高度
  // 简化策略：按字符数估算；或者直接给一个最大高度，html2canvas 会按滚动高度绘制
  const estimatedHeight = Math.min(
    4000,
    Math.max(400, Math.ceil(targetEl.textContent?.length ? targetEl.textContent.length * (fontSize * 0.35) : 800))
  );

  // html2canvas 渲染
  const canvas = await html2canvas(targetEl as unknown as HTMLElement, {
    backgroundColor: background,
    width,
    height: estimatedHeight, // 让它有足够空间
    windowWidth: width + 2,  // 避免换行差异
    scale: 2,                // 2x 清晰度
    foreignObjectRendering: true,
    logging: false,
    onclone: (clonedDoc) => {
      // 如果内容溢出，可以在这里根据真实 scrollHeight 再次调整
      const clonedRoot = clonedDoc.getElementById("capture-root") as HTMLElement;
      if (clonedRoot) {
        clonedRoot.style.width = `${width}px`;
      }
    }
  });

  // 6) html2canvas 返回的是浏览器 Canvas；在 Node 里我们把数据转成 Buffer
  const dataUrl = (canvas as HTMLCanvasElement).toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  const buffer = Buffer.from(base64, "base64");

  // 7) 可选：探测真实内容高度并裁剪多余空白
  // 这里用简单策略：不裁剪。如果你希望更紧凑，可运行一次测量后重绘。

  return { buffer, contentType: "image/png", width, height: estimatedHeight };
}
