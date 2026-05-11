import { redirect } from "next/navigation";

export default async function LegacyRevenueEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/entries/${id}/edit`);
}
