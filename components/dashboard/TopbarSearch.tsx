"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useNetworkOverview } from "@/lib/hooks/use-overview";
import { formatNumber } from "@/lib/format";

interface SearchResult {
  key: string;
  kind: "drug" | "hospital";
  label: string;
  sublabel: string;
}

export default function TopbarSearch() {
  const router = useRouter();
  const overviewQuery = useNetworkOverview();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !overviewQuery.data) return [];

    const drugMap = new Map<string, SearchResult>();
    const hospitalMap = new Map<string, SearchResult>();

    for (const item of overviewQuery.data) {
      const drugMatches =
        item.drug.generic_name.toLowerCase().includes(q) ||
        item.drug.trade_name.toLowerCase().includes(q);
      if (drugMatches && !drugMap.has(item.drug.id)) {
        drugMap.set(item.drug.id, {
          key: `drug-${item.drug.id}`,
          kind: "drug",
          label: item.drug.generic_name,
          sublabel: item.drug.trade_name,
        });
      }

      const hospitalMatches = item.hospital.name.toLowerCase().includes(q);
      if (hospitalMatches && !hospitalMap.has(item.hospital.id)) {
        hospitalMap.set(item.hospital.id, {
          key: `hospital-${item.hospital.id}`,
          kind: "hospital",
          label: item.hospital.name,
          sublabel: `คลังยาพร้อมจ่าย ${formatNumber(item.available_quantity)}+ หน่วย`,
        });
      }
    }

    return [...drugMap.values(), ...hospitalMap.values()].slice(0, 8);
  }, [query, overviewQuery.data]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (result.kind === "drug") {
      router.push(`/dashboard/inventory?q=${encodeURIComponent(result.label)}`);
    } else {
      router.push("/dashboard/overview");
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative ml-2 w-64 max-w-xs flex-shrink-0">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-lo"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ค้นหายา / โรงพยาบาล..."
          className="w-full rounded-lg border border-border bg-bg py-1.5 pl-8 pr-3 text-[12px] text-text-hi placeholder:text-text-lo/70 outline-none focus:border-accent"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-2 top-9 z-50 w-72 overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-black/40">
          <div className="max-h-72 overflow-y-auto">
            {overviewQuery.isLoading ? (
              <div className="px-3.5 py-4 text-center text-[12px] text-text-lo">
                กำลังโหลด...
              </div>
            ) : results.length === 0 ? (
              <div className="px-3.5 py-4 text-center text-[12px] text-text-lo">
                ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result.key}
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-panel-hover"
                >
                  <div>
                    <div className="text-[12px] font-medium text-text-hi">{result.label}</div>
                    <div className="text-[10px] text-text-lo">{result.sublabel}</div>
                  </div>
                  <span className="flex-shrink-0 rounded bg-bg px-1.5 py-0.5 text-[9px] text-text-lo">
                    {result.kind === "drug" ? "ยา" : "โรงพยาบาล"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
