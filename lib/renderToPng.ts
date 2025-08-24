import { renderToStaticMarkup } from "react-dom/server";
import MarkdownToSvg, { RenderOptions } from "./MarkdownToSvg";
import { Resvg } from "@resvg/resvg-wasm";

export async function renderMarkdownToPNG(markdown: string, opts: RenderOptions = {}) {
  // 1. React → SVG string
  const svgString = renderToStaticMarkup(
    MarkdownToSvg({ markdown, opts }) as any
  );

  // 2. 用 resvg 把 SVG 转 PNG
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: "width",
      value: opts.width ?? 800
    }
  });

  const pngData = resvg.render();
  const buffer = pngData.asPng();

  return { buffer, contentType: "image/png" };
}
