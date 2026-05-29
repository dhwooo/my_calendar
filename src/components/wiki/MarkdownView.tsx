"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
};

export function MarkdownView({ content, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-[28px] prose-h2:text-[22px] prose-h3:text-[18px]",
        "prose-p:my-3 prose-p:leading-[1.75]",
        "prose-a:text-fg prose-a:underline-offset-4 hover:prose-a:opacity-80",
        "prose-strong:text-fg",
        "prose-code:rounded prose-code:bg-bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:rounded-xl prose-pre:bg-bg-muted prose-pre:text-fg prose-pre:p-4 prose-pre:text-[13px]",
        "prose-blockquote:border-l-2 prose-blockquote:border-fg/20 prose-blockquote:bg-bg-subtle/40 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-fg-muted prose-blockquote:rounded-r-lg",
        "prose-hr:border-border/60",
        "prose-ul:my-3 prose-ol:my-3",
        "prose-li:my-1",
        "prose-img:rounded-xl",
        "prose-table:rounded-xl prose-table:overflow-hidden",
        "prose-th:bg-bg-subtle prose-th:text-fg prose-th:font-medium",
        "prose-td:border-border/60",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: (props) =>
            props.type === "checkbox" ? (
              <input
                {...props}
                disabled={false}
                className="mr-1.5 h-3.5 w-3.5 align-middle accent-fg"
              />
            ) : (
              <input {...props} />
            ),
        }}
      >
        {content || "_여기에 마크다운을 작성해보세요. `/` 를 입력하면 명령 메뉴가 열립니다._"}
      </ReactMarkdown>
    </div>
  );
}
