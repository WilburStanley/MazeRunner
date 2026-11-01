"use client";

import { useCopyFeedback } from "@/hooks/useCopyFeedback";

type CopyButtonProps = { text: string; label: string; className?: string };

const CopyButton = ({ text, label, className = "button" }: CopyButtonProps) => {
  const { copied, copy } = useCopyFeedback(text);
  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
};

export default CopyButton;