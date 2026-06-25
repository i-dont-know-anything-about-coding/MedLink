"use client";

import { Search } from "lucide-react";
import type { DrugCategory } from "@/lib/types";

export type CategoryFilter = "all" | DrugCategory;
export type StatusFilter = "all" | "critical" | "normal";

interface FilterPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  counts: {
    all: number;
    highAlert: number;
    general: number;
    controlled: number;
    critical: number;
    normal: number;
  };
}

function FilterOption({
  active,
  dotClassName,
  label,
  count,
  onClick,
}: {
  active: boolean;
  dotClassName: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
        active ? "bg-accent-dim text-accent" : "text-text-lo hover:bg-panel-hover hover:text-text-hi"
      }`}
    >
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClassName}`} />
      <span className="flex-1">{label}</span>
      <span className="font-data text-[11px] text-text-lo">{count}</span>
    </button>
  );
}

export default function FilterPanel({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  counts,
}: FilterPanelProps) {
  return (
    <aside className="flex w-60 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-panel p-3">
      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-lo"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหายา..."
          className="w-full rounded-lg border border-border bg-bg py-2 pl-8 pr-3 text-[12px] text-text-hi placeholder:text-text-lo/70 outline-none focus:border-accent"
        />
      </div>

      <div>
        <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-text-lo">
          หมวดหมู่ยา
        </div>
        <div className="flex flex-col gap-0.5">
          <FilterOption
            active={category === "all"}
            dotClassName="bg-text-lo"
            label="ทั้งหมด"
            count={counts.all}
            onClick={() => onCategoryChange("all")}
          />
          <FilterOption
            active={category === "High-Alert Emergency"}
            dotClassName="bg-critical"
            label="High-Alert ฉุกเฉิน"
            count={counts.highAlert}
            onClick={() => onCategoryChange("High-Alert Emergency")}
          />
          <FilterOption
            active={category === "General"}
            dotClassName="bg-text-lo"
            label="ยาทั่วไป"
            count={counts.general}
            onClick={() => onCategoryChange("General")}
          />
          <FilterOption
            active={category === "Controlled"}
            dotClassName="bg-warning"
            label="ยาควบคุมพิเศษ"
            count={counts.controlled}
            onClick={() => onCategoryChange("Controlled")}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-text-lo">
          สถานะสต็อก
        </div>
        <div className="flex flex-col gap-0.5">
          <FilterOption
            active={status === "all"}
            dotClassName="bg-text-lo"
            label="ทั้งหมด"
            count={counts.all}
            onClick={() => onStatusChange("all")}
          />
          <FilterOption
            active={status === "critical"}
            dotClassName="bg-critical"
            label="วิกฤต"
            count={counts.critical}
            onClick={() => onStatusChange("critical")}
          />
          <FilterOption
            active={status === "normal"}
            dotClassName="bg-safe"
            label="ปกติ"
            count={counts.normal}
            onClick={() => onStatusChange("normal")}
          />
        </div>
      </div>
    </aside>
  );
}
