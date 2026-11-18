import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingClient from "@/components/billing/billing-client";

export const metadata = { title: "Nạp Credit | Đơn AI" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/billing");

  const { data: profile } = await supabase.from("profiles").select("credits, payment_code").eq("id", user.id).single();

  return <BillingClient userId={user.id} initialCredits={profile?.credits ?? 0} paymentCode={profile?.payment_code ?? ""} />;
}
