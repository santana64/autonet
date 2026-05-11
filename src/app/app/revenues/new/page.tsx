import { redirect } from "next/navigation";

export default function LegacyRevenueNewPage() {
  redirect("/app/entries/new");
}
