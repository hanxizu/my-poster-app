import { NextApiRequest, NextApiResponse } from "next";
import satori from "satori";
import React from "react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { text = "Hello Poster!", width = 600, height = 400 } = req.query;

    // React 元素（Satori 渲染用）——不直接写 JSX
    const element = React.createElement(
      "div",
      {
        style: {
          width: Number(width),
          height: Number(height),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: "bold",
          color: "black",
          background: "white",
        },
      },
      text
    );

    // 用 satori 渲染成 SVG
    const svg = await satori(element, {
      width: Number(width),
      height: Number(height),
      fonts: [],
    });

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
