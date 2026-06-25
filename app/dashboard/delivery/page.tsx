"use client";

import { useState } from "react";
import { useDeliveries, useReceiveDelivery } from "@/lib/hooks/use-delivery";
import { useRequireSession } from "@/lib/use-require-session";
import { useToast } from "@/lib/toast";
import DeliveryCard from "@/components/delivery/DeliveryCard";
import ReceiveModal from "@/components/delivery/ReceiveModal";

export default function DeliveryPage() {
  const user = useRequireSession();
  const { showToast } = useToast();
  const deliveriesQuery = useDeliveries();
  const receiveMutation = useReceiveDelivery();

  const [receiveTargetId, setReceiveTargetId] = useState<string | null>(null);

  if (!user) return null;

  const deliveries = deliveriesQuery.data ?? [];
  const receiveTarget = deliveries.find((d) => d._id === receiveTargetId) ?? null;

  // ปุ่ม "เซ็นรับยา" แสดงตลอดสำหรับ role Nurse/Chief_Pharmacist ไม่เช็ค radius อัตโนมัติ ตามสเปก MVP
  const canReceive = user.role === "Nurse" || user.role === "Chief_Pharmacist";

  function handleConfirmReceive(lotNumber: string) {
    if (!receiveTargetId || !user) return;
    receiveMutation.mutate(
      { id: receiveTargetId, lotNumber, receivedBy: user.name },
      {
        onSuccess: (result) => {
          if (result.success) {
            showToast(result.message, "success");
            setReceiveTargetId(null);
          } else {
            showToast(result.message, "error");
          }
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
      ) : deliveries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[13px] text-text-lo">
          ไม่มีรายการจัดส่งในขณะนี้
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery._id}
              delivery={delivery}
              canReceive={canReceive}
              onOpenReceiveModal={() => setReceiveTargetId(delivery._id)}
            />
          ))}
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
