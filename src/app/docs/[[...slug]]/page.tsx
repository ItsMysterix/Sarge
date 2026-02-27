import fs from 'fs'
import path from 'path'
import { AppShell } from '@/components/layout/app-shell'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ShieldCheck } from 'lucide-react'

export default async function DocsPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug || ['getting-started']
  const filePath = path.join(process.cwd(), 'docs', `${slug.join('/')}.md`)

  if (!fs.existsSync(filePath)) {
    return notFound()
  }

  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <AppShell title={
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl ring-1 ring-inset ring-white/[0.01]">
          <ShieldCheck className="w-6 h-6 text-indigo-400/60" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-black tracking-[0.5em] uppercase text-foreground/90">Kernel_Documentation_Registry</span>
          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            Protocol_Index_v4.2 // Verified_System_Manifest
          </span>
        </div>
      </div>
    }>
      <div className="flex-1 p-10 lg:p-24 max-w-[1200px] mx-auto w-full animate-in fade-in duration-1000">
        <div className="prose prose-invert prose-violet max-w-none prose-h1:text-[32px] prose-h1:font-black prose-h1:uppercase prose-h1:tracking-[0.2em] prose-h1:border-b-0 prose-h2:text-[18px] prose-h2:font-black prose-h2:uppercase prose-h2:tracking-[0.15em] prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4 prose-p:text-[13px] prose-p:font-bold prose-p:text-muted-foreground/40 prose-p:uppercase prose-p:tracking-widest prose-p:leading-relaxed">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }: any) => <h1 className="mb-12 border-none">{children}</h1>,
              h2: ({ children }: any) => <h2 className="mt-20 mb-8">{children}</h2>,
              h3: ({ children }: any) => <h3 className="text-[14px] font-black uppercase tracking-[0.1em] mt-12 mb-6 text-foreground/80">{children}</h3>,
              p: ({ children }: any) => <p className="mb-8">{children}</p>,
              ul: ({ children }: any) => <ul className="my-8 ml-6 list-disc space-y-4 text-muted-foreground/30">{children}</ul>,
              li: ({ children }: any) => <li className="text-[11px] font-bold uppercase tracking-widest">{children}</li>,
              code: ({ children }: any) => <code className="relative rounded-lg bg-white/[0.03] border border-white/5 px-3 py-1 font-mono text-[11px] font-black text-indigo-400/80">{children}</code>,
              pre: ({ children }: any) => <pre className="mt-12 mb-8 overflow-x-auto rounded-[2rem] bg-[#0a0a0a] border border-white/5 p-10 ring-1 ring-inset ring-white/[0.01] shadow-3xl">{children}</pre>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </AppShell>
  )
}
