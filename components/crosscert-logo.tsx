'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function CrosscertLogo() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const logoSrc = resolvedTheme === 'dark'
        ? '/crosscert-typo-white.png'
        : '/crosscert-typo-black.png'

    return (
        <div className="fixed bottom-6 right-6 z-10 pointer-events-none">
            <Image
                src={logoSrc}
                alt="CROSSCERT"
                width={140}
                height={28}
                className="w-auto h-6 object-contain opacity-30 hover:opacity-60 transition-opacity pointer-events-auto"
                priority
            />
        </div>
    )
}
