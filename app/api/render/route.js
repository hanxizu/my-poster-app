import { NextResponse } from "next/server";
import MarkdownIt from "markdown-it";
import { createCanvas } from "canvas"; // 注意: Node.js Runtime

export const runtime = "nodejs"; // 避免跑在 Edge 上

export async function POST(req) {
  try {
    const { markdown, width = 600, height = 400, background = "#fff" } =
      await req.json();

    // 1. Markdown 转 HTML
    const md = new MarkdownIt();
    const html = md.render(markdown || "# Hello Markdown!");

    // 2. 创建 Canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 背景
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // 3. 简单绘制纯文本 (不做复杂排版，只是 demo)
    ctx.fillStyle = "#000";
    ctx.font = "20px sans-serif";
    ctx.fillText(markdown.replace(/\n/g, " "), 20, 50);

    // 4. 输出 PNG Buffer
    const buffer = canvas.toBuffer("image/png");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
