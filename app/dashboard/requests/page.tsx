"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useApproveTransfer,
  useCancelTransfer,
  useInboxTransfers,
  useOutboxTransfers,
  useRejectTransfer,
  useCreateTransfer,
} from "@/lib/hooks/use-transfers";
import { useNetworkOverview } from "@/lib/hooks/use-overview";
import { useRequireSession } from "@/lib/use-require-session";
import { useToast } from "@/lib/toast";
import { consumeRequestPrefill, type RequestPrefill } from "@/lib/request-prefill";
import NewRequestForm from "@/components/requests/NewRequestForm";
import { InboxRequestCard, OutboxRequestCard } from "@/components/requests/RequestCard";
import ApproveModal from "@/components/requests/ApproveModal";
import RejectModal from "@/components/requests/RejectModal";
import type { TransferRequestRecord } from "@/lib/types";

type Tab = "inbox" | "outbox";

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[13px] text-text-lo">
          กำลังโหลด...
        </div>
      }
    >
      <RequestsPageInner />
    </Suspense>
  );
}

function RequestsPageInner() {
  const user = useRequireSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("inbox");
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [prefill] = useState<RequestPrefill | null>(() => consumeRequestPrefill());

  const [approveTarget, setApproveTarget] = useState<TransferRequestRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TransferRequestRecord | null>(null);

  const inboxQuery = useInboxTransfers();
  const outboxQuery = useOutboxTransfers();
  const overviewQuery = useNetworkOverview();

  const createMutation = useCreateTransfer();
  const approveMutation = useApproveTransfer();
  const rejectMutation = useRejectTransfer();
  const cancelMutation = useCancelTransfer();

  const inbox = inboxQuery.data ?? [];
  const outbox = outboxQuery.data ?? [];
  const pendingInboxCount = inbox.filter((t) => t.status === "PENDING").length;

  if (!user) return null;

  function handleCreateRequest(payload: {
    drugObjectId: string;
    drugName: string;
    donorHospitalObjectId: string;
    donorHospitalName: string;
    quantity: number;
    reason: string;
  }) {
    createMutation.mutate(
      {
        from_hospital: payload.donorHospitalObjectId,
        drug_ref: payload.drugObjectId,
        quantity_requested: payload.quantity,
      },
      {
        onSuccess: () => {
          showToast("ส่งคำขอยืมยาสำเร็จ — รออนุมัติจากโรงพยาบาลต้นทาง", "success");
          setShowForm(false);
          setTab("outbox");
          router.replace("/dashboard/requests");
        },
        onError: (err: unknown) => {
          showToast(err instanceof Error ? err.message : "ส่งคำขอไม่สำเร็จ", "error");
        },
      }
    );
  }

  function handleApprove(quantityApproved: number) {
    if (!approveTarget) return;
    approveMutation.mutate(
      { id: approveTarget._id, quantityApproved },
      {
        onSuccess: () => {
          showToast("อนุมัติคำขอสำเร็จ — สร้างใบจัดส่งแล้ว", "success");
          setApproveTarget(null);
        },
        onError: (err: unknown) => {
          showToast(err instanceof Error ? err.message : "อนุมัติไม่สำเร็จ", "error");
        },
      }
    );
  }

  function handleReject(reason: string) {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { id: rejectTarget._id, reason },
      {
        onSuccess: () => {
          showToast("ปฏิเสธคำขอแล้ว", "info");
          setRejectTarget(null);
        },
        onError: (err: unknown) => {
          showToast(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ", "error");
        },
      }
    );
  }

  function handleCancel(id: string) {
    cancelMutation.mutate(id, {
      onError: (err: unknown) => {
        showToast(err instanceof Error ? err.message : "ยกเลิกคำขอไม่สำเร็จ", "error");
      },
    });
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-text-hi">คำขอยืม-คืนยา</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-accent px-3.5 py-2 text-[12px] font-medium text-white hover:bg-accent/90"
          >
            + ขอยืมยา
          </button>
        )}
      </div>

      {showForm ? (
        overviewQuery.isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-text-lo">
            กำลังโหลดข้อมูลเครือข่าย...
          </div>
        ) : (
          <NewRequestForm
            networkItems={overviewQuery.data ?? []}
            ownHospitalObjectId={user.hospitalObjectId}
            ownHospitalName={user.hospitalName}
            prefill={prefill}
            submitting={createMutation.isPending}
            onCancel={() => setShowForm(false)}
            onSubmit={handleCreateRequest}
          />
        )
      ) : (
        <>
          <div className="flex gap-1 border-b border-border">
            <button
              onClick={() => setTab("inbox")}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === "inbox"
                  ? "border-b-2 border-accent text-accent"
                  : "text-text-lo hover:text-text-hi"
              }`}
            >
              Inbox (รอฉันอนุมัติ)
              {pendingInboxCount > 0 && (
                <span className="ml-1.5 rounded bg-critical/15 px-1.5 py-0.5 text-[10px] text-critical">
                  {pendingInboxCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("outbox")}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === "outbox"
                  ? "border-b-2 border-accent text-accent"
                  : "text-text-lo hover:text-text-hi"
              }`}
            >
              Outbox (คำขอของฉัน)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === "inbox" ? (
              inboxQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                  กำลังโหลดคำขอ...
                </div>
              ) : inboxQuery.isError ? (
                <div className="flex h-32 items-center justify-center text-[13px] text-critical">
                  โหลด Inbox ไม่สำเร็จ
                </div>
              ) : inbox.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                  ไม่มีคำขอที่รอการอนุมัติ
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {inbox.map((item) => (
                    <InboxRequestCard
                      key={item._id}
                      item={item}
                      processing={approveMutation.isPending || rejectMutation.isPending}
                      onApprove={() => setApproveTarget(item)}
                      onReject={() => setRejectTarget(item)}
                    />
                  ))}
                </div>
              )
            ) : outboxQuery.isLoading ? (
              <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                กำลังโหลดคำขอ...
              </div>
            ) : outboxQuery.isError ? (
              <div className="flex h-32 items-center justify-center text-[13px] text-critical">
                โหลด Outbox ไม่สำเร็จ
              </div>
            ) : outbox.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-[13px] text-text-lo">
                ยังไม่มีคำขอที่ส่งออก
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {outbox.map((item) => (
                  <OutboxRequestCard
                    key={item._id}
                    item={item}
                    processing={cancelMutation.isPending}
                    onTrack={() => router.push("/dashboard/delivery")}
                    onCancel={() => handleCancel(item._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ApproveModal
        request={approveTarget}
        submitting={approveMutation.isPending}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
      />
      <RejectModal
        request={rejectTarget}
        submitting={rejectMutation.isPending}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
