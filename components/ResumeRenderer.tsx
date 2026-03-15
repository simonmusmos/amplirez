import { parseResume, ResumeBlock } from "@/lib/resume/parser";

interface ResumeRendererProps {
  text: string;
}

/**
 * Renders resume plain text as a properly formatted, styled resume.
 * Matches the visual structure of the PDF output.
 */
export default function ResumeRenderer({ text }: ResumeRendererProps) {
  const blocks = parseResume(text);

  return (
    <div className="font-serif text-[10.5pt] leading-relaxed text-gray-900 p-8">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ResumeBlock }) {
  switch (block.type) {
    case "name":
      return (
        <h1 className="text-2xl font-bold text-center tracking-tight mb-1">
          {block.text}
        </h1>
      );

    case "contact":
      return (
        <p className="text-center text-xs text-gray-500 mb-0.5">
          {block.text}
        </p>
      );

    case "section":
      return (
        <div className="mt-4 mb-1.5 border-b border-gray-800 pb-0.5">
          <h2 className="text-[8.5pt] font-bold tracking-widest uppercase text-gray-900">
            {block.text}
          </h2>
        </div>
      );

    case "bullet":
      return (
        <div className="flex gap-2 mb-0.5 pl-1.5 text-[10pt]">
          <span className="mt-[2px] flex-shrink-0 text-gray-600">•</span>
          <span>{block.text}</span>
        </div>
      );

    case "text":
      return (
        <p className="mb-0.5 text-[10pt]">
          {block.text}
        </p>
      );
  }
}
