// app/admin/support/page.tsx (SERVER COMPONENT)
import { createClient } from "@supabase/supabase-js";
import LiveDashboard from "@/components/admin/support/LiveDashboard";
import {
  Filters,
  ActionButton,
  Assign,
  Reply,
  Close,
} from "@/components/admin/support/ClientBits";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Row = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  category: "Billing" | "Technical" | "Account" | "Other";
  title: string;
  description: string;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  assignee?: string | null;
};

export const dynamic = "force-dynamic";

async function fetchRows(search = "", status = "all", category = "all") {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  let q = supabase
    .from("v_support_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") q = q.eq("status", status);
  if (category !== "all") q = q.eq("category", category);
  if (search) {
    q = q.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,email.ilike.%${search}%,name.ilike.%${search}%`
    );
  }

  const { data, error } = await q.limit(200);
  if (error) throw error;
  return data as Row[];
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; category?: string };
}) {
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "all";
  const category = searchParams.category ?? "all";
  const rows = await fetchRows(q, status, category);

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Support Requests</h1>
        <Filters defaultQ={q} defaultStatus={status} defaultCategory={category} />
      </header>

      {/* Live metrics */}
      <LiveDashboard />

      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Requester</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Assignee</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-neutral-950">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="p-3 tabular-nums">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  <div className="font-medium">{r.name || "—"}</div>
                  <div className="text-neutral-400">{r.email}</div>
                </td>
                <td className="p-3">
                  <span className="rounded-full px-2 py-0.5 text-xs bg-neutral-800">
                    {r.category}
                  </span>
                </td>
                <td className="p-3">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-neutral-400 line-clamp-2">
                    {r.description}
                  </div>
                </td>
                <td className="p-3">
                  <StatusBadge value={r.status} />
                </td>
                <td className="p-3">
                  <PriorityBadge value={r.priority} />
                </td>
                <td className="p-3">{r.assignee || "—"}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        id={r.id}
                        field="status"
                        value={r.status === "open" ? "closed" : "open"}
                      />
                      <ActionButton
                        id={r.id}
                        field="priority"
                        value={nextPriority(r.priority)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Assign id={r.id} current={r.assignee || ""} />
                      <Reply id={r.id} email={r.email} title={r.title} />
                      <Close id={r.id} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-neutral-400" colSpan={8}>
                  No tickets match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function nextPriority(p: Row["priority"]): Row["priority"] {
  return p === "low" ? "medium" : p === "medium" ? "high" : "low";
}

function StatusBadge({ value }: { value: "open" | "closed" }) {
  const cls =
    value === "open"
      ? "bg-emerald-900/40 text-emerald-300"
      : "bg-neutral-800 text-neutral-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{value}</span>
  );
}

function PriorityBadge({ value }: { value: "low" | "medium" | "high" }) {
  const cls =
    value === "high"
      ? "bg-red-900/40 text-red-300"
      : value === "medium"
      ? "bg-amber-900/40 text-amber-300"
      : "bg-neutral-800 text-neutral-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{value}</span>
  );
}
