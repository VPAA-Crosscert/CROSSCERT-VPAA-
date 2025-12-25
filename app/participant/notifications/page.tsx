'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, Trash2, Mail, Calendar, Info, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiCall, api } from '@/lib/api-config'

type Notification = {
    id: number
    title: string
    message: string
    notification_type: 'registration' | 'check_in' | 'check_out' | 'certificate' | 'general'
    is_read: boolean
    created_at: string
    related_event?: number | null
}

const NOTIFICATION_ICONS: Record<string, any> = {
    'registration': Calendar,
    'check_in': CheckCircle2,
    'check_out': Clock,
    'certificate': Mail,
    'general': Info,
}

const NOTIFICATION_COLORS: Record<string, string> = {
    'registration': 'text-blue-500 bg-blue-500/10',
    'check_in': 'text-green-500 bg-green-500/10',
    'check_out': 'text-orange-500 bg-orange-500/10',
    'certificate': 'text-purple-500 bg-purple-500/10',
    'general': 'text-neutral-500 bg-neutral-500/10',
}

export default function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const res = await apiCall.get(api.notifications())
            if (res.ok) {
                const data = await res.json()
                const list = Array.isArray(data) ? data : (data.results || [])
                setNotifications(list)
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleMarkAsRead = async (id: number) => {
        try {
            await apiCall.post(api.notificationMarkRead(id))
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        } catch (err) {
            console.error('Failed to mark as read', err)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await apiCall.post(api.notificationMarkAllRead())
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) {
            console.error('Failed to mark all as read', err)
        }
    }

    const toggleExpand = async (n: Notification) => {
        const isExpanding = expandedId !== n.id
        setExpandedId(isExpanding ? n.id : null)

        if (isExpanding && !n.is_read) {
            handleMarkAsRead(n.id)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-6 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Bell className="w-6 h-6 text-blue-500" />
                        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Notifications</h1>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400">Stay updated with your event activities and status.</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
                        <Check className="w-4 h-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-neutral-200 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-neutral-500">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No notifications yet</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-2">
                            We'll notify you when you register or participate in events.
                        </p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const Icon = NOTIFICATION_ICONS[notification.notification_type] || Info
                        const colorClass = NOTIFICATION_COLORS[notification.notification_type] || 'text-neutral-500 bg-neutral-500/10'
                        const isExpanded = expandedId === notification.id

                        return (
                            <Card
                                key={notification.id}
                                className={`
                  border transition-all duration-200 cursor-pointer overflow-hidden
                  ${notification.is_read
                                        ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-80 hover:opacity-100'
                                        : 'bg-white dark:bg-neutral-900 border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-blue-500/20'
                                    }
                `}
                                onClick={() => toggleExpand(notification)}
                            >
                                <div className="p-4 flex gap-4 items-start">
                                    <div className={`p-3 rounded-full flex-shrink-0 ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-semibold text-neutral-900 dark:text-white ${!notification.is_read && 'text-blue-600 dark:text-blue-400'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-neutral-400 whitespace-nowrap ml-2">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 ${isExpanded ? 'line-clamp-none' : ''}`}>
                                            {notification.message}
                                        </p>
                                        {isExpanded && notification.related_event && (
                                            <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/participant/event/${notification.related_event}`)
                                                    }}
                                                >
                                                    View Event Details
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                    )}
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
