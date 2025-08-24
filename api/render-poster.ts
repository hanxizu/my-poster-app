import type { NextApiRequest, NextApiResponse } from "next";
import React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { markdown = "Hello Poster!", width = 600, height = 400 } = req.body;

    // 用 React.createElement 替代 JSX
    const element = React.createElement(
      "div",
      {
        style: {
          display: "flex",
          width: Number(width),
          height: Number(height),
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          fontSize: 32,
          fontWeight: "bold",
          color: "#333",
        },
      },
      markdown
    );

    // Satori -> SVG
    const svg = await satori(element, {
      width: Number(width),
      height: Number(height),
      fonts: [
        {
          name: "Noto Sans",
          data: await fetch(
            "https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.woff2"
          ).then((res) => res.arrayBuffer()),
          weight: 400,
          style: "normal",
        },
      ],
    });

    // Resvg -> PNG
    const resvg = new Resvg(svg);
    const pngData = resvg.render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.send(pngData);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
