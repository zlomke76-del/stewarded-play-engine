import MemoryWorkspaceClient from "./MemoryWorkspaceClient";
import RolodexWorkspaceClient from "./RolodexWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function WorkspaceMemoryPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <section className="w-full h-full min-h-0 flex flex-col overflow-hidden px-8 py-6">
      <header className="flex-shrink-0 border-b border-neutral-800 pb-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Memories
        </h1>
        <p className="text-sm text-neutral-400">
          Long-term factual memory and human-managed relationships
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2">
        <MemoryWorkspaceClient
          workspaceId={workspaceId}
          initialItems={[]}
        />

        <RolodexWorkspaceClient workspaceId={workspaceId} />
      </div>
    </section>
  );
}
