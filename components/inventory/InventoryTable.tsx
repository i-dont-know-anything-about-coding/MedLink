"use client";

import type { InventoryItem } from "@/lib/types";
import { categoryBadgeClasses, categoryLabel, expiryUrgencyClass, formatNumber } from "@/lib/format";

interface InventoryTableProps {
  items: InventoryItem[];
}

/** หาล็อตที่ใกล้หมดอายุที่สุดในรายการ lots[] ของแต่ละ inventory item */
function nearestExpiry(item: InventoryItem): string | null {
  if (item.lots.length === 0) return null;
  const sorted = [...item.lots].sort(
    (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  );
  return sorted[0].expiry_date;
}

export default function InventoryTable({ items }: InventoryTableProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="text-[14px] font-semibold text-text-hi">คลังยา — โรงพยาบาลของฉัน</div>
        <div className="text-[11px] text-text-lo">{items.length} รายการ</div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="sticky top-0 bg-panel">
            <tr className="text-[11px] uppercase tracking-wide text-text-lo">
              <th className="px-4 py-2.5 font-medium">ชื่อยา</th>
              <th className="px-4 py-2.5 font-medium">หมวดหมู่</th>
              <th className="px-4 py-2.5 font-medium">พร้อมจ่าย / รวม</th>
              <th className="px-4 py-2.5 font-medium">Safety Stock</th>
              <th className="px-4 py-2.5 font-medium">ล็อตใกล้หมดอายุสุด</th>
              <th className="px-4 py-2.5 font-medium">ห้อง/แผนก</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isCritical = item.available_quantity <= item.safety_stock_level;
              const isWarning =
                !isCritical && item.available_quantity <= item.safety_stock_level * 1.5;
              const expiry = nearestExpiry(item);
              return (
                <tr
                  key={item._id}
                  className="border-b border-border/60 hover:bg-panel-hover"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-text-hi">{item.drug_ref.generic_name}</div>
                    <div className="text-[11px] text-text-lo">{item.drug_ref.trade_name}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryBadgeClasses(
                        item.drug_ref.category
                      )}`}
                    >
                      {categoryLabel(item.drug_ref.category)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-data ${
                        isCritical ? "text-critical" : isWarning ? "text-warning" : "text-text-hi"
                      }`}
                    >
                      {formatNumber(item.available_quantity)}
                    </span>
                    <span className="text-text-lo"> / {formatNumber(item.quantity)}</span>
                    {item.reserved_quantity > 0 && (
                      <span className="ml-1.5 text-[10px] text-text-lo">
                        (จอง {formatNumber(item.reserved_quantity)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-data text-text-lo">
                    {formatNumber(item.safety_stock_level)}
                  </td>
                  <td className="px-4 py-2.5">
                    {expiry ? (
                      <span className={`font-data ${expiryUrgencyClass(expiry)}`}>
                        {new Date(expiry).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-text-lo">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-text-lo">{item.ward_location}</td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-lo">
                  ไม่พบรายการยาที่ตรงกับตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
