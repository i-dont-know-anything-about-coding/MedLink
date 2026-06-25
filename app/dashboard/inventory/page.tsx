"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FilterPanel, {
  type CategoryFilter,
  type StatusFilter,
} from "@/components/inventory/FilterPanel";
import InventoryTable from "@/components/inventory/InventoryTable";
import { useOwnInventory } from "@/lib/hooks/use-inventory";
import { useRequireSession } from "@/lib/use-require-session";
import { useToast } from "@/lib/toast";

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
  const {
    data: items,
    isLoading,
    isError,
    refetch,
  } = useOwnInventory(user?.hospitalObjectId);
  const searchParams = useSearchParams();

  // รับคำค้นที่ส่งมาจาก TopbarSearch ผ่าน ?q= แค่ตอน mount ครั้งแรก
  // (ใช้ lazy initializer แทน useEffect+setState เพื่อเลี่ยง cascading render)
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const ownItems = useMemo(() => items ?? [], [items]);

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

  return (
    <div className="flex h-full">
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
  );
}
