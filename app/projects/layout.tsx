import { ProjectsHeader } from "@/components/layout/projects-header";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <main className="flex-1 overflow-auto">
        <ProjectsHeader />
        {children}
      </main>
    </div>
  );
}
