"use client";

import { useState } from "react";
import {
  useDeliveries,
  useReceiveDelivery,
  useUpdateDeliveryStatus,
} from "@/lib/hooks/use-delivery";
import { useRequireSession } from "@/lib/use-require-session";
import { useToast } from "@/lib/toast";
import DeliveryListSidebar from "@/components/delivery/DeliveryListSidebar";
import DeliveryTimelinePanel from "@/components/delivery/DeliveryTimelinePanel";
import LongdoRouteMap from "@/components/delivery/LongdoRouteMap";
import ReceiveModal from "@/components/delivery/ReceiveModal";

export default function DeliveryPage() {
  const user = useRequireSession();
  const { showToast } = useToast();
  const deliveriesQuery = useDeliveries();
  const receiveMutation = useReceiveDelivery();
  const advanceMutation = useUpdateDeliveryStatus();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receiveTargetId, setReceiveTargetId] = useState<string | null>(null);

  const deliveries = deliveriesQuery.data ?? [];

  if (!user) return null;

  // เลือกรายการแรกโดย derive ตอน render เลย (ไม่ใช้ effect + setState เพื่อเลี่ยง cascading render)
  // ถ้ายังไม่มีอะไรถูกเลือกไว้ หรือของที่เลือกไว้ไม่อยู่ในลิสต์แล้ว ใช้ตัวแรกในลิสต์แทน
  const selected =
    deliveries.find((d) => d._id === selectedId) ?? deliveries[0] ?? null;
  const receiveTarget = deliveries.find((d) => d._id === receiveTargetId) ?? null;

  // ปุ่ม "เซ็นรับยา" / "เริ่มจัดส่ง" แสดงให้ Nurse/Chief_Pharmacist ทุกคน ไม่เช็ค radius อัตโนมัติ ตามสเปก MVP
  const canReceive = user.role === "Nurse" || user.role === "Chief_Pharmacist";
  const canAdvanceStatus = user.role === "Chief_Pharmacist" || user.role === "Admin";

  function handleConfirmReceive(lotNumber: string) {
    if (!receiveTargetId) return;
    receiveMutation.mutate(
      { id: receiveTargetId, lotNumber },
      {
        onSuccess: (result) => {
          if (result.success) {
            showToast(result.message, "success");
            setReceiveTargetId(null);
          } else {
            showToast(result.message, "error");
          }
        },
        onError: (err: unknown) => {
          showToast(err instanceof Error ? err.message : "เซ็นรับยาไม่สำเร็จ", "error");
        },
      }
    );
  }

  function handleMarkEnRoute(id: string) {
    advanceMutation.mutate(
      { id, status: "EN_ROUTE" },
      {
        onSuccess: () => showToast("เปลี่ยนสถานะเป็นกำลังจัดส่งแล้ว", "success"),
        onError: (err: unknown) => {
          showToast(err instanceof Error ? err.message : "อัปเดตสถานะไม่สำเร็จ", "error");
        },
      }
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h1 className="text-[15px] font-semibold text-text-hi">สถานะการจัดส่งยา</h1>

      {deliveriesQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-[13px] text-text-lo">
          กำลังโหลดข้อมูลการจัดส่ง...
        </div>
      ) : deliveriesQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[13px] text-critical">
          <span>โหลดข้อมูลการจัดส่งไม่สำเร็จ</span>
          <button
            onClick={() => deliveriesQuery.refetch()}
            className="rounded-md border border-critical/40 px-3 py-1 text-[12px] hover:bg-critical/10"
          >
            ลองใหม่
          </button>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[13px] text-text-lo">
          ไม่มีรายการจัดส่งในขณะนี้ — รายการจะปรากฏที่นี่หลังคำขอยืมยาถูกอนุมัติ
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
          <DeliveryListSidebar
            deliveries={deliveries}
            selectedId={selected?._id ?? null}
            myHospitalId={user.hospitalObjectId}
            onSelect={setSelectedId}
          />

          {selected && (
            <>
              <div className="min-h-[260px] flex-1">
                <LongdoRouteMap
                  fromHospitalName={selected.from_hospital_name ?? ""}
                  toHospitalName={selected.to_hospital_name ?? ""}
                  fromCoordinates={selected.from_coordinates}
                  toCoordinates={selected.to_coordinates}
                />
              </div>

              <DeliveryTimelinePanel
                delivery={selected}
                myHospitalId={user.hospitalObjectId}
                canReceive={canReceive}
                canAdvanceStatus={canAdvanceStatus}
                advancing={advanceMutation.isPending}
                onOpenReceiveModal={() => setReceiveTargetId(selected._id)}
                onMarkEnRoute={() => handleMarkEnRoute(selected._id)}
              />
            </>
          )}
        </div>
      )}

      <ReceiveModal
        delivery={receiveTarget}
        receivedByName={user.name}
        submitting={receiveMutation.isPending}
        onClose={() => setReceiveTargetId(null)}
        onConfirm={handleConfirmReceive}
      />
    </div>
  );
}
