import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "대시보드 | Linkko",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
