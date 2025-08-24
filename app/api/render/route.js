import { renderMarkdownToPNG } from "@/lib/renderToPng";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markdown = "# Hello from Edge!\n\n**SVG → PNG**", width = 800 } = body;

    const { buffer, contentType } = await renderMarkdownToPNG(markdown, { width });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function GET() {
  const sample = `# 示例  
- **Edge Runtime 支持**  
- react-markdown + Prism  
- 渲染成 SVG 再转 PNG`;

  const { buffer, contentType } = await renderMarkdownToPNG(sample, { width: 800 });

  return new Response(buffer, {
    status: 200,
    headers: { "Content-Type": contentType }
  });
}
