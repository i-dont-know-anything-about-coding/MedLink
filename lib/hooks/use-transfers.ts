import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveTransferRequest,
  createTransferRequest,
  fetchInboxTransfers,
  fetchOutboxTransfers,
  rejectTransferRequest,
} from "@/lib/api";
import { getSession } from "@/lib/auth";

const INBOX_KEY = ["transfers", "inbox"];
const OUTBOX_KEY = ["transfers", "outbox"];

/** GET /api/transfers/inbox — คำขอที่ รพ.เราเป็นผู้ให้ยืม รออนุมัติ (ต้อง login ก่อน) */
export function useInboxTransfers() {
  return useQuery({
    queryKey: INBOX_KEY,
    queryFn: fetchInboxTransfers,
    enabled: Boolean(getSession()),
  });
}

/** GET /api/transfers/outbox — คำขอที่ รพ.เราส่งออกไปขอยืมจาก รพ.อื่น (ต้อง login ก่อน) */
export function useOutboxTransfers() {
  return useQuery({
    queryKey: OUTBOX_KEY,
    queryFn: fetchOutboxTransfers,
    enabled: Boolean(getSession()),
  });
}

/** ใช้แสดง badge จำนวนคำขอ Inbox ที่รออนุมัติบน Sidebar */
export function usePendingInboxCount() {
  const { data } = useInboxTransfers();
  if (!data) return 0;
  return data.filter((t) => t.status === "PENDING").length;
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    // ส่งแค่ from_hospital (รพ.ต้นทางที่เลือก) — backend ดึง to_hospital (รพ.เราเอง) จาก JWT เอง
    mutationFn: createTransferRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTBOX_KEY });
    },
  });
}

export function useApproveTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantityApproved }: { id: string; quantityApproved?: number }) =>
      approveTransferRequest(id, quantityApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectTransferRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // ยังไม่มี PATCH /api/transfers/:id/cancel บน backend จริง
      // (ดู routes/transferRoutes.js — มีแค่ inbox/outbox/POST/:id/approve/:id/reject)
      // แสดง toast แจ้งว่ายังทำไม่ได้ไปก่อน แทนการเปลี่ยนสถานะแบบ mock เงียบๆ
      throw new Error(
        `ฟีเจอร์ยกเลิกคำขอยังไม่พร้อมใช้งาน (รอ backend เพิ่ม endpoint, request id: ${id})`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTBOX_KEY });
    },
  });
}
