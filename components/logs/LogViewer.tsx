"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export type LogLine = { id: string | number; ts?: string; step?: string; text: string };

export function LogViewer({ lines, height = 480 }: { lines: LogLine[]; height?: number }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 18,
    overscan: 20,
  });

  const [autoFollow, setAutoFollow] = useState(true);
  useEffect(() => {
    if (!autoFollow) return;
    rowVirtualizer.scrollToIndex(lines.length - 1);
  }, [lines.length, autoFollow, rowVirtualizer]);

  function onScroll() {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 4;
    setAutoFollow(atBottom);
  }

  return (
    <div className="relative">
      {!autoFollow && (
        <button
          className="absolute right-3 top-3 z-10 rounded bg-zinc-800/80 px-2 py-1 text-xs border border-zinc-700"
          onClick={() => setAutoFollow(true)}
          aria-label="Jump to latest"
        >
          Jump to latest
        </button>
      )}
      <div ref={parentRef} onScroll={onScroll} style={{ height }} className="overflow-auto font-mono text-xs leading-4">
        <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
            const line = lines[virtualRow.index];
            return (
              <div
                key={line?.id ?? virtualRow.index}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-2 py-0.5 whitespace-pre"
              >
                {line?.step ? <span className="sticky left-0 mr-2 rounded bg-zinc-800/70 px-1 text-[10px]">{line.step}</span> : null}
                {line?.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
