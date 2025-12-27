'use client'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Linkedin, Mail, Code2, Sparkles, Terminal } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const developers = [
    {
        name: 'Catherine Arnado',
        role: 'Lead Developer',
        description: 'Specializing in full-stack architecture and PDF generation engines.',
        initials: 'CA',
        color: 'bg-red-500'
    },
    {
        name: 'Norman Asakil',
        role: 'Backend Architect',
        description: 'Expert in Django CRM systems and institutional API security.',
        initials: 'NA',
        color: 'bg-blue-500'
    },
    {
        name: 'Ashlee Madriñan',
        role: 'UI/UX Designer',
        description: 'Creating immersive participant experiences and polished layout systems.',
        initials: 'AM',
        color: 'bg-purple-500'
    },
    {
        name: 'Joey Salazar',
        role: 'Frontend Engineer',
        description: 'Specializing in high-performance Next.js application logic.',
        initials: 'JS',
        color: 'bg-emerald-500'
    },
    {
        name: 'Xander Palma',
        role: 'Systems Integrator',
        description: 'Focusing on institutional workflow automation and SMTP clusters.',
        initials: 'XP',
        color: 'bg-orange-500'
    }
]

export default function DevelopersPage() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'

    return (
        <div className="min-h-screen relative selection:bg-red-500/30 overflow-x-hidden">
            {/* Background with dark subtle gradient */}
            <div className="fixed inset-0 -z-10 bg-background dark:bg-gradient-to-b dark:from-black dark:to-[#450a0a]" />

            <Navigation />

            <div className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header section */}
                    <div className="text-center mb-20 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/5 border-white/10 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Terminal className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Production Team</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tighter text-balance">
                            The minds behind <span className="text-red-500">CROSSCERT</span>.
                        </h1>

                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            A specialized team of developers and designers committed to revolutionizing institutional event logistics at the Holy Cross of Davao College.
                        </p>
                    </div>

                    {/* Developers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {developers.map((dev, index) => (
                            <Card
                                key={dev.name}
                                className="group relative overflow-hidden bg-white/5 dark:bg-white/5 border-white/10 backdrop-blur-xl p-8 hover:bg-white/10 transition-all duration-500 cursor-default"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Decorative glow */}
                                <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${dev.color} group-hover:opacity-40 transition-opacity duration-500`} />

                                <div className="relative space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 rounded-2xl ${dev.color} flex items-center justify-center text-white text-xl font-black shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                                            {dev.initials}
                                        </div>
                                        <div className="flex gap-4">
                                            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                                            <a href="#" className="text-zinc-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-foreground group-hover:text-red-500 transition-colors duration-300">
                                            {dev.name}
                                        </h3>
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                                            {dev.role}
                                        </Badge>
                                    </div>

                                    <p className="text-zinc-400 leading-relaxed text-sm">
                                        {dev.description}
                                    </p>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-zinc-600">
                                            <Code2 className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Stack Verified</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Footer Branding */}
                    <div className="mt-32 pt-20 border-t border-white/5 text-center flex flex-col items-center gap-12">
                        <Image
                            src={logoSrc}
                            alt="CROSSCERT"
                            width={240}
                            height={72}
                            className="opacity-40 hover:opacity-100 transition-opacity duration-500"
                        />
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Holy Cross of Davao College, Inc.</p>
                            <p className="text-xs text-zinc-600">Office of the Vice President for Academic Affairs</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
