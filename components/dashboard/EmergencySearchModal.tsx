"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock3, ClipboardPlus, X, TriangleAlert } from "lucide-react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useDrugNameSearch, useEmergencyDrugSearch } from "@/lib/hooks/use-emergency-search";
import { setRequestPrefill } from "@/lib/request-prefill";
import { formatNumber } from "@/lib/format";
import type { DrugSearchResult } from "@/lib/types";

interface EmergencySearchModalProps {
  onClose: () => void;
  /** ยาที่เลือกไว้แล้วตอนเปิด Modal (เช่น มาจาก TopbarSearch) — ข้ามขั้นตอนพิมพ์ค้นหาไปเลย */
  initialDrug?: DrugSearchResult | null;
}

/**
 * ค้นหายาฉุกเฉินข้ามเครือข่าย — พิมพ์ชื่อยา -> เลือกยาที่ตรงกัน -> ระบบคำนวณ
 * รพ.ที่มียาเหลือพร้อมปล่อยยืม เรียงตามเวลาขนส่งที่เร็วที่สุด (ดึงจาก
 * POST /api/ai/search-emergency ซึ่งคำนวณระยะทาง + ETA จากพิกัด GPS จริง)
 *
 * หมายเหตุ: คอมโพเนนต์นี้ถูก mount/unmount โดยฝั่งเรียก (TopbarSearch) เท่านั้น
 * ไม่รับ prop "open" — ใช้ initialDrug ตอน mount ผ่าน lazy useState แทนการ sync
 * ด้วย useEffect+setState เพื่อเลี่ยง cascading render
 */
export default function EmergencySearchModal({
  onClose,
  initialDrug = null,
}: EmergencySearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<DrugSearchResult | null>(() => initialDrug);
  const debouncedQuery = useDebouncedValue(query, 300);

  const drugQuery = useDrugNameSearch(debouncedQuery);
  const resultsQuery = useEmergencyDrugSearch(selectedDrug?.drugObjectId ?? null);

  function handleClose() {
    setQuery("");
    setSelectedDrug(null);
    onClose();
  }

  function handleSelectDrug(drug: DrugSearchResult) {
    setSelectedDrug(drug);
  }

  function handleCreateRequest(hospital: NonNullable<typeof resultsQuery.data>[number]) {
    if (!selectedDrug) return;
    setRequestPrefill({
      drugName: selectedDrug.generic_name,
      donorHospitalName: hospital.hospital_name,
      drugObjectId: selectedDrug.drugObjectId,
      donorHospitalObjectId: hospital.hospital_id,
    });
    handleClose();
    router.push("/dashboard/requests?new=1");
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-black/60 px-4 pt-[8vh]"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-text-hi">
            <Search size={16} className="text-accent" />
            ค้นหายาฉุกเฉิน
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-lo transition-colors hover:bg-panel-hover hover:text-text-hi"
          >
            <X size={15} />
          </button>
        </div>

        <div className="border-b border-border p-3">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-lo"
            />
            <input
              autoFocus
              type="text"
              value={selectedDrug ? selectedDrug.generic_name : query}
              onChange={(e) => {
                setSelectedDrug(null);
                setQuery(e.target.value);
              }}
              placeholder="พิมพ์ชื่อยา เช่น Tenecteplase, Heparin..."
              className="w-full rounded-lg border border-border bg-bg py-2.5 pl-8 pr-3 text-[13px] text-text-hi placeholder:text-text-lo/70 outline-none focus:border-accent"
            />
          </div>

          {!selectedDrug && query.trim().length >= 2 && (
            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-border bg-bg">
              {drugQuery.isLoading ? (
                <div className="px-3 py-3 text-center text-[12px] text-text-lo">
                  กำลังค้นหา...
                </div>
              ) : (drugQuery.data ?? []).length === 0 ? (
                <div className="px-3 py-3 text-center text-[12px] text-text-lo">
                  ไม่พบยาที่ตรงกับ &quot;{query}&quot;
                </div>
              ) : (
                (drugQuery.data ?? []).map((drug) => (
                  <button
                    key={drug.drugObjectId}
                    onClick={() => handleSelectDrug(drug)}
                    className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-panel-hover"
                  >
                    <div>
                      <div className="text-[12px] font-medium text-text-hi">
                        {drug.generic_name}
                      </div>
                      <div className="text-[10px] text-text-lo">{drug.trade_name}</div>
                    </div>
                    <span className="flex-shrink-0 rounded bg-bg px-1.5 py-0.5 text-[9px] text-text-lo">
                      {drug.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!selectedDrug ? (
            <div className="flex h-32 items-center justify-center text-center text-[12px] text-text-lo">
              พิมพ์ชื่อยาแล้วเลือกจากรายการ เพื่อค้นหาโรงพยาบาลที่มียาเหลือ
              <br />
              และคำนวณเส้นทาง/เวลาขนส่งที่เร็วที่สุดให้อัตโนมัติ
            </div>
          ) : resultsQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center text-[12px] text-text-lo">
              กำลังคำนวณเส้นทางและเวลาขนส่ง...
            </div>
          ) : resultsQuery.isError ? (
            <div className="flex h-32 items-center justify-center text-[12px] text-critical">
              ค้นหาไม่สำเร็จ — กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้
            </div>
          ) : (resultsQuery.data ?? []).length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center text-[12px] text-text-lo">
              ไม่พบโรงพยาบาลในเครือข่ายที่มี {selectedDrug.generic_name} เหลือพร้อมปล่อยยืม
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(resultsQuery.data ?? []).map((hospital, idx) => (
                <div
                  key={hospital.inventory_id}
                  className={`rounded-lg border p-3 ${
                    idx === 0 ? "border-accent/40 bg-accent-dim" : "border-border bg-bg"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-text-hi">
                      <MapPin size={13} className="flex-shrink-0 text-accent" />
                      {hospital.hospital_name}
                    </div>
                    {idx === 0 && (
                      <span className="flex-shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                        เร็วที่สุด
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-lo">
                    <span className="flex items-center gap-1">
                      <Clock3 size={11} /> ถึงใน ~{hospital.estimated_time_minutes} นาที
                      {hospital.is_estimate && (
                        <span
                          title="คำนวณจากระยะทางเส้นตรงโดยประมาณ (ระบบเส้นทางจริงเรียกไม่สำเร็จชั่วคราว)"
                          className="flex items-center text-warning"
                        >
                          <TriangleAlert size={11} />
                        </span>
                      )}
                    </span>
                    <span>{hospital.distance_km} กม.</span>
                    <span>มียา {formatNumber(hospital.available_quantity)} หน่วย</span>
                  </div>

                  <div className="mt-2.5 flex justify-end">
                    <button
                      onClick={() => handleCreateRequest(hospital)}
                      className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90"
                    >
                      <ClipboardPlus size={13} /> สร้างใบยืมยา
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
