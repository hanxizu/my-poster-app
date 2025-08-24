import { NextResponse } from "next/server";
import MarkdownIt from "markdown-it";
import { createCanvas } from "@napi-rs/canvas"; // ✅ 替换 canvas

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { markdown, width = 600, height = 400, background = "#fff" } =
      await req.json();

    const md = new MarkdownIt();
    const plainText = markdown || "# Hello Markdown!";

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#000";
    ctx.font = "20px sans-serif";
    ctx.fillText(plainText.replace(/\n/g, " "), 20, 50);

    const buffer = await canvas.encode("png"); // ✅ napi-rs 用 encode

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
