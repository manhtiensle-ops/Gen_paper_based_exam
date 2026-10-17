"use client";

import React from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface Props {
  content: string;
  className?: string;
}

export default function MathRenderer({ content, className = "" }: Props) {
  if (!content) return null;

  // Split content by $$ ... $$ block math first
  const blockParts = content.split(/(\$\$[\s\S]*?\$\$)/g);

  return (
    <div className={`leading-relaxed ${className}`}>
      {blockParts.map((blockPart, bIdx) => {
        if (blockPart.startsWith("$$") && blockPart.endsWith("$$")) {
          const math = blockPart.slice(2, -2).trim();
          try {
            return <BlockMath key={bIdx} math={math} />;
          } catch {
            return <pre key={bIdx} className="text-red-500">{blockPart}</pre>;
          }
        }

        // Inline math split: $ ... $
        const inlineParts = blockPart.split(/(\$[^\$]+?\$)/g);
        return (
          <span key={bIdx}>
            {inlineParts.map((part, iIdx) => {
              if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
                const math = part.slice(1, -1).trim();
                try {
                  return <InlineMath key={iIdx} math={math} />;
                } catch {
                  return <code key={iIdx} className="text-red-500">{part}</code>;
                }
              }
              // Normal text
              return <span key={iIdx}>{part}</span>;
            })}
          </span>
        );
      })}
    </div>
  );
}
