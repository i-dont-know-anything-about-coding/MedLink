"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { HEALTH_ZONE } from "@/lib/constants";
import { TextInput, FormLabel } from "@/components/ui/FormControls";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || !password) {
      showToast("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", "error");
      return;
    }

    setSubmitting(true);
    const result = await login({ username: username.trim(), password });
    setSubmitting(false);

    if (!result.success) {
      showToast(result.message ?? "เข้าสู่ระบบไม่สำเร็จ", "error");
      return;
    }

    showToast(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${result.user?.name}`, "success");
    router.push("/dashboard/overview");
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Left Panel — Branding (60%), พื้นสีเรียบ #0F1923 ตามสเปก MVP (ตัด Hex grid ออก) */}
      <div className="flex flex-1 basis-3/5 flex-col items-center justify-center border-b border-border bg-bg p-10 md:border-b-0 md:border-r">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-accent font-data text-[32px] font-semibold text-white">
            M
          </div>
          <div className="text-[34px] font-semibold tracking-tight text-text-hi">
            Med<span className="text-accent">Link</span>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-text-lo">
            มองเห็นยาทุกขวด ทุกโรงพยาบาล
            <br />
            ในเขตสุขภาพเดียวกัน
          </p>
        </div>
      </div>

      {/* Right Panel — Login form (40%) */}
      <div className="flex flex-1 basis-2/5 items-center justify-center bg-panel p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl border border-border bg-bg/40 p-8"
        >
          <h2 className="text-[20px] font-semibold text-text-hi">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-[13px] text-text-lo">
            ระบบจัดการสต็อกยาเครือข่ายสุขภาพเขต {HEALTH_ZONE}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <FormLabel>ชื่อผู้ใช้</FormLabel>
              <TextInput
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username ที่ได้รับจากผู้ดูแลระบบ"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <FormLabel>รหัสผ่าน</FormLabel>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" disabled={submitting} className="mt-1 w-full">
              {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-text-lo">
            บัญชีผู้ใช้แต่ละโรงพยาบาลถูกสร้างไว้ล่วงหน้าโดยผู้ดูแลระบบ
            <br />
            การเข้าสู่ระบบถือว่าคุณยินยอมให้จัดเก็บข้อมูลตาม พ.ร.บ.
            คุ้มครองข้อมูลส่วนบุคคล (PDPA) ม.26
          </p>
        </form>
      </div>
    </div>
  );
}
