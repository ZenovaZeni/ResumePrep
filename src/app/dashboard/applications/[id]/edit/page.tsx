import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ApplicationForm } from "../../ApplicationForm";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!app) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Edit application</h1>
      <ApplicationForm
        initial={{
          id: app.id,
          company_name: app.company_name,
          job_title: app.job_title,
          job_description: app.job_description,
          job_url: app.job_url,
          date_applied: app.date_applied,
          status: app.status,
          notes: app.notes,
        }}
      />
      <div className="mt-6">
        <Link
          href={`/dashboard/applications/${app.id}`}
          className="text-zinc-400 hover:text-white text-sm"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
