import React from "react";

interface Props {
  text: string;
  className?: string;
}

/**
 * Renders inline markdown backtick spans (`token`) as crisp styled monospace pills
 * so plain UI strings never display raw literal backtick characters.
 */
export const RichInlineText: React.FC<Props> = ({ text, className }) => {
  if (!text.includes("`")) {
    return className ? <span className={className}>{text}</span> : <>{text}</>;
  }

  const parts = text.split(/(`[^`\n]+`)/g);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          const inner = part.slice(1, -1);
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-800/90 text-emerald-300 border border-zinc-700/80 font-mono text-[0.9em]"
            >
              {inner}
            </code>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};

