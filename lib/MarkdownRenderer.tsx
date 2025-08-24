"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export interface RenderOptions {
  width?: number;
  background?: string;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  padding?: number;
}

export default function MarkdownToSvg({
  markdown,
  opts = {}
}: {
  markdown: string;
  opts?: RenderOptions;
}) {
  const {
    width = 800,
    background = "#0b1020",
    textColor = "#e5e7eb",
    fontFamily = "system-ui, sans-serif",
    fontSize = 16,
    lineHeight = 1.6,
    padding = 32
  } = opts;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      style={{
        background,
        fontFamily,
        fontSize,
        lineHeight: String(lineHeight),
        color: textColor
      }}
    >
      <foreignObject x={0} y={0} width="100%" height="100%">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            display: "block",
            padding: `${padding}px`,
            color: textColor,
            whiteSpace: "pre-wrap"
          }}
        >
          <style>{`
            h1{font-size:2em;margin:0.6em 0;}
            h2{font-size:1.6em;margin:0.5em 0;}
            p{margin:0.4em 0;}
            code{background:rgba(255,255,255,0.1);padding:0.2em 0.4em;border-radius:4px;}
            pre{margin:0.6em 0;padding:1em;border-radius:8px;overflow:auto;}
            ul,ol{margin:0.5em 0 0.5em 1.2em;}
            blockquote{border-left:4px solid #3b82f6;padding-left:1em;color:#9ca3af;}
          `}</style>

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                if (!inline && match) {
                  return (
                    <SyntaxHighlighter
                      language={match[1]}
                      style={oneDark}
                      PreTag="div"
                      customStyle={{
                        margin: "0.6em 0",
                        borderRadius: "8px"
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                }
                return <code {...props}>{children}</code>;
              }
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </foreignObject>
    </svg>
  );
}
