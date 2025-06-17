"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

interface Toast {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  description?: string
}

interface ToastProps extends Toast {
  onClose: (id: string) => void
}

function ToastComponent({ id, type, title, description, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [id, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: "border-success bg-success/10 text-success",
    error: "border-error bg-error/10 text-error",
    warning: "border-warning bg-warning/10 text-warning",
    info: "border-accent bg-accent/10 text-accent",
  }

  const Icon = icons[type]

  return (
    <div className={`glass-card p-4 rounded-lg border ${colors[type]} animate-in slide-in-from-right`}>
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-sm">{title}</div>
          {description && <div className="text-xs opacity-80 mt-1">{description}</div>}
        </div>
        <button onClick={() => onClose(id)} className="text-current opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastCount}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  )

  return { addToast, ToastContainer }
}
