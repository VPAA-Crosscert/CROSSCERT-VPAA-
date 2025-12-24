'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Bell, Menu, X } from 'lucide-react'

export function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'

  return (
    <nav className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-[96vw] max-w-xl rounded-full border border-zinc-800/60 dark:border-zinc-200/20 bg-white dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-center pt-4 pb-4 px-4 shadow-none">
      <div className="flex items-center justify-between w-full px-4 py-1 gap-2 sm:gap-4" style={{minHeight: 'unset', height: '2.2rem'}}>
        {/* Logo */}
        <button
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => router.push('/')}
          aria-label="CROSSCERT home"
        >
          {mounted && (
            <Image
              src={logoSrc}
              alt="CROSSCERT"
              width={200}
              height={48}
              priority
              className="w-36 sm:w-48 h-auto object-contain"
            />
          )}
        </button>

        {/* Desktop Spacer */}
        <div className="hidden md:flex flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex h-9 w-9"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
            onClick={() => router.push('/auth/signin')}
          >
            Sign In
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Mobile Menu Content */}
      {isOpen && (
        <div className="md:hidden absolute left-1/2 top-[calc(100%+0.5rem)] transform -translate-x-1/2 w-[95vw] max-w-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-border rounded-3xl animate-fade-in-down z-50">
          <div className="flex flex-col gap-2 px-4 py-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                router.push('/auth/signin')
                setIsOpen(false)
              }}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </Button>
            <Button
              variant="default"
              className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                router.push('/auth/signin')
                setIsOpen(false)
              }}
            >
              Sign In
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
