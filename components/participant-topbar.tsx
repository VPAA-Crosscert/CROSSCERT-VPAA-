'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'

export function ParticipantTopbar() {
  const [userEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userEmail') || 'user'
    }
    return 'user'
  })
  const { resolvedTheme } = useTheme()

  return (
    <div className="h-14 sm:h-16 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 flex items-center justify-between px-3 sm:px-4 md:px-6 gap-2 sm:gap-4">
      <div className="flex items-center gap-2">
        <Image
          src={resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'}
          alt="CROSSCERT"
          width={200}
          height={48}
          className="h-14 sm:h-16 w-auto object-contain"
          priority
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-muted">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs sm:text-sm font-bold shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs sm:text-sm text-foreground hidden sm:inline truncate max-w-[120px] md:max-w-none">{userEmail}</span>
        </div>
      </div>
    </div>
  )
}
