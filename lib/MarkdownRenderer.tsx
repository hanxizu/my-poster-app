"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export interface RenderOptions {
  width?: number;
  padding?: number;
  background?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;    // px
  lineHeight?: number;  // 例: 1.6
}

export default function MarkdownRenderer({
  markdown,
  opts = {}
}: {
  markdown: string;
  opts?: RenderOptions;
}) {
  const {
    width = 800,
    padding = 32,
    background = "#0b1020",
    textColor = "#e5e7eb",
    fontFamily = "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize = 16,
    lineHeight = 1.8
  } = opts;

  return (
    <div
      id="capture-root"
      style={{
        width,
        padding,
        background,
        color: textColor,
        fontFamily,
        fontSize,
        lineHeight: String(lineHeight),
        boxSizing: "border-box",
        // 让 html2canvas 有确定尺寸
        display: "block"
      }}
    >
      <style>{`
        h1{font-size:2.2em;margin:.6em 0 .4em;font-weight:700}
        h2{font-size:1.8em;margin:.6em 0 .35em;font-weight:700}
        h3{font-size:1.4em;margin:.6em 0 .3em;font-weight:700}
        p{margin:.6em 0}
        ul,ol{margin:.6em 0 .6em 1.2em}
        blockquote{
          margin:.8em 0;padding:.6em 1em;border-left:4px solid #3b82f6;
          background:rgba(59,130,246,.08)
        }
        code{font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
        pre{overflow:auto;padding:1em;border-radius:12px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid rgba(255,255,255,.1);padding:.5em;text-align:left}
        a{color:#60a5fa;text-decoration:none}
      `}</style>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneDark}
                  PreTag="div"
                  customStyle={{ margin: "0.6em 0", borderRadius: 12 }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
            return (
              <code
                style={{
                  background: "rgba(255,255,255,.08)",
                  padding: ".2em .4em",
                  borderRadius: "6px"
                }}
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
