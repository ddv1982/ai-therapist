'use client';

import { useEffect, useRef } from 'react';

export function useInputFooterHeight(
  inputContainerRef: React.RefObject<HTMLDivElement | null>,
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
) {
  const inputHeightRef = useRef(0);

  useEffect(() => {
    if (!inputContainerRef.current || !messagesContainerRef.current) return;
    const target = inputContainerRef.current;
    const update = () => {
      if (!messagesContainerRef.current) return;
      const height = target.offsetHeight ?? 0;
      inputHeightRef.current = height;
      messagesContainerRef.current.style.setProperty('--input-h', `${height}px`);
    };

    update();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    resizeObserver.observe(target);

    return () => {
      resizeObserver.disconnect();
    };
  }, [inputContainerRef, messagesContainerRef]);

  return { inputHeight: inputHeightRef.current };
}
