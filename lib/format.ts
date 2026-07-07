import type { DrugCategory, StockStatus } from "./types";

export function formatThaiDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatThaiTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("th-TH");
}

export function categoryBadgeClasses(category: DrugCategory): string {
  switch (category) {
    case "High-Alert Emergency":
      return "bg-critical/15 text-critical";
    case "Controlled":
      return "bg-warning/15 text-warning";
    default:
      return "bg-border-light/60 text-text-lo";
  }
}

export function categoryLabel(category: DrugCategory): string {
  switch (category) {
    case "High-Alert Emergency":
      return "High-Alert";
    case "Controlled":
      return "ควบคุมพิเศษ";
    default:
      return "ทั่วไป";
  }
}

export function stockStatusColor(status: StockStatus): string {
  switch (status) {
    case "RED":
      return "var(--color-critical)";
    case "YELLOW":
      return "var(--color-warning)";
    default:
      return "var(--color-safe)";
  }
}

export function stockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "RED":
      return "วิกฤต";
    case "YELLOW":
      return "ใกล้หมด";
    default:
      return "ปกติ";
  }
}

export function expiryUrgencyClass(expiryDateIso: string): string {
  const days = (new Date(expiryDateIso).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return "text-critical";
  if (days <= 60) return "text-critical";
  if (days <= 180) return "text-warning";
  return "text-text-lo";
}

/** เกล็ดเลือด (PLT) เก็บได้สั้นมาก ใช้เกณฑ์วันเข้มกว่ายา/PRC/FFP */
export function bloodExpiryUrgencyClass(expiryDateIso: string): string {
  const days = (new Date(expiryDateIso).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return "text-critical";
  if (days <= 3) return "text-critical";
  if (days <= 7) return "text-warning";
  return "text-text-lo";
}

export function componentTypeLabel(componentType: string): string {
  switch (componentType) {
    case "PRC":
      return "เม็ดเลือดแดงเข้มข้น (PRC)";
    case "FFP":
      return "พลาสมาสดแช่แข็ง (FFP)";
    case "PLT":
      return "เกล็ดเลือด (PLT)";
    default:
      return componentType;
  }
}
