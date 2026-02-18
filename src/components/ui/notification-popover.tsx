"use client"

import { useState } from "react"
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function NotificationPopover() {
  const [open, setOpen] = useState(false)
  const utils = trpc.useUtils()

  // Fetch notifications
  const { data, isLoading } = trpc.notification.list.useQuery()
  const notifications = data?.notifications || []
  
  // Calculate unread count
  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  // Mutation to mark as read
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate()
    }
  })

  const handleMarkAllRead = () => {
    markAsReadMutation.mutate({})
  }

  const handleMarkRead = (id: string) => {
    markAsReadMutation.mutate({ ids: [id] })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors relative outline-none">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-black" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#0A0A0A] border-white/10 text-white" align="end">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h4 className="font-medium text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-white"
              onClick={handleMarkAllRead}
              disabled={markAsReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {notifications.map((notification: any) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "p-4 flex gap-3 hover:bg-white/[0.02] transition-colors relative group",
                    !notification.is_read && "bg-white/[0.02]"
                  )}
                >
                  <div className="mt-0.5 shrink-0 relative">
                    {getIcon(notification.type)}
                    {!notification.is_read && (
                       <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#0A0A0A]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm leading-none", !notification.is_read ? "font-medium text-white" : "text-muted-foreground")}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground/80 leading-snug">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                     <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             handleMarkRead(notification.id);
                           }}
                           className="p-1 hover:bg-white/10 rounded-full text-muted-foreground hover:text-white"
                           title="Mark as read"
                        >
                           <Check className="w-3 h-3" />
                        </button>
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
