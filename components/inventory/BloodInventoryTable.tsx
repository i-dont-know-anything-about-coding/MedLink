"use client";

import type { BloodInventoryItem } from "@/lib/types";
import { bloodExpiryUrgencyClass, componentTypeLabel, formatNumber } from "@/lib/format";

interface BloodInventoryTableProps {
  items: BloodInventoryItem[];
}

/** หาถุงเลือดที่ใกล้หมดอายุที่สุดในรายการ lots[] ของแต่ละรายการ */
function nearestExpiry(item: BloodInventoryItem): string | null {
  if (item.lots.length === 0) return null;
  const sorted = [...item.lots].sort(
    (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  );
  return sorted[0].expiry_date;
}

export default function BloodInventoryTable({ items }: BloodInventoryTableProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="text-[14px] font-semibold text-text-hi">คลังเลือด — โรงพยาบาลของฉัน</div>
        <div className="text-[11px] text-text-lo">{items.length} รายการ</div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="sticky top-0 bg-panel">
            <tr className="text-[11px] uppercase tracking-wide text-text-lo">
              <th className="px-4 py-2.5 font-medium">หมู่เลือด</th>
              <th className="px-4 py-2.5 font-medium">ชนิดส่วนประกอบ</th>
              <th className="px-4 py-2.5 font-medium">พร้อมจ่าย</th>
              <th className="px-4 py-2.5 font-medium">Safety Stock</th>
              <th className="px-4 py-2.5 font-medium">ถุงใกล้หมดอายุสุด</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isCritical = item.available_units <= item.safety_unit_level;
              const isWarning =
                !isCritical && item.available_units <= item.safety_unit_level * 1.5;
              const expiry = nearestExpiry(item);
              return (
                <tr key={item._id} className="border-b border-border/60 hover:bg-panel-hover">
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-critical/10 px-1.5 py-0.5 font-data font-medium text-critical">
                      {item.blood_group}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-hi">
                    {componentTypeLabel(item.component_type)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-data ${
                        isCritical ? "text-critical" : isWarning ? "text-warning" : "text-text-hi"
                      }`}
                    >
                      {formatNumber(item.available_units)}
                    </span>
                    <span className="text-text-lo"> ยูนิต</span>
                    {item.reserved_units > 0 && (
                      <span className="ml-1.5 text-[10px] text-text-lo">
                        (จอง {formatNumber(item.reserved_units)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-data text-text-lo">
                    {formatNumber(item.safety_unit_level)}
                  </td>
                  <td className="px-4 py-2.5">
                    {expiry ? (
                      <span className={`font-data ${bloodExpiryUrgencyClass(expiry)}`}>
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
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-lo">
                  ไม่พบรายการเลือดที่ตรงกับตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
