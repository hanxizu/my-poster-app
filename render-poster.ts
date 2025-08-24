// pages/api/render-poster.ts
import { NextApiRequest, NextApiResponse } from "next";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import MarkdownIt from "markdown-it";
import React from "react";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      markdown = "Hello **Markdown**",
      themeMode = "light",
      width = 440,
      height = 586,
      background = "#fff",
    } = req.method === "POST" ? req.body : req.query;

    // 1. Markdown → HTML
    const html = md.render(markdown as string);

    // 2. React 元素 (Satori 渲染用)
    const element = (
      <div
        style={{
          width: Number(width),
          height: Number(height),
          background,
          color: themeMode === "dark" ? "#fff" : "#000",
          fontFamily: "sans-serif",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );

    // 3. 生成 SVG
    const svg = await satori(element, {
      width: Number(width),
      height: Number(height),
      fonts: [], // 不指定字体，使用默认 fallback
    });

    // 4. 转 PNG
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: Number(width) },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(pngBuffer);
  } catch (err: any) {
    console.error("Render Error:", err);
    res.status(500).json({ error: err.message });
  }
}
