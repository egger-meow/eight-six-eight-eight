import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "關於我們｜86.88民宿｜宜蘭三星安農溪畔歐風貓咪民宿",
  description:
    "認識宜蘭三星86.88民宿，安農溪畔歐風質感空間、木質客廳、星空露台、庭院停車與貓咪陪伴，適合宜蘭放鬆住宿。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
