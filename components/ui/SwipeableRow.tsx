"use client";

import { useState, useRef } from "react";

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

const DELETE_WIDTH = 76; // px — width of the delete button revealed on swipe
const TRIGGER_THRESHOLD = 50; // px — how far to swipe before snapping open

export default function SwipeableRow({ onDelete, children }: Props) {
  const [offsetX, setOffsetX] = useState(0);
  const [snapped, setSnapped] = useState(false); // true = delete button fully revealed
  const [deleting, setDeleting] = useState(false);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!draggingRef.current) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (snapped) {
      // Already open: allow sliding back to right
      const newOffset = Math.min(0, -DELETE_WIDTH + Math.max(0, dx));
      setOffsetX(newOffset);
    } else {
      // Closed: allow sliding left only
      if (dx < 0) setOffsetX(Math.max(dx, -DELETE_WIDTH - 10));
    }
  }

  function handleTouchEnd() {
    draggingRef.current = false;
    if (offsetX < -TRIGGER_THRESHOLD) {
      // Snap open
      setOffsetX(-DELETE_WIDTH);
      setSnapped(true);
    } else {
      // Snap closed
      setOffsetX(0);
      setSnapped(false);
    }
  }

  function handleClose() {
    setOffsetX(0);
    setSnapped(false);
  }

  function handleDelete() {
    setDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 250);
  }

  return (
    <div
      className={`relative overflow-hidden transition-all duration-250 ${deleting ? "opacity-0 max-h-0" : "max-h-40"}`}
      style={{ transition: deleting ? "opacity 0.2s, max-height 0.3s" : undefined }}
    >
      {/* 削除ボタン（背景） */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={handleDelete}
          className="flex flex-col items-center text-white gap-0.5"
        >
          <span className="text-lg leading-none">🗑️</span>
          <span className="text-xs font-semibold">削除</span>
        </button>
      </div>

      {/* コンテンツ（前面・スライド） */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: draggingRef.current ? "none" : "transform 0.2s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={snapped ? handleClose : undefined}
        className="relative bg-white z-10"
      >
        {children}
      </div>
    </div>
  );
}
