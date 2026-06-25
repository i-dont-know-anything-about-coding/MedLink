import { useQuery } from "@tanstack/react-query";
import { fetchHospitalInventory } from "@/lib/api";

/**
 * GET /api/hospitals/:hospital_id/inventory — คลังยาของ รพ.ตัวเองโดยตรง
 * (ก่อนหน้านี้ filter จาก network-overview ฝั่ง client เพราะยังไม่มี route นี้
 * ตอนนี้ backend มีจริงแล้ว จึงเรียก endpoint นี้ตรงๆ — เบากว่าเดิมเพราะไม่ต้อง
 * โอนข้อมูลทั้งเครือข่ายมา filter เอง)
 *
 * ใช้ hospitalObjectId (Mongo _id) ไม่ใช่ hospitalCode (รหัส สธ. เช่น H10664)
 * เพราะ backend เช็คสิทธิ์เทียบกับ req.user.hospital_id จาก JWT ซึ่งเป็น ObjectId
 */
export function useOwnInventory(hospitalObjectId: string | undefined) {
  return useQuery({
    queryKey: ["hospital-inventory", hospitalObjectId],
    queryFn: () => fetchHospitalInventory(hospitalObjectId as string),
    enabled: Boolean(hospitalObjectId),
  });
}
