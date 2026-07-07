"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertOctagon, CalendarClock, Pill, Droplet } from "lucide-react";
import NetworkStatCards, { type StatCardType } from "@/components/overview/NetworkStatCards";
import ExpiryTransferModal from "@/components/overview/ExpiryTransferModal";
import AlertQueue from "@/components/overview/AlertQueue";
import ExpiryQueue from "@/components/overview/ExpiryQueue";
import BloodAlertQueue from "@/components/overview/BloodAlertQueue";
import BloodExpiryQueue from "@/components/overview/BloodExpiryQueue";
import ExpandablePanel from "@/components/ui/ExpandablePanel";
import {
  useAlertQueue,
  useBloodAlertQueue,
  useBloodExpiryRedistribution,
  useExpiryRedistribution,
  useNetworkBloodOverview,
  useNetworkOverview,
} from "@/lib/hooks/use-overview";
import { useRequireSession } from "@/lib/use-require-session";
import { setRequestPrefill } from "@/lib/request-prefill";
import { useToast } from "@/lib/toast";
import type {
  AlertQueueItem,
  BloodAlertQueueItem,
  BloodExpiryRedistributionItem,
  ExpiryRedistributionItem,
} from "@/lib/types";

type ItemTab = "drug" | "blood";

export default function OverviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const user = useRequireSession();
  const [itemTab, setItemTabState] = useState<ItemTab>("drug");
  const [selectedStatCard, setSelectedStatCard] = useState<StatCardType | null>(null);
  const [selectedExpiryTransfer, setSelectedExpiryTransfer] =
  useState<ExpiryRedistributionItem | null>(null);

  // สลับแท็บยา/เลือดแล้วต้องเคลียร์การ์ดที่เลือกไว้ เพราะชนิดการ์ด (เช่น critical-drugs)
  // มีความหมายต่างกันคนละบริบท ถ้าไม่เคลียร์จะโชว์ผลลัพธ์ผิดบริบทค้างอยู่
  // พอกดแท็บเลือด ให้เปิดตารางสรุปยอดถุงเลือด (หมู่เลือด x คอมโพเนนต์) ให้เห็นทันที
  // ไม่ต้องกดการ์ดเพิ่มอีกที ตรงกับความต้องการของคนทำงานธนาคารเลือด
  function setItemTab(next: ItemTab) {
    setItemTabState(next);
    setSelectedStatCard(null);
  }

  const overviewQuery = useNetworkOverview();
  const bloodOverviewQuery = useNetworkBloodOverview();
  const alertQuery = useAlertQueue();
  const expiryQuery = useExpiryRedistribution();
  const bloodAlertQuery = useBloodAlertQueue();
  const bloodExpiryQuery = useBloodExpiryRedistribution();

  if (!user) return null;

  // แสดงเฉพาะรายการของ รพ. ที่ login อยู่เท่านั้น (ไม่ใช่ของทั้งเครือข่าย)
  // คิวแจ้งเตือนวิกฤต: filter ด้วยชื่อ รพ. เพราะ AlertQueueItem ตอนนี้มีแค่ hospital_in_need (string)
  // TODO: ถ้า backend มี hospital_in_need_id หรือ hospital_id ให้เปลี่ยนมาเทียบด้วย id แทนชื่อ
  const ownAlertItems = (alertQuery.data ?? []).filter(
    (item) => item.hospital_in_need === user.hospitalName
  );

  // ยาเสี่ยงหมดอายุ: filter ด้วย from_hospital_id ที่มีอยู่แล้วในข้อมูล
  const ownExpiryItems = (expiryQuery.data ?? []).filter(
    (item) => item.from_hospital_id === user.hospitalObjectId
  );

  // 🩸 คิวแจ้งเตือนเลือดวิกฤต + ถุงเลือดเสี่ยงหมดอายุของ รพ.ตัวเอง (คู่ขนานกับฝั่งยา)
  const ownBloodAlertItems = (bloodAlertQuery.data ?? []).filter(
    (item) => item.hospital_in_need === user.hospitalName
  );
  const ownBloodExpiryItems = bloodExpiryQuery.data ?? [];

  function handleRefresh() {
    overviewQuery.refetch();
    bloodOverviewQuery.refetch();
    alertQuery.refetch();
    expiryQuery.refetch();
    bloodAlertQuery.refetch();
    bloodExpiryQuery.refetch();
    showToast("รีเฟรชข้อมูลแล้ว", "info");
  }

  function goToNewRequest(prefill?: AlertQueueItem) {
    if (prefill) {
      setRequestPrefill({
        itemType: "DRUG",
        drugName: prefill.drug_name,
        donorHospitalName: prefill.ai_suggestion.hospital_name,
        donorInventoryId: prefill.ai_suggestion.donor_inventory_id,
      });
    }
    router.push("/dashboard/requests?new=1");
  }

  function goToExpiryTransfer(item: ExpiryRedistributionItem) {
    setRequestPrefill({
      itemType: "DRUG",
      drugName: item.drug_name,
      donorHospitalName: item.from_hospital,
      drugObjectId: item.drug_id,
      donorHospitalObjectId: item.from_hospital_id,
      suggestedQuantity: item.expiring_lot.quantity,
    });
    router.push("/dashboard/requests?new=1");
  }

  // 🩸 คิวแจ้งเตือนเลือดวิกฤต -> ไปหน้าคำขอพร้อม prefill หมู่เลือด/รพ.ต้นทางที่ AI แนะนำ
  function goToNewBloodRequest(item: BloodAlertQueueItem) {
    setRequestPrefill({
      itemType: "BLOOD",
      drugName: "",
      bloodGroup: item.blood_group,
      componentType: item.component_type,
      donorHospitalName: item.ai_suggestion.hospital_name,
    });
    router.push("/dashboard/requests?new=1");
  }

  function goToBloodExpiryTransfer(item: BloodExpiryRedistributionItem) {
    setRequestPrefill({
      itemType: "BLOOD",
      drugName: "",
      bloodGroup: item.blood_group,
      componentType: item.component_type,
      donorHospitalName: item.ai_suggestion.hospital_name,
      donorHospitalObjectId: item.ai_suggestion.to_hospital_id,
      suggestedQuantity: item.expiring_bag.quantity,
    });
    router.push("/dashboard/requests?new=1");
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-text-hi">
          ภาพรวมเครือข่าย{itemTab === "drug" ? "ยา" : "เลือด"} — เขตสุขภาพ 8
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-border bg-panel p-0.5">
            <button
              onClick={() => setItemTab("drug")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                itemTab === "drug" ? "bg-accent text-white" : "text-text-lo hover:text-text-hi"
              }`}
            >
              <Pill size={13} /> ยา
            </button>
            <button
              onClick={() => setItemTab("blood")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                itemTab === "blood" ? "bg-accent text-white" : "text-text-lo hover:text-text-hi"
              }`}
            >
              <Droplet size={13} /> เลือด
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-text-hi hover:bg-panel-hover"
          >
            <RefreshCw size={13} /> รีเฟรช
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {(itemTab === "drug" ? overviewQuery : bloodOverviewQuery).isLoading ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-panel text-[13px] text-text-lo">
            กำลังโหลดข้อมูลเครือข่าย...
          </div>
        ) : (itemTab === "drug" ? overviewQuery : bloodOverviewQuery).isError ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-critical/30 bg-critical/5 p-6 text-center text-[13px] text-critical">
            <span>โหลดข้อมูลเครือข่ายไม่สำเร็จ — ตรวจสอบว่า Backend เปิดอยู่หรือไม่</span>
            <button
              onClick={() =>
                itemTab === "drug" ? overviewQuery.refetch() : bloodOverviewQuery.refetch()
              }
              className="rounded-md border border-critical/40 px-3 py-1 text-[12px] hover:bg-critical/10"
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <NetworkStatCards
            itemTab={itemTab}
            drugItems={overviewQuery.data ?? []}
            bloodItems={bloodOverviewQuery.data ?? []}
            selectedCard={selectedStatCard}
            onSelectCard={setSelectedStatCard}
          />
        )}

        {!selectedStatCard && itemTab === "drug" && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            {alertQuery.isError ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-critical/30 bg-critical/5 text-[13px] text-critical">
                โหลดคิวแจ้งเตือนไม่สำเร็จ
              </div>
            ) : (
              <ExpandablePanel
                title="คิวแจ้งเตือนวิกฤต"
                className="h-full"
                badge={
                  <span className="flex items-center gap-1 rounded bg-critical/15 px-1.5 py-0.5 text-[10px] text-critical">
                    <AlertOctagon size={11} />
                    {ownAlertItems.length} รายการ
                  </span>
                }
              >
                {alertQuery.isLoading ? (
                  <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                    กำลังโหลดคิวแจ้งเตือน...
                  </div>
                ) : (
                  <AlertQueue
                    items={ownAlertItems}
                    onAction={(item) => goToNewRequest(item)}
                  />
                )}
              </ExpandablePanel>
            )}

            {expiryQuery.isError ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-critical/30 bg-critical/5 text-[13px] text-critical">
                โหลดข้อมูลยาเสี่ยงหมดอายุไม่สำเร็จ
              </div>
            ) : (
              <ExpandablePanel
                title="ยาเสี่ยงหมดอายุ"
                className="h-full"
                badge={
                  <span className="flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                    <CalendarClock size={11} />
                    {ownExpiryItems.length} รายการ
                  </span>
                }
              >
                {expiryQuery.isLoading ? (
                  <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                    กำลังโหลดข้อมูลยาเสี่ยงหมดอายุ...
                  </div>
                ) : (
                <ExpiryQueue
                  items={ownExpiryItems}
                  ownHospitalObjectId={user.hospitalObjectId}
                  onTransfer={(item) => setSelectedExpiryTransfer(item)}
                />
                )}
              </ExpandablePanel>
            )}
          </div>
        )}

        {!selectedStatCard && itemTab === "blood" && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            {bloodAlertQuery.isError ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-critical/30 bg-critical/5 text-[13px] text-critical">
                โหลดคิวแจ้งเตือนเลือดไม่สำเร็จ
              </div>
            ) : (
              <ExpandablePanel
                title="คิวแจ้งเตือนเลือดวิกฤต"
                className="h-full"
                badge={
                  <span className="flex items-center gap-1 rounded bg-critical/15 px-1.5 py-0.5 text-[10px] text-critical">
                    <AlertOctagon size={11} />
                    {ownBloodAlertItems.length} รายการ
                  </span>
                }
              >
                {bloodAlertQuery.isLoading ? (
                  <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                    กำลังโหลดคิวแจ้งเตือนเลือด...
                  </div>
                ) : (
                  <BloodAlertQueue items={ownBloodAlertItems} onAction={goToNewBloodRequest} />
                )}
              </ExpandablePanel>
            )}

            {bloodExpiryQuery.isError ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-critical/30 bg-critical/5 text-[13px] text-critical">
                โหลดข้อมูลเลือดเสี่ยงหมดอายุไม่สำเร็จ
              </div>
            ) : (
              <ExpandablePanel
                title="เลือดเสี่ยงหมดอายุ (7 วัน)"
                className="h-full"
                badge={
                  <span className="flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                    <CalendarClock size={11} />
                    {ownBloodExpiryItems.length} รายการ
                  </span>
                }
              >
                {bloodExpiryQuery.isLoading ? (
                  <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                    กำลังโหลดข้อมูลเลือดเสี่ยงหมดอายุ...
                  </div>
                ) : (
                  <BloodExpiryQueue
                    items={ownBloodExpiryItems}
                    ownHospitalObjectId={user.hospitalObjectId}
                    onAction={goToBloodExpiryTransfer}
                  />
                )}
              </ExpandablePanel>
            )}
          </div>
        )}
      </div>

      {selectedExpiryTransfer && (
        <ExpiryTransferModal
          item={selectedExpiryTransfer}
          user={user}
          onClose={() => setSelectedExpiryTransfer(null)}
        />
      )}
    </div>
  );
}