"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/observability")
  }, [router])
  return null
}
