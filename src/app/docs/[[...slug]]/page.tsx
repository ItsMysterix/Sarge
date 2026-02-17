import fs from 'fs'
import path from 'path'
import { AppShell } from '@/components/layout/app-shell'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default async function DocsPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug || ['getting-started']
  const filePath = path.join(process.cwd(), 'docs', `${slug.join('/')}.md`)

  if (!fs.existsSync(filePath)) {
    return notFound()
  }

  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto animate-fade-in mb-20">
        <div className="prose prose-invert prose-violet max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }: any) => <h1 className="text-4xl font-bold mb-8 scroll-m-20 border-b border-white/10 pb-4">{children}</h1>,
              h2: ({ children }: any) => <h2 className="text-2xl font-semibold mt-12 mb-4 scroll-m-20 border-b border-white/5 pb-2">{children}</h2>,
              h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-8 mb-4 scroll-m-20">{children}</h3>,
              p: ({ children }: any) => <p className="leading-7 [&:not(:first-child)]:mt-6 text-muted-foreground/90">{children}</p>,
              ul: ({ children }: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-muted-foreground/80">{children}</ul>,
              code: ({ children }: any) => <code className="relative rounded bg-white/10 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{children}</code>,
              pre: ({ children }: any) => <pre className="mt-6 mb-4 overflow-x-auto rounded-xl bg-black/50 border border-white/10 p-4">{children}</pre>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </AppShell>
  )
}
