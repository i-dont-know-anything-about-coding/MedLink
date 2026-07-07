"use client";

import { useMemo, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import type { ExpiryRedistributionItem, SessionUser } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import Button from "@/components/ui/Button";
import { FormLabel, TextArea, TextInput } from "@/components/ui/FormControls";

interface ExpiryTransferModalProps {
  item: ExpiryRedistributionItem;
  user: SessionUser;
  onClose: () => void;
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

export default function ExpiryTransferModal({ item, user, onClose }: ExpiryTransferModalProps) {
  const [quantity, setQuantity] = useState(item.expiring_lot.quantity);
  const [receiverName, setReceiverName] = useState(item.ai_suggestion.hospital_name);
  const [requesterName, setRequesterName] = useState(user.name);
  const [note, setNote] = useState(
    `โอนย้ายยาใกล้หมดอายุล็อต ${item.expiring_lot.lot_number} เพื่อให้เกิดการใช้ยาก่อนหมดอายุ`
  );

  const documentNo = useMemo(() => {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    return `EXP-${datePart}-${item.expiring_lot.lot_number}`;
  }, [item.expiring_lot.lot_number]);

  const canDownload = quantity > 0 && receiverName.trim() && requesterName.trim();

  function buildDocumentHtml() {
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
    .note { margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 13px; min-height: 70px; white-space: pre-wrap; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 56px; text-align: center; font-size: 13px; }
    .line { border-bottom: 1px solid #334155; height: 48px; margin-bottom: 8px; }
    .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #64748b; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title">เอกสารโอนย้ายยาใกล้หมดอายุ</div>
      <div class="subtitle">Electronic Drug Transfer Document</div>
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
        <div class="muted">ต้นทาง</div>
        <div class="bold">${escapeHtml(item.from_hospital)}</div>
      </div>
      <div class="box">
        <div class="muted">ปลายทาง</div>
        <div class="bold">${escapeHtml(receiverName || "-")}</div>
      </div>
    </div>

    <table>
      <tbody>
        <tr><td>ชื่อยา</td><td>${escapeHtml(item.drug_name)}</td></tr>
        <tr><td>ชื่อการค้า</td><td>${escapeHtml(item.trade_name)}</td></tr>
        <tr><td>ประเภทยา</td><td>${escapeHtml(item.category)}</td></tr>
        <tr><td>เลขล็อต</td><td>${escapeHtml(item.expiring_lot.lot_number)}</td></tr>
        <tr><td>วันหมดอายุ</td><td>${escapeHtml(formatThaiDate(item.expiring_lot.expiry_date))}</td></tr>
        <tr><td>จำนวนที่โอนย้าย</td><td>${escapeHtml(formatNumber(quantity || 0))} หน่วย</td></tr>
      </tbody>
    </table>

    <div class="note">
      <div class="bold">เหตุผล / หมายเหตุ</div>
      <div>${escapeHtml(note || "-")}</div>
    </div>

    <div class="signatures">
      <div>
        <div class="line"></div>
        <div>ผู้จัดทำเอกสาร</div>
        <div class="muted">${escapeHtml(requesterName || "-")}</div>
      </div>
      <div>
        <div class="line"></div>
        <div>ผู้รับโอน / ผู้อนุมัติ</div>
        <div class="muted">${escapeHtml(receiverName || "-")}</div>
      </div>
    </div>

    <div class="footer">
      เอกสารนี้จัดทำจากระบบ StockSync และสามารถบันทึกเป็น PDF เพื่อใช้เป็นหลักฐานอิเล็กทรอนิกส์
    </div>
  </div>
</body>
</html>`;
  }

  function handleDownloadPdf() {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(buildDocumentHtml());
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-text-hi">
            <FileText size={16} className="text-accent" />
            ฟอร์มโอนย้ายยาและเอกสารอิเล็กทรอนิกส์
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-lo hover:bg-panel-hover hover:text-text-hi"
            title="ปิด"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[320px_1fr]">
          <form className="border-b border-border p-4 lg:border-b-0 lg:border-r">
            <div className="mb-4 text-[13px] font-medium text-text-hi">ข้อมูลโอนย้าย</div>

            <div className="space-y-3">
              <div>
                <FormLabel>โรงพยาบาลปลายทาง</FormLabel>
                <TextInput value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
              </div>

              <div>
                <FormLabel>จำนวนที่โอนย้าย</FormLabel>
                <TextInput
                  type="number"
                  min={1}
                  max={item.expiring_lot.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div>
                <FormLabel>ผู้จัดทำเอกสาร</FormLabel>
                <TextInput
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                />
              </div>

              <div>
                <FormLabel>หมายเหตุ / เหตุผล</FormLabel>
                <TextArea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button type="button" onClick={handleDownloadPdf} disabled={!canDownload}>
                <Download size={14} />
                ดาวน์โหลดเป็น PDF
              </Button>
              <Button type="button" variant="cancel" onClick={onClose}>
                ยกเลิก
              </Button>
            </div>
          </form>

          <div className="bg-white p-6 text-slate-950">
            <div className="mx-auto min-h-[720px] max-w-[720px] rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <div className="border-b border-slate-300 pb-4 text-center">
                <div className="text-[18px] font-bold">เอกสารโอนย้ายยาใกล้หมดอายุ</div>
                <div className="mt-1 text-[12px] text-slate-600">
                  Electronic Drug Transfer Document
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <div className="text-slate-500">เลขที่เอกสาร</div>
                  <div className="font-semibold">{documentNo}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">วันที่จัดทำ</div>
                  <div className="font-semibold">{todayThai()}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
                <div className="rounded-md border border-slate-200 p-3">
                  <div className="mb-1 text-[11px] font-semibold text-slate-500">ต้นทาง</div>
                  <div className="font-semibold">{item.from_hospital}</div>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <div className="mb-1 text-[11px] font-semibold text-slate-500">ปลายทาง</div>
                  <div className="font-semibold">{receiverName || "-"}</div>
                </div>
              </div>

              <table className="mt-6 w-full border-collapse text-[12px]">
                <tbody>
                  <tr>
                    <td className="w-40 border border-slate-300 bg-slate-50 px-3 py-2 font-semibold">
                      ชื่อยา
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{item.drug_name}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold">
                      ชื่อการค้า
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{item.trade_name}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold">
                      ประเภทยา
                    </td>
                    <td className="border border-slate-300 px-3 py-2">{item.category}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold">
                      เลขล็อต
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {item.expiring_lot.lot_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold">
                      วันหมดอายุ
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {formatThaiDate(item.expiring_lot.expiry_date)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold">
                      จำนวนที่โอนย้าย
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {formatNumber(quantity || 0)} หน่วย
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-5 rounded-md border border-slate-200 p-3 text-[12px]">
                <div className="mb-1 font-semibold">เหตุผล / หมายเหตุ</div>
                <div className="min-h-12 whitespace-pre-wrap text-slate-700">{note || "-"}</div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[12px]">
                <div>
                  <div className="h-14 border-b border-slate-400" />
                  <div className="mt-2">ผู้จัดทำเอกสาร</div>
                  <div className="text-slate-600">{requesterName || "-"}</div>
                </div>
                <div>
                  <div className="h-14 border-b border-slate-400" />
                  <div className="mt-2">ผู้รับโอน / ผู้อนุมัติ</div>
                  <div className="text-slate-600">{receiverName || "-"}</div>
                </div>
              </div>

              <div className="mt-6 text-center text-[10px] text-slate-500">
                เอกสารนี้จัดทำจากระบบ StockSync และสามารถบันทึกเป็น PDF เพื่อใช้เป็นหลักฐานอิเล็กทรอนิกส์
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}