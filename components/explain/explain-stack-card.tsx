'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'

interface ExplainStackCardProps {
  stackId?: string
}

export function ExplainStackCard({ stackId = 'default' }: ExplainStackCardProps) {
  const [copied, setCopied] = useState(false)
  
  // Casting trpc to any here to avoid type friction if server/client trpc types drift; runtime path remains the same
  const { data, isLoading, error, refetch } = (trpc as any).sarge.explain.stack.useQuery({
    stackId,
    includeHealth: true,
    includeErrors: true,
    includeCost: true,
    includeLastDeploy: true,
  })

  const handleCopy = async () => {
    if (!data?.markdown) return
    
    try {
      await navigator.clipboard.writeText(data.markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Stack Explanation</h3>
          <p className="text-sm text-zinc-400">Failed to generate explanation</p>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-red-400">{error.message}</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Explain My Stack</h3>
          <p className="text-sm text-zinc-400">AI-free summary generated from local facts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!data?.markdown || isLoading}
          >
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : data ? (
          <div className="prose prose-sm prose-invert max-w-none">
            <MarkdownContent markdown={data.markdown} />
            
            <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
              Generated at {new Date(data.metadata.generatedAt).toLocaleString()} · Version {data.metadata.version}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No explanation available</p>
        )}
      </CardBody>
    </Card>
  )
}

// Simple markdown renderer without external dependencies
function MarkdownContent({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')
  const elements: JSX.Element[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Headers
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>)
    }
    // List items
    else if (line.startsWith('- ')) {
      const listItems: string[] = [line.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++
        listItems.push(lines[i].slice(2))
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
    }
    // Horizontal rule
    else if (line === '---') {
      elements.push(<hr key={key++} className="my-4 border-zinc-700" />)
    }
    // Empty line
    else if (line.trim() === '') {
      // Skip
    }
    // Regular paragraph
    else {
      elements.push(<p key={key++} className="my-2">{parseInlineMarkdown(line)}</p>)
    }
  }

  return <div>{elements}</div>
}

// Parse inline markdown (bold, links, inline code, emojis)
function parseInlineMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let key = 0

  while (remaining) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    if (boldMatch) {
      if (boldMatch.index! > 0) {
        parts.push(remaining.slice(0, boldMatch.index))
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length)
      continue
    }

    // Links [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      if (linkMatch.index! > 0) {
        parts.push(remaining.slice(0, linkMatch.index))
      }
      const href = linkMatch[2]
      const isInternal = href.startsWith('/')
      parts.push(
        <a
          key={key++}
          href={href}
          className="text-blue-400 hover:underline"
          onClick={isInternal ? (e) => {
            e.preventDefault()
            window.location.href = href
          } : undefined}
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch.index! + linkMatch[0].length)
      continue
    }

    // Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/)
    if (codeMatch) {
      if (codeMatch.index! > 0) {
        parts.push(remaining.slice(0, codeMatch.index))
      }
      parts.push(<code key={key++} className="bg-zinc-800 px-1 rounded text-sm">{codeMatch[1]}</code>)
      remaining = remaining.slice(codeMatch.index! + codeMatch[0].length)
      continue
    }

    // No more special markup
    parts.push(remaining)
    break
  }

  return parts
}

