"use client";

import { useMemo } from "react";
import { Building2, AlertTriangle, CheckCircle2, Pill } from "lucide-react";
import type { NetworkOverviewItem } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface NetworkStatCardsProps {
  items: NetworkOverviewItem[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentClassName: string;
}

function StatCard({ icon, label, value, accentClassName }: StatCardProps) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-panel p-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${accentClassName}`}>
        {icon}
      </div>
      <div>
        <div className="font-data text-[22px] font-semibold leading-none text-text-hi">
          {value}
        </div>
        <div className="mt-1 text-[12px] text-text-lo">{label}</div>
      </div>
    </div>
  );
}

export default function NetworkStatCards({ items }: NetworkStatCardsProps) {
  const stats = useMemo(() => {
    const hospitalIds = new Set<string>();
    const criticalHospitalIds = new Set<string>();
    let criticalDrugLines = 0;

    for (const item of items) {
      hospitalIds.add(item.hospital.id);
      if (item.stock_status === "RED") {
        criticalHospitalIds.add(item.hospital.id);
        criticalDrugLines += 1;
      }
    }

    return {
      totalHospitals: hospitalIds.size,
      criticalHospitals: criticalHospitalIds.size,
      normalHospitals: hospitalIds.size - criticalHospitalIds.size,
      criticalDrugLines,
    };
  }, [items]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Building2 size={20} className="text-accent" />}
        label="โรงพยาบาลในเครือข่าย"
        value={formatNumber(stats.totalHospitals)}
        accentClassName="bg-accent/15"
      />
      <StatCard
        icon={<AlertTriangle size={20} className="text-critical" />}
        label="รพ. มีสถานะวิกฤต"
        value={formatNumber(stats.criticalHospitals)}
        accentClassName="bg-critical/15"
      />
      <StatCard
        icon={<CheckCircle2 size={20} className="text-safe" />}
        label="รพ. สถานะปกติ"
        value={formatNumber(stats.normalHospitals)}
        accentClassName="bg-safe/15"
      />
      <StatCard
        icon={<Pill size={20} className="text-warning" />}
        label="รายการยาวิกฤตทั้งหมด"
        value={formatNumber(stats.criticalDrugLines)}
        accentClassName="bg-warning/15"
      />
    </div>
  );
}
