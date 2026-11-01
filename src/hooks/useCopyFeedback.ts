"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COPY_FEEDBACK_MS = 1500;

export const useCopyFeedback = (text: string) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard can be blocked; the text stays on screen to copy by hand
    }
    setCopied(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, [text]);

  return { copied, copy };
};