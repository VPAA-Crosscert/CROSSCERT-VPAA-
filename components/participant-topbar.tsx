'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function ParticipantTopbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('')
  // Fetch unread notifications count
  const [unreadCount, setUnreadCount] = useState(0)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    setMounted(true)
    const storedFirstName = localStorage.getItem('userFirstName')
    const storedLastName = localStorage.getItem('userLastName')
    const storedEmail = localStorage.getItem('userEmail')

    if (storedFirstName && storedLastName) {
      setUserName(`${storedFirstName} ${storedLastName}`)
    } else if (storedFirstName) {
      setUserName(storedFirstName)
    }

    if (storedEmail) {
      setUserEmail(storedEmail)
    }

    const fetchUnreadCount = async () => {
      try {
        const { apiCall, api } = await import('@/lib/api-config')
        const res = await apiCall.get(api.notifications())
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : (data.results || [])
          const unread = list.filter((n: any) => !n.is_read).length
          setUnreadCount(unread)
        }
      } catch (err) {
        console.error('Failed to fetch notifications count', err)
      }
    }
    fetchUnreadCount()
  }, [])

  // Get page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length < 2) return 'Dashboard'
    const page = segments[segments.length - 1]
    return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ')
  }

  return (
    <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white truncate">
          {getPageTitle()}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
          {userName && userEmail ? `${userName} • ${userEmail}` : userName || userEmail || 'Welcome'}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all relative"
            onClick={() => router.push('/participant/notifications')}
          >
            <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-neutral-900" />
            )}
          </Button>
        </div>

        {/* User Profile */}
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all group"
          onClick={() => router.push('/participant/settings')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 group-hover:shadow-xl group-hover:shadow-red-500/40 transition-all">
            {userEmail || userName ? (
              <span className="text-sm font-bold">
                {(userName || userEmail).charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          {mounted && (userName || userEmail) && (
            <div className="hidden sm:block text-left max-w-[150px]">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {userName || 'Participant'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {userEmail}
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
