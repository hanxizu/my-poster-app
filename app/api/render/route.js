import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import MarkdownIt from "markdown-it";
import React from "react";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// 预加载字体
let fontData;
(async () => {
  fontData = await fetch(
    "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa5w.woff"
  ).then((res) => res.arrayBuffer());
})();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST supported" });
  }

  try {
    const {
      markdown = "# Hello Markdown\n\nThis is **SSR Rendering**",
      theme = "light",
      width = 600,
      height = 800,
      background = "#ffffff",
      pagination = false,
    } = req.body;

    // 1. Markdown -> HTML
    const html = md.render(markdown);

    // 2. React 节点
    const element = (
      <div
        style={{
          width,
          height,
          background: background,
          color: theme === "dark" ? "#fff" : "#000",
          fontFamily: "Inter",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );

    // 3. Satori -> SVG
    const svg = await satori(element, {
      width,
      height,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    });

    // 4. Resvg -> PNG
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // 5. 返回图片 (Base64 或直接响应)
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(pngBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
