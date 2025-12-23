'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Navigation } from '@/components/navigation'
import { LandingHero } from '@/components/landing-hero'

export default function Home() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const departments = ['STE', 'CET', 'SBME', 'CHATME', 'HUSOCOM', 'COME', 'CCJE']
  const departmentGlass: Record<string, string> = {
    STE: 'bg-blue-800/60 text-blue-100 border-blue-400',
    CET: 'bg-orange-700/60 text-orange-100 border-orange-400',
    SBME: 'bg-yellow-600/60 text-yellow-50 border-yellow-400',
    CHATME: 'bg-zinc-700/60 text-zinc-100 border-zinc-400',
    HUSOCOM: 'bg-[#6d174b]/70 text-fuchsia-100 border-[#a8326e]',
    COME: 'bg-sky-800/60 text-sky-100 border-sky-400',
    CCJE: 'bg-red-800/60 text-red-100 border-red-400',
  }

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {mounted && (
          <Image
            src={logoSrc}
            alt="CROSSCERT"
            width={320}
            height={96}
            priority
            className="w-48 sm:w-64 md:w-80 h-auto object-contain"
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <LandingHero />

      {/* Marquee */}
      <div className="py-2 sm:py-3 -mt-8 sm:-mt-30 overflow-hidden flex items-center justify-center marquee-mask">
        <div className="marquee whitespace-nowrap select-none">
          {departments.map((d) => (
            <span
              key={`vis-${d}`}
              className={`mx-4 sm:mx-6 md:mx-8 text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide uppercase rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 border backdrop-blur-md shadow-sm ${departmentGlass[d] || 'bg-background/60 text-foreground/80 border-border'}`}
              style={{backgroundClip: 'padding-box', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'}}
            >
              {d}
            </span>
          ))}
          {/* full duplicate for seamless loop, hidden from assistive tech */}
          {departments.map((d) => (
            <span
              key={`dup-${d}`}
              className={`mx-4 sm:mx-6 md:mx-8 text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide uppercase rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 border backdrop-blur-md shadow-sm ${departmentGlass[d] || 'bg-background/60 text-foreground/80 border-border'}`}
              style={{backgroundClip: 'padding-box', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'}}
              aria-hidden
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
