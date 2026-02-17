import fs from 'fs'
import path from 'path'
import { AppShell } from '@/components/layout/app-shell'
import { notFound } from 'next/navigation'
// import ReactMarkdown from 'react-markdown' // Assuming this is available or we use a simpler approach

export default async function DocsPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug || ['getting-started']
  const filePath = path.join(process.cwd(), 'docs', `${slug.join('/')}.md`)

  if (!fs.existsSync(filePath)) {
    return notFound()
  }

  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto animate-fade-in">
        <div className="prose prose-invert prose-violet max-w-none">
          {/* Simple markdown placeholder if react-markdown is missing */}
          <div className="whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
             {content}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
