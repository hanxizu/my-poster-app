import { Resvg } from "@resvg/resvg-wasm";
import satori from "satori";
import MarkdownIt from "markdown-it";

export async function POST(req) {
  const { markdown, theme, width = 600, height = 400, background = "#fff" } = await req.json();

  // markdown → HTML → React-like nodes
  const md = new MarkdownIt();
  const html = md.render(markdown);

  // 用 Satori 渲染 SVG
  const svg = await satori(
    {
      type: "div",
      props: {
        style: { width, height, background, color: theme === "dark" ? "#fff" : "#000" },
        children: [{ type: "div", props: { dangerouslySetInnerHTML: { __html: html } } }],
      },
    },
    { width, height, fonts: [] }
  );

  // 用 Resvg (wasm) 转成 PNG
  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: { "Content-Type": "image/png" },
  });
}
