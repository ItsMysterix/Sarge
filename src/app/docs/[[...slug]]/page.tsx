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
    <AppShell title="Documentation">
      <div className="flex-1 p-8 lg:p-20 max-w-[1200px] mx-auto w-full animate-in fade-in duration-700">
        <div className="prose prose-invert prose-zinc max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }: any) => <h1 className="text-4xl font-bold tracking-tight mb-12">{children}</h1>,
              h2: ({ children }: any) => <h2 className="text-2xl font-bold tracking-tight mt-16 mb-6 border-b border-white/5 pb-4">{children}</h2>,
              h3: ({ children }: any) => <h3 className="text-xl font-bold tracking-tight mt-10 mb-4">{children}</h3>,
              p: ({ children }: any) => <p className="text-white/40 leading-relaxed mb-6">{children}</p>,
              ul: ({ children }: any) => <ul className="my-6 ml-6 list-disc space-y-3 text-white/30">{children}</ul>,
              li: ({ children }: any) => <li className="pl-2">{children}</li>,
              code: ({ children }: any) => (
                <code className="relative rounded bg-white/[0.05] border border-white/5 px-1.5 py-0.5 font-mono text-sm font-medium text-white/80">
                  {children}
                </code>
              ),
              pre: ({ children }: any) => (
                <pre className="my-8 overflow-x-auto rounded-xl bg-black border border-white/5 p-6 shadow-xl">
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </AppShell>
  )
}
