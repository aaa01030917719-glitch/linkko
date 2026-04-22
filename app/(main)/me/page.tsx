import type { Metadata } from "next";
import MeClient from "@/components/me/MeClient";

export const metadata: Metadata = {
  title: "나 | 링코",
};

export default function MePage() {
  return <MeClient />;
}
