import type { Drug, Hospital, TransferRequestRecord, TransferStatus } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const STATUS_LABEL_TH: Record<TransferStatus, string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว — กำลังเตรียมจัดส่ง",
  IN_TRANSIT: "กำลังขนส่ง",
  COMPLETED: "เสร็จสิ้น",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิกแล้ว",
};

interface OwnHospital {
  objectId: string;
  name: string;
}

/**
 * บางครั้ง backend ไม่ populate from_hospital/to_hospital เป็น object (ส่งมาเป็น ObjectId string เฉยๆ)
 * ถ้า id ที่ได้ตรงกับ รพ. ของผู้ใช้ที่ login อยู่ ให้ใช้ชื่อ รพ. ของผู้ใช้แทน ไม่ใช่ขึ้น id ตรงๆ
 */
function hospitalName(h: string | Hospital, ownHospital?: OwnHospital): string {
  if (typeof h !== "string") return h.hospital_name;
  if (ownHospital && h === ownHospital.objectId) return ownHospital.name;
  return h;
}
function drugName(d: string | Drug | null | undefined): string {
  if (!d) return "";
  return typeof d === "string" ? d : d.generic_name;
}
/** 🩸 ใช้แสดงชื่อรายการในเอกสาร ได้ทั้งกรณียาและเลือด */
function itemDisplayName(request: TransferRequestRecord): string {
  if (request.item_type === "BLOOD") {
    return `เลือดกรุ๊ป ${request.blood_group ?? ""} (${request.component_type ?? ""})`;
  }
  return drugName(request.drug_ref);
}

function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function todayThai(): string {
  return new Date().toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** สร้างเลขที่เอกสารจาก _id ของคำขอ + วันที่ปัจจุบัน */
export function buildTransferDocumentNo(request: TransferRequestRecord): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const shortId = (request._id ?? "").slice(-6).toUpperCase();
  return `TRF-${datePart}-${shortId}`;
}

export function buildTransferDocumentHtml(
  request: TransferRequestRecord,
  ownHospital?: OwnHospital
): string {
  const documentNo = buildTransferDocumentNo(request);
  const fromName = hospitalName(request.from_hospital, ownHospital);
  const toName = hospitalName(request.to_hospital, ownHospital);
  const drug = itemDisplayName(request);
  const quantityApproved =
    (request.quantity_approved ?? 0) > 0
      ? request.quantity_approved!
      : (request.quantity_requested ?? 0);

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentNo)}</title>
  <style>
    body { font-family: Arial, Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
    .page { max-width: 760px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; }
    .subtitle { margin-top: 4px; font-size: 12px; color: #64748b; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; font-size: 13px; }
    .muted { color: #64748b; font-size: 12px; }
    .bold { font-weight: 700; }
    .boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
    td { border: 1px solid #cbd5e1; padding: 9px 12px; }
    td:first-child { width: 170px; background: #f8fafc; font-weight: 700; }
    .note { margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 13px; min-height: 50px; white-space: pre-wrap; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 56px; text-align: center; font-size: 13px; }
    .line { border-bottom: 1px solid #334155; height: 48px; margin-bottom: 8px; }
    .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #64748b; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title">เอกสารคำขอยืม-คืนยา/เลือดระหว่างโรงพยาบาล</div>
      <div class="subtitle">Inter-Hospital Drug / Blood Transfer Request Document</div>
    </div>

    <div class="meta">
      <div>
        <div class="muted">เลขที่เอกสาร</div>
        <div class="bold">${escapeHtml(documentNo)}</div>
      </div>
      <div style="text-align:right">
        <div class="muted">วันที่จัดทำ</div>
        <div class="bold">${escapeHtml(todayThai())}</div>
      </div>
    </div>

    <div class="boxes">
      <div class="box">
        <div class="muted">โรงพยาบาลต้นทาง (ผู้ให้ยืม)</div>
        <div class="bold">${escapeHtml(fromName)}</div>
      </div>
      <div class="box">
        <div class="muted">โรงพยาบาลปลายทาง (ผู้ขอยืม)</div>
        <div class="bold">${escapeHtml(toName)}</div>
      </div>
    </div>

    <table>
      <tbody>
        <tr><td>รายการที่ขอ</td><td>${escapeHtml(drug)}</td></tr>
        <tr><td>จำนวนที่ขอ</td><td>${escapeHtml(formatNumber(request.quantity_requested ?? 0))} หน่วย</td></tr>
        <tr><td>จำนวนที่อนุมัติ</td><td>${escapeHtml(formatNumber(quantityApproved))} หน่วย</td></tr>
        <tr><td>สถานะคำขอ</td><td>${escapeHtml(STATUS_LABEL_TH[request.status])}</td></tr>
        <tr><td>วันที่ส่งคำขอ</td><td>${escapeHtml(request.createdAt ? formatThaiDate(request.createdAt) : "-")}</td></tr>
      </tbody>
    </table>

    ${
      request.status === "REJECTED" && request.rejection_reason
        ? `<div class="note"><div class="bold">เหตุผลที่ปฏิเสธ</div><div>${escapeHtml(request.rejection_reason)}</div></div>`
        : ""
    }

    <div class="signatures">
      <div>
        <div class="line"></div>
        <div>ผู้ขอยืม</div>
        <div class="muted">${escapeHtml(toName)}</div>
      </div>
      <div>
        <div class="line"></div>
        <div>ผู้อนุมัติ / ผู้ให้ยืม</div>
        <div class="muted">${escapeHtml(fromName)}</div>
      </div>
    </div>

    <div class="footer">
      เอกสารนี้จัดทำจากระบบ MedLink และสามารถบันทึกเป็น PDF เพื่อใช้เป็นหลักฐานอิเล็กทรอนิกส์
    </div>
  </div>
</body>
</html>`;
}

/** เปิดหน้าต่างใหม่พร้อมเอกสาร แล้วสั่งพิมพ์ทันที (ผู้ใช้เลือก "บันทึกเป็น PDF" จาก print dialog ได้) */
export function downloadTransferRequestPdf(
  request: TransferRequestRecord,
  ownHospital?: OwnHospital
) {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(buildTransferDocumentHtml(request, ownHospital));
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}