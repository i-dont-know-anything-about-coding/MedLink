import { API_ROUTES } from "./constants";
import type { SessionUser } from "./types";

/**
 * Authentication Layer — ต่อ backend จริงผ่าน POST /api/auth/login
 * (ก่อนหน้านี้ mock ไว้ใน localStorage เพราะ backend ยังไม่มี route นี้
 * ตอนนี้ backend มีจริงแล้ว จึงเปลี่ยนมาเรียก API จริง)
 *
 * Session (รวม JWT token) ยังเก็บไว้ใน localStorage เหมือนเดิม เพื่อให้
 * useRequireSession อ่านได้แบบ sync ตอน client mount โดยไม่ต้อง round-trip
 * ไป backend ทุกครั้งที่เปลี่ยนหน้า —ค่า token ที่เก็บไว้นี้ใช้แนบ
 * Authorization: Bearer <token> ในทุก request ที่ backend ต้องการสิทธิ์
 */

const SESSION_KEY = "medlink_session";

interface LoginApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    role: SessionUser["role"];
    hospital: {
      objectId: string;
      hospital_id: string;
      hospital_name: string;
      hospital_type: SessionUser["hospitalType"];
    };
  };
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

/** ใช้แนบ header กับทุก fetch ที่ต้อง login ก่อน (protect middleware ฝั่ง backend) */
export function authHeader(): Record<string, string> {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: SessionUser;
}

export async function login({ username, password }: LoginParams): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(API_ROUTES.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return { success: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบเครือข่าย" };
  }

  let body: LoginApiResponse | undefined;
  try {
    body = await res.json();
  } catch {
    // ปล่อยให้ body เป็น undefined แล้วจัดการต่อด้านล่าง
  }

  if (!res.ok || !body?.success || !body.token || !body.user) {
    return { success: false, message: body?.message ?? "เข้าสู่ระบบไม่สำเร็จ" };
  }

  const sessionUser: SessionUser = {
    token: body.token,
    userId: body.user.id,
    name: body.user.name,
    username: body.user.username,
    role: body.user.role,
    hospitalObjectId: body.user.hospital.objectId,
    hospitalCode: body.user.hospital.hospital_id,
    hospitalName: body.user.hospital.hospital_name,
    hospitalType: body.user.hospital.hospital_type,
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return { success: true, user: sessionUser };
}

/** POST /api/auth/logout — เคลียร์ session ฝั่ง client เสมอแม้ backend call จะล้ม */
export async function logout(): Promise<void> {
  try {
    await fetch(API_ROUTES.logout, { method: "POST" });
  } catch {
    // ไม่ critical ถ้า logout endpoint เรียกไม่สำเร็จ เคลียร์ session ฝั่งเราต่อได้
  } finally {
    clearSession();
  }
}
