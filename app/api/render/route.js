// app/api/render-poster/route.js
import { NextResponse } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import React from "react";

export async function POST(req) {
  try {
    const { markdown, theme, width, height, background } = await req.json();

    // 这里 markdown 建议先转为 HTML（例如用 marked/markdown-it）
    // 这里简单展示一下：
    const html = markdown.replace(/\n/g, "<br/>");

    // 用 satori 渲染 SVG
    const svg = await satori(
      <div
        style={{
          width,
          height,
          background: background || "#fff",
          color: theme === "dark" ? "#fff" : "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          padding: "20px",
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>,
      {
        width,
        height,
        fonts: [], // 可以在这里加载自定义字体
      }
    );

    // 把 SVG 转 PNG
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    console.error("Render Error:", err);
    return NextResponse.json(
      { error: "Render failed", details: err.message },
      { status: 500 }
    );
  }
}
