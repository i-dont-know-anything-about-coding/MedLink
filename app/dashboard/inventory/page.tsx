"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pill, Droplet } from "lucide-react";
import FilterPanel, {
  type CategoryFilter,
  type StatusFilter,
} from "@/components/inventory/FilterPanel";
import InventoryTable from "@/components/inventory/InventoryTable";
import BloodInventoryTable from "@/components/inventory/BloodInventoryTable";
import { useOwnBloodInventory, useOwnInventory } from "@/lib/hooks/use-inventory";
import { useRequireSession } from "@/lib/use-require-session";
import { useToast } from "@/lib/toast";

type ItemTab = "drug" | "blood";

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[13px] text-text-lo">
          กำลังโหลด...
        </div>
      }
    >
      <InventoryPageInner />
    </Suspense>
  );
}

function InventoryPageInner() {
  const user = useRequireSession();
  const { showToast } = useToast();
  const [itemTab, setItemTab] = useState<ItemTab>("drug");

  const {
    data: items,
    isLoading,
    isError,
    refetch,
  } = useOwnInventory(user?.hospitalObjectId);
  const {
    data: bloodItems,
    isLoading: bloodLoading,
    isError: bloodIsError,
    refetch: refetchBlood,
  } = useOwnBloodInventory(user?.hospitalObjectId);
  const searchParams = useSearchParams();

  // รับคำค้นที่ส่งมาจาก TopbarSearch ผ่าน ?q= แค่ตอน mount ครั้งแรก
  // (ใช้ lazy initializer แทน useEffect+setState เพื่อเลี่ยง cascading render)
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>("all");
  const [bloodStatus, setBloodStatus] = useState<StatusFilter>("all");

  const ownItems = useMemo(() => items ?? [], [items]);
  const ownBloodItems = useMemo(() => bloodItems ?? [], [bloodItems]);

  const filtered = useMemo(() => {
    return ownItems.filter((item) => {
      if (
        search &&
        !`${item.drug_ref.generic_name} ${item.drug_ref.trade_name}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      if (category !== "all" && item.drug_ref.category !== category) return false;

      const isCritical = item.available_quantity <= item.safety_stock_level;
      if (status === "critical" && !isCritical) return false;
      if (status === "normal" && isCritical) return false;

      return true;
    });
  }, [ownItems, search, category, status]);

  const filteredBlood = useMemo(() => {
    return ownBloodItems.filter((item) => {
      if (bloodGroupFilter !== "all" && item.blood_group !== bloodGroupFilter) return false;

      const isCritical = item.available_units <= item.safety_unit_level;
      if (bloodStatus === "critical" && !isCritical) return false;
      if (bloodStatus === "normal" && isCritical) return false;

      return true;
    });
  }, [ownBloodItems, bloodGroupFilter, bloodStatus]);

  const counts = useMemo(() => {
    const isCritical = (i: (typeof ownItems)[number]) =>
      i.available_quantity <= i.safety_stock_level;
    return {
      all: ownItems.length,
      highAlert: ownItems.filter((i) => i.drug_ref.category === "High-Alert Emergency").length,
      general: ownItems.filter((i) => i.drug_ref.category === "General").length,
      controlled: ownItems.filter((i) => i.drug_ref.category === "Controlled").length,
      critical: ownItems.filter(isCritical).length,
      normal: ownItems.filter((i) => !isCritical(i)).length,
    };
  }, [ownItems]);

  const bloodGroups = useMemo(
    () => Array.from(new Set(ownBloodItems.map((i) => i.blood_group))).sort(),
    [ownBloodItems]
  );
  const bloodCriticalCount = useMemo(
    () => ownBloodItems.filter((i) => i.available_units <= i.safety_unit_level).length,
    [ownBloodItems]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-border px-4 pt-3">
        <button
          onClick={() => setItemTab("drug")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
            itemTab === "drug"
              ? "border-b-2 border-accent text-accent"
              : "text-text-lo hover:text-text-hi"
          }`}
        >
          <Pill size={14} /> คลังยา
        </button>
        <button
          onClick={() => setItemTab("blood")}
          className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
            itemTab === "blood"
              ? "border-b-2 border-accent text-accent"
              : "text-text-lo hover:text-text-hi"
          }`}
        >
          <Droplet size={14} /> คลังเลือด
          {bloodCriticalCount > 0 && (
            <span className="ml-1.5 rounded bg-critical/15 px-1.5 py-0.5 text-[10px] text-critical">
              {bloodCriticalCount}
            </span>
          )}
        </button>
      </div>

      {itemTab === "drug" ? (
        <div className="flex flex-1 overflow-hidden">
          <FilterPanel
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            status={status}
            onStatusChange={setStatus}
            counts={counts}
          />

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-text-lo">
              กำลังโหลดคลังยา...
            </div>
          ) : isError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[13px] text-critical">
              <span>โหลดคลังยาไม่สำเร็จ</span>
              <button
                onClick={() => {
                  refetch();
                  showToast("กำลังลองโหลดใหม่...", "info");
                }}
                className="rounded-md border border-critical/40 px-3 py-1 text-[12px] hover:bg-critical/10"
              >
                ลองใหม่
              </button>
            </div>
          ) : (
            <InventoryTable items={filtered} />
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-60 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-panel p-3">
            <div>
              <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-text-lo">
                หมู่เลือด
              </div>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setBloodGroupFilter("all")}
                  className={`rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                    bloodGroupFilter === "all"
                      ? "bg-accent-dim text-accent"
                      : "text-text-lo hover:bg-panel-hover hover:text-text-hi"
                  }`}
                >
                  ทั้งหมด
                </button>
                {bloodGroups.map((g) => (
                  <button
                    key={g}
                    onClick={() => setBloodGroupFilter(g)}
                    className={`rounded-md px-2.5 py-1.5 text-left text-[12px] font-data transition-colors ${
                      bloodGroupFilter === g
                        ? "bg-accent-dim text-accent"
                        : "text-text-lo hover:bg-panel-hover hover:text-text-hi"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-text-lo">
                สถานะสต็อก
              </div>
              <div className="flex flex-col gap-0.5">
                {(["all", "critical", "normal"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setBloodStatus(s)}
                    className={`rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                      bloodStatus === s
                        ? "bg-accent-dim text-accent"
                        : "text-text-lo hover:bg-panel-hover hover:text-text-hi"
                    }`}
                  >
                    {s === "all" ? "ทั้งหมด" : s === "critical" ? "วิกฤต" : "ปกติ"}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {bloodLoading ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-text-lo">
              กำลังโหลดคลังเลือด...
            </div>
          ) : bloodIsError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[13px] text-critical">
              <span>โหลดคลังเลือดไม่สำเร็จ</span>
              <button
                onClick={() => {
                  refetchBlood();
                  showToast("กำลังลองโหลดใหม่...", "info");
                }}
                className="rounded-md border border-critical/40 px-3 py-1 text-[12px] hover:bg-critical/10"
              >
                ลองใหม่
              </button>
            </div>
          ) : (
            <BloodInventoryTable items={filteredBlood} />
          )}
        </div>
      )}
    </div>
  );
}

