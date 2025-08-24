import { NextResponse } from "next/server";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import MarkdownIt from "markdown-it";

// 初始化 markdown-it
const md = new MarkdownIt();

export async function POST(req) {
  try {
    const { markdown, theme = "light", width = 600, height = 400, background = "#fff" } = await req.json();

    // Markdown → HTML
    const html = md.render(markdown || "# Hello World");

    // SVG（使用 satori 渲染）
    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            width: `${width}px`,
            height: `${height}px`,
            background,
            color: theme === "dark" ? "#fff" : "#000",
            fontSize: "20px",
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "left",
          },
          dangerouslySetInnerHTML: { __html: html },
        },
      },
      {
        width,
        height,
        fonts: [
          {
            name: "Noto Sans",
            data: await fetch(
              "https://cdnjs.cloudflare.com/ajax/libs/noto-sans/21.0.0/NotoSans-Regular.ttf"
            ).then((res) => res.arrayBuffer()),
            weight: 400,
            style: "normal",
          },
        ],
      }
    );

    // SVG → PNG（使用 resvg 渲染）
    const resvg = new Resvg(svg, {
      background: "transparent",
      fitTo: { mode: "width", value: width },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=poster.png",
      },
    });
  } catch (err) {
    console.error("Error rendering poster:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
