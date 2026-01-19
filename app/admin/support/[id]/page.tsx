import { createClient } from "@supabase/supabase-js";
import Thread from "@/components/admin/support/Thread";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Ticket = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  category: string;
  title: string;
  description: string | null;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  assignee: string | null;
};

export const dynamic = "force-dynamic";

async function getTicket(id: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Ticket;
}

async function getMessages(id: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("support_request_id", id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const ticket = await getTicket(params.id);
  const messages = await getMessages(params.id);

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">{ticket.title}</h1>
          <div className="text-neutral-400 mt-1">
            {ticket.category} · {ticket.priority} · {ticket.status}
          </div>
          <div className="text-neutral-400">
            {ticket.name || "—"} {ticket.email ? `· ${ticket.email}` : ""}
          </div>
        </div>
        <a
          href="/admin/support"
          className="px-3 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900"
        >
          ← Back to list
        </a>
      </header>

      <section className="rounded-2xl border border-neutral-800 overflow-hidden">
        <Thread
          supportRequestId={ticket.id}
          initialMessages={messages ?? []}
          requester={{ name: ticket.name || "", email: ticket.email || "" }}
        />
      </section>
    </main>
  );
}
