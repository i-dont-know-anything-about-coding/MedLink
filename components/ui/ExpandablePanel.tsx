"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

interface ExpandablePanelProps {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper สำหรับ panel ที่เนื้อหาอาจไม่เต็มจอ (เช่น list/card สั้นๆ) — ใส่ปุ่ม
 * ขยายมุมขวาบนให้เปิดดูแบบเต็มจอได้ ใช้ children เดียวกันทั้ง inline และ expanded
 * view เพื่อไม่ต้องเขียนเนื้อหาซ้ำสองที่
 */
export default function ExpandablePanel({
  title,
  badge,
  children,
  className = "",
}: ExpandablePanelProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  return (
    <>
      <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-panel ${className}`}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-text-hi">
            {title}
            {badge}
          </div>
          <button
            title="ขยายเต็มจอ"
            onClick={() => setExpanded(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-lo transition-colors hover:bg-panel-hover hover:text-text-hi"
          >
            <Maximize2 size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 sm:p-8"
          onClick={() => setExpanded(false)}
        >
          <div
            className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-text-hi">
                {title}
                {badge}
              </div>
              <button
                title="ปิด"
                onClick={() => setExpanded(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-lo transition-colors hover:bg-panel-hover hover:text-text-hi"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
