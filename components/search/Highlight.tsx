interface HighlightProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * 검색어와 일치하는 부분을 노란색으로 하이라이트
 */
export default function Highlight({ text, query, className }: HighlightProps) {
  if (!query.trim()) return <span className={className}>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
