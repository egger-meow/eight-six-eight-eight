import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "預約訂房｜86.88民宿｜宜蘭三星雙人房與四人房",
  description:
    "預約86.88民宿宜蘭三星住宿，可於官網送出預約申請。民宿主人確認房況、金額與訂金匯款後，才視為正式訂房成功。",
  alternates: {
    canonical: "/booking",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
