'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/card'
import { LayoutDashboard, Calendar, Users, BarChart3, Settings, LogOut, QrCode, Search, Menu, X, FileText, Star, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && (resolvedTheme === 'dark' || theme === 'dark')
    ? '/hcdc white.png'
    : '/hcdc red.png'

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', color: 'text-red-500' },
    { icon: Calendar, label: 'Events', href: '/admin/events', color: 'text-orange-500' },
    { icon: Users, label: 'Participants', href: '/admin/participants', color: 'text-blue-500' },
    { icon: QrCode, label: 'Check-In', href: '/admin/checkin', color: 'text-green-500' },
    { icon: Star, label: 'Evaluations', href: '/admin/evaluations', color: 'text-yellow-500' },
    { icon: FileText, label: 'Certificates', href: '/admin/certificates', color: 'text-purple-500' },
    { icon: BarChart3, label: 'Insights', href: '/admin/insights', color: 'text-pink-500' },
    { icon: Settings, label: 'Settings', href: '/admin/settings', color: 'text-neutral-500' },
  ]

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    const { handleLogout: logout } = await import('@/lib/auth-utils')
    await logout()
    router.push('/')
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all hover:scale-105"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 w-64 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col z-30 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div
            className="flex items-center justify-center cursor-pointer group"
            onClick={() => router.push('/admin/dashboard')}
          >
            {mounted && (
              <Image
                src={logoSrc}
                alt="HCDC"
                width={160}
                height={40}
                className="w-full max-w-[140px] h-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
            )}
            {!mounted && (
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
                  group relative overflow-hidden
                `}
                onClick={() => router.push(item.href)}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : item.color} transition-transform group-hover:scale-110`} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">Admin Panel</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">Manage your events</p>
          </div>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        md:hidden fixed left-0 top-0 w-72 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col z-40 overflow-y-auto transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div
            className="flex items-center justify-center flex-1 cursor-pointer group"
            onClick={() => {
              router.push('/admin/dashboard')
              setIsMobileOpen(false)
            }}
          >
            {mounted && (
              <Image
                src={logoSrc}
                alt="HCDC"
                width={140}
                height={35}
                className="w-full max-w-[120px] h-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
            )}
            {!mounted && (
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
                  group relative overflow-hidden
                `}
                onClick={() => {
                  router.push(item.href)
                  setIsMobileOpen(false)
                }}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : item.color} transition-transform group-hover:scale-110`} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">Admin Panel</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">Manage your events</p>
          </div>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            onClick={() => {
              handleLogout()
              setIsMobileOpen(false)
            }}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
