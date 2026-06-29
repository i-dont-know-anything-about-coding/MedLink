"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, AlertOctagon, CalendarClock } from "lucide-react";
import NetworkStatCards from "@/components/overview/NetworkStatCards";
import AlertQueue from "@/components/overview/AlertQueue";
import ExpiryQueue from "@/components/overview/ExpiryQueue";
import ExpandablePanel from "@/components/ui/ExpandablePanel";
import {
  useAlertQueue,
  useExpiryRedistribution,
  useNetworkOverview,
} from "@/lib/hooks/use-overview";
import { useRequireSession } from "@/lib/use-require-session";
import { setRequestPrefill } from "@/lib/request-prefill";
import { useToast } from "@/lib/toast";
import type { AlertQueueItem, ExpiryRedistributionItem } from "@/lib/types";

export default function OverviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const user = useRequireSession();

  const overviewQuery = useNetworkOverview();
  const alertQuery = useAlertQueue();
  const expiryQuery = useExpiryRedistribution();

  if (!user) return null;

  function handleRefresh() {
    overviewQuery.refetch();
    alertQuery.refetch();
    expiryQuery.refetch();
    showToast("รีเฟรชข้อมูลแล้ว", "info");
  }

  function goToNewRequest(prefill?: AlertQueueItem) {
    if (prefill) {
      setRequestPrefill({
        drugName: prefill.drug_name,
        donorHospitalName: prefill.ai_suggestion.hospital_name,
        donorInventoryId: prefill.ai_suggestion.donor_inventory_id,
      });
    }
    router.push("/dashboard/requests?new=1");
  }

  // เฉพาะ รพ. ที่ AI แนะนำให้เป็นผู้รับยา (ai_suggestion.to_hospital_id === เรา) เท่านั้นที่กดปุ่มนี้ได้
  // เพราะคำขอยืมยาในระบบสร้างจากมุมมอง "เราขอยืมจาก from_hospital" เสมอ
  function goToExpiryTransfer(item: ExpiryRedistributionItem) {
    setRequestPrefill({
      drugName: item.drug_name,
      donorHospitalName: item.from_hospital,
      drugObjectId: item.drug_id,
      donorHospitalObjectId: item.from_hospital_id,
      suggestedQuantity: item.expiring_lot.quantity,
    });
    router.push("/dashboard/requests?new=1");
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-text-hi">
          ภาพรวมเครือข่ายยา — เขตสุขภาพ 8
        </h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-text-hi hover:bg-panel-hover"
        >
          <RefreshCw size={13} /> รีเฟรช
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {overviewQuery.isLoading ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-panel text-[13px] text-text-lo">
            กำลังโหลดข้อมูลเครือข่าย...
          </div>
        ) : overviewQuery.isError ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-critical/30 bg-critical/5 p-6 text-center text-[13px] text-critical">
            <span>โหลดข้อมูลเครือข่ายไม่สำเร็จ — ตรวจสอบว่า Backend เปิดอยู่หรือไม่</span>
            <button
              onClick={() => overviewQuery.refetch()}
              className="rounded-md border border-critical/40 px-3 py-1 text-[12px] hover:bg-critical/10"
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <NetworkStatCards items={overviewQuery.data ?? []} />
        )}

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
                  {alertQuery.data?.length ?? 0} รายการ
                </span>
              }
            >
              {alertQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                  กำลังโหลดคิวแจ้งเตือน...
                </div>
              ) : (
                <AlertQueue
                  items={alertQuery.data ?? []}
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
                  {expiryQuery.data?.length ?? 0} รายการ
                </span>
              }
            >
              {expiryQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                  กำลังโหลดข้อมูลยาเสี่ยงหมดอายุ...
                </div>
              ) : (
                <ExpiryQueue
                  items={expiryQuery.data ?? []}
                  ownHospitalObjectId={user.hospitalObjectId}
                  onAction={(item) => goToExpiryTransfer(item)}
                />
              )}
            </ExpandablePanel>
          )}
        </div>
      </div>
    </div>
  );
}
