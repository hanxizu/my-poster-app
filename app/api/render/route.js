import { NextRequest, NextResponse } from "next/server";
import { renderMarkdownToPNG } from "@/lib/renderToPng";

export const runtime = "nodejs"; // 重要：不能是 edge
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      markdown = "# Hello\n\n`markdown` -> **PNG**!",
      width = 800,
      background = "#0b1020",
      textColor = "#e5e7eb",
      fontFamily,
      fontSize = 16,
      padding = 32,
      lineHeight = 1.8
    } = body || {};

    const { buffer, contentType } = await renderMarkdownToPNG({
      markdown,
      width,
      background,
      textColor,
      fontFamily,
      fontSize,
      padding,
      lineHeight
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? "Render failed" }, { status: 500 });
  }
}

export async function GET() {
  // 方便浏览器直接试
  const sample = `# 快速示例

- 支持 **GFM**
- 表格
- 代码高亮（Prism）

\`\`\`ts
export const add = (a: number, b: number) => a + b;
\`\`\`
`;
  const { buffer, contentType } = await renderMarkdownToPNG({ markdown: sample });
  return new NextResponse(buffer, {
    status: 200,
    headers: { "Content-Type": contentType }
  });
}
