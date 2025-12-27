'use client'

import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import {
    Github,
    Linkedin,
    Terminal,
    Cpu,
    GitBranch,
    MessageSquare,
    CheckCircle2,
    AlertTriangle,
    Trophy,
    ArrowRight,
    Code2,
    Sparkles,
    Layers,
    Plus,
    BarChart3,
    Users,
    TrendingUp,
    Activity
} from 'lucide-react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

// --- Web Audio SFX Generator ---
const playSound = (type: 'click' | 'hover' | 'startup') => {
    if (typeof window === 'undefined') return
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'click') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    } else if (type === 'hover') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        gain.gain.setValueAtTime(0.02, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
    } else if (type === 'startup') {
        osc.type = 'square'
        osc.frequency.setValueAtTime(100, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5)
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start()
        osc.stop(ctx.currentTime + 0.6)
    }
}

// --- Data ---
const developers = [
    {
        name: 'Catherine Arnado',
        role: 'Project Manager/Full-Stack Developer',
        description: 'The tactical lead driving the architecture and production lifecycle.',
        image: '../developers/CATHERINE ARNADO.png',
        color: 'from-rose-500 to-red-600'
    },
    {
        name: 'Xander Palma',
        role: 'Systems Analyst/Backend Developer',
        description: 'The logic mastermind behind the Django core and security protocols.',
        image: '../developers/XANDER PALMA.png',
        color: 'from-orange-500 to-amber-600'
    },
    {
        name: 'Ashlee Madriñan',
        role: 'Technical Writer',
        description: 'Crafting the narrative and institutional documentation with precision.',
        image: '../developers/ASHLEE MADRINAN.png',
        color: 'from-purple-500 to-fuchsia-600'
    },
    {
        name: 'Joey Salazar',
        role: 'Brand Designer',
        description: 'The visual artist defining the CROSSCERT aesthetic and user experience.',
        image: '../developers/JOEY SALAZAR.png',
        color: 'from-emerald-500 to-teal-600'
    },
    {
        name: 'Norman Asakil',
        role: 'Quality Assurance (QA) Tester',
        description: 'Ensuring absolute platform stability and sub-second processing speed.',
        image: '../developers/NORMAN ASAKIL.png',
        color: 'from-blue-500 to-indigo-600'
    }
]

const ganttPhases = [
    {
        phase: 'Phase 1',
        name: 'Institutional Infrastructure',
        tasks: ['System Blueprinting', 'Data Modeling', 'RBAC Setup'],
        icon: <Terminal className="w-5 h-5" />
    },
    {
        phase: 'Phase 2',
        name: 'Administrative Operations',
        tasks: ['Event Lifecycle Logic', 'Attendance Services', 'Operation Dashboard'],
        icon: <Layers className="w-5 h-5" />
    },
    {
        phase: 'Phase 3',
        name: 'Participant Experience',
        tasks: ['Interactive Landing Pages', 'Digital Pass System', 'Evaluation Engine'],
        icon: <Sparkles className="w-5 h-5" />
    },
    {
        phase: 'Phase 4',
        name: 'Automation Hub',
        tasks: ['PDF Generation Core', 'Achievement SMTP Mailer', 'Portfolio Hub'],
        icon: <Cpu className="w-5 h-5" />
    },
    {
        phase: 'Phase 5',
        name: 'Analytics & Visual Polishing',
        tasks: ['Data Visualization', 'Premium Theme Engine', 'Mobile Optimization'],
        icon: <GitBranch className="w-5 h-5" />
    }
]

const channelDescriptions: Record<string, string> = {
    'announcements': 'Official team announcements, milestone updates, and important project news.',
    'rules': 'Project guidelines, coding standards, and collaboration protocols.',
    'polls': 'Team voting on features, design decisions, and sprint planning.',
    'tasks': 'Active development tasks, bug tracking, and sprint backlog management.',
    'documents': 'Technical documentation, API specs, and architecture diagrams.',
    'feature-ideas': 'Brainstorming new features, enhancements, and innovation discussions.',
    'completed-tasks': 'Archive of finished tasks, sprint retrospectives, and achievements.'
}

// --- Components ---

const DeveloperCard = ({ dev, i, scrollYProgress, brandColor, brandBg }: { dev: any, i: number, scrollYProgress: any, brandColor: string, brandBg: string }) => {
    const y = useTransform(scrollYProgress, [0.1 + i * 0.05, 0.2 + i * 0.05], [100, 0])
    const rotate = useTransform(scrollYProgress, [0.1 + i * 0.05, 0.2 + i * 0.05], [5, 0])

    return (
        <motion.div
            className="relative"
            style={{ y, rotate }}
        >
            <Card
                className="p-8 w-[380px] bg-card/40 backdrop-blur-3xl border-white/10 hover:border-primary/50 transition-all duration-700 overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-t border-t-white/20"
                onMouseEnter={() => playSound('hover')}
                onClick={() => playSound('click')}
            >
                <div className="relative h-64 mb-8 rounded-2xl overflow-hidden glass">
                    <Image
                        src={dev.image}
                        alt={dev.name}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                </div>

                <h3 className="text-2xl font-display font-black uppercase mb-1 tracking-tighter group-hover:text-primary transition-colors">
                    {dev.name}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">
                    {dev.role}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {dev.description}
                </p>
            </Card>
        </motion.div>
    )
}

export default function DevelopersPage() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [showWelcome, setShowWelcome] = useState(true)
    const [activeDialog, setActiveDialog] = useState<string | null>(null)
    const [showVoiceCall, setShowVoiceCall] = useState(false)
    const { scrollYProgress } = useScroll()
    const router = useRouter()

    // Horizontal Scrolling Transformation
    const xTranslate = useTransform(scrollYProgress, [0.1, 1], ['0%', '-85%'])
    const smoothX = useSpring(xTranslate, { damping: 20, stiffness: 100 })

    // Hero Transforms
    const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 20])
    const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0])
    const heroBlur = useTransform(scrollYProgress, [0, 0.08], ['blur(0px)', 'blur(20px)'])

    // Team Header Transforms
    const teamHeaderOpacity = useTransform(scrollYProgress, [0.08, 0.12], [0, 1])
    const teamHeaderX = useTransform(scrollYProgress, [0.08, 0.12], [100, 0])

    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY })
        const handleMouseOver = (e: MouseEvent) => {
            const tag = (e.target as HTMLElement).tagName.toLowerCase()
            setIsHovering(tag === 'button' || tag === 'a')
        }
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseover', handleMouseOver)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseover', handleMouseOver)
        }
    }, [])

    useEffect(() => {
        setMounted(true)
        const timer = setTimeout(() => {
            setShowWelcome(false)
            playSound('startup')
        }, 2500)
        return () => clearTimeout(timer)
    }, [])

    if (!mounted) return null

    const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'
    const brandColor = resolvedTheme === 'dark' ? 'text-red-600' : 'text-red-600'
    const brandBg = resolvedTheme === 'dark' ? 'bg-red-600' : 'bg-red-600'
    const heroBgSrc = resolvedTheme === 'dark' ? '/developers/herobg/teampic.png' : '/developers/herobg/teampic.png'
    const pyColor = resolvedTheme === 'dark' ? 'text-red-500' : 'text-red-500'

    return (
        <div className="relative min-h-[800vh] bg-background font-sans selection:bg-primary/30">
            <motion.div
                className="custom-cursor hidden lg:block"
                animate={{
                    x: position.x - 10,
                    y: position.y - 10,
                    scale: isHovering ? 2.5 : 1,
                    opacity: 0.8
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.5 }}
            />
            <div className="fixed bottom-10 right-10 z-[100] backdrop-blur-md bg-background/50 p-2 rounded-full border border-primary/20 shadow-2xl">
                <ThemeToggle />
            </div>

            {/* --- Welcome Screen --- */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-background pointer-events-auto"
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    >
                        <div className="relative flex flex-col items-center">
                            <motion.h1
                                className="text-4xl md:text-7xl font-display font-black uppercase tracking-tightest text-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                Meet the <span className={brandColor}>Developers</span>
                            </motion.h1>
                            <div className="mt-4 flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`w-12 h-1 ${brandBg}`}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Main Content Section (Pinnned) --- */}
            <div className="sticky top-0 h-screen overflow-hidden">

                {/* Horizontal Moving Content */}
                <motion.div
                    className="flex h-full w-fit items-center pr-[10vw] gap-[20vw] relative"
                    style={{ x: smoothX }}
                >

                    {/* 1. Hero Section with Full Background */}
                    <section className="min-w-screen min-h-screen flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            <Image
                                src={heroBgSrc}
                                alt="Team Background"
                                fill
                                className="object-cover opacity-20"
                                priority
                            />
                        </div>

                        <motion.div
                            className="flex flex-col items-center space-y-8 relative z-10"
                            style={{
                                scale: heroScale,
                                opacity: heroOpacity,
                                filter: heroBlur,
                            }}
                        >
                            <div className="inline-block px-6 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
                                <span className="text-sm font-black tracking-widest uppercase">WS101</span>
                            </div>

                            <div className="relative">
                                <h1 className="text-[10vw] md:text-[8vw] lg:text-[10vw] font-display font-black leading-none tracking-tightest whitespace-nowrap">
                                    PINAY<span className={pyColor}>.PY</span>
                                </h1>
                            </div>

                            <motion.p
                                className="text-2xl text-muted-foreground uppercase tracking-widest font-medium"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                THE BUILDERS BEHIND CROSSCERT
                            </motion.p>
                        </motion.div>
                    </section>

                    {/* 2. Meet The Team Section - CLEARED (Ready for New Design) */}
                    {/* 2. Meet The Team Section */}
                    <section className="flex flex-col gap-24 relative">
                        <motion.div
                            className="space-y-4"
                            style={{
                                opacity: teamHeaderOpacity,
                                x: teamHeaderX,
                            }}
                        >
                            <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter">
                                Meet the <span className={brandColor}>Team</span>
                            </h2>
                            <div className={`h-2 w-48 ${brandBg}`} />
                        </motion.div>

                        <div className="flex items-center gap-12 relative px-20">
                            {/* CPU Connection Line - Industrial Style */}
                            <div className="absolute top-1/2 left-0 w-full flex items-center -z-10 px-10">
                                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent relative">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${brandBg}`}
                                            style={{ left: `${i * 5}%` }}
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {developers.map((dev, i) => (
                                <DeveloperCard
                                    key={dev.name}
                                    dev={dev}
                                    i={i}
                                    scrollYProgress={scrollYProgress}
                                    brandColor={brandColor}
                                    brandBg={brandBg}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 3. About CROSSCERT Section */}
                    <section className="flex flex-col items-center gap-12 min-w-screen justify-center">
                        {/* Logos - Bigger */}
                        <div className="flex items-center gap-12">
                            <motion.div
                                className="w-64 h-64 relative flex-shrink-0"
                                whileInView={{ rotate: [0, 90, 0] }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            >
                                <Image src="/crosscert-logo.png" alt="Emblem" fill className="object-contain" />
                            </motion.div>
                            <Image src={logoSrc} alt="Typography" width={450} height={112} className="object-contain" />
                        </div>

                        {/* CROSS + CERT Containers with Hover */}
                        <div className="flex items-center gap-6">
                            <motion.div
                                className="glass p-8 rounded-3xl border-l-4 border-l-red-600 cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 min-w-[280px]"
                                whileHover={{ y: -10 }}
                            >
                                <h4 className="text-4xl font-display font-black uppercase mb-3 group-hover:text-red-500 transition-colors">CROSS</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">Derived from the "Holy Cross", representing the institutional roots of the project.</p>
                            </motion.div>

                            {/* Plus Icon */}
                            <motion.div
                                className={`w-12 h-12 rounded-full ${brandBg} flex items-center justify-center text-white shadow-2xl`}
                                animate={{ rotate: [0, 90, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            >
                                <Plus className="w-6 h-6" />
                            </motion.div>

                            <motion.div
                                className="glass p-8 rounded-3xl border-l-4 border-l-blue-600 cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 min-w-[280px]"
                                whileHover={{ y: -10 }}
                            >
                                <h4 className="text-4xl font-display font-black uppercase mb-3 group-hover:text-blue-500 transition-colors">CERT</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">Focusing on "Certificates" – the proof of achievement and validation.</p>
                            </motion.div>
                        </div>

                        {/* Objectives Marquee */}
                        <div className="w-full overflow-hidden relative">
                            <motion.div
                                className="flex gap-8 whitespace-nowrap"
                                animate={{ x: ['0%', '-50%'] }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            >
                                {[
                                    'Sub-second check-in processing',
                                    'Verified digital access passes',
                                    'Automated PDF generation engine',
                                    'Institutional analytics dashboard',
                                    'Sub-second check-in processing',
                                    'Verified digital access passes',
                                    'Automated PDF generation engine',
                                    'Institutional analytics dashboard'
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${brandBg}`} />
                                        <span className="text-lg font-bold uppercase tracking-tight text-muted-foreground">{text}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </section>

                    {/* 4. Our Story (Discord Style) */}
                    <section className="flex flex-col gap-16 min-w-[80vw]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-7xl font-display font-black uppercase tracking-tighter">Our <span className={brandColor}>Story</span></h2>
                                <p className="text-muted-foreground mt-2">From challenges to triumph, our development journey.</p>
                            </div>
                            <Badge variant="outline" className="text-xl px-6 py-2 border-border/50 uppercase font-black">Milestone.log</Badge>
                        </div>

                        <div className="grid grid-cols-12 gap-8">
                            {/* Sidebar Mockup */}
                            <div className="col-span-3 glass rounded-3xl p-6 border-border/20">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6">
                                    <div className={`w-8 h-8 rounded-lg ${brandBg} flex items-center justify-center text-white`}>
                                        <MessageSquare size={16} />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-xs">Discord Planning</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase text-muted-foreground px-3 mb-2">General</div>
                                    {['Announcements', 'Rules', 'Polls'].map(text => (
                                        <div
                                            key={text}
                                            className="flex items-center gap-2 p-2 px-3 rounded-lg hover:bg-white/5 text-sm text-muted-foreground group cursor-pointer transition-colors"
                                            onClick={() => {
                                                setActiveDialog(text.toLowerCase())
                                                playSound('click')
                                            }}
                                        >
                                            <span className="text-lg opacity-50">#</span>
                                            <span className="group-hover:text-foreground">{text.toLowerCase()}</span>
                                        </div>
                                    ))}

                                    <div className="text-[10px] font-black uppercase text-muted-foreground px-3 mt-6 mb-2">Workspaces</div>
                                    {[
                                        { name: 'Tasks', icon: '#' },
                                        { name: 'Documents', icon: '#' },
                                        { name: 'Feature-Ideas', icon: '#' },
                                        { name: 'Completed-Tasks', icon: '#' }
                                    ].map(chan => (
                                        <div
                                            key={chan.name}
                                            className="flex items-center gap-2 p-2 px-3 rounded-lg hover:bg-white/5 text-sm text-muted-foreground group cursor-pointer transition-colors"
                                            onClick={() => {
                                                setActiveDialog(chan.name.toLowerCase())
                                                playSound('click')
                                            }}
                                        >
                                            <span className="text-lg opacity-50">{chan.icon}</span>
                                            <span className="group-hover:text-foreground">{chan.name.toLowerCase()}</span>
                                        </div>
                                    ))}

                                    <div className="text-[10px] font-black uppercase text-muted-foreground px-3 mt-6 mb-2">Voice Channels</div>
                                    <div
                                        className="flex items-center gap-2 p-2 px-3 rounded-lg bg-green-500/10 text-green-500 text-sm cursor-pointer hover:bg-green-500/20 transition-colors"
                                        onClick={() => {
                                            setShowVoiceCall(true)
                                            playSound('click')
                                        }}
                                    >
                                        <span className="text-lg">🔊</span>
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Meeting (Live)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chat/Content Area */}
                            <div className="col-span-9 flex flex-col gap-6">
                                <div className="glass p-10 rounded-[3rem] border-red-500/20 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <AlertTriangle className="w-16 h-16 text-red-500/20 group-hover:text-red-500 transition-colors duration-500" />
                                    </div>
                                    <h4 className="text-red-500 font-display font-black text-3xl uppercase mb-4 flex items-center gap-4">
                                        Challenges Faced
                                    </h4>
                                    <p className="text-lg leading-relaxed text-muted-foreground font-medium italic">
                                        "Our build and system got ruined on the day of the presentation. We had only 2 hours to debug it, but we couldn't fix it in time. The grounds were shaky, but we didn't give up."
                                    </p>
                                </div>

                                <div className="glass p-10 rounded-[3rem] border-emerald-500/20 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Trophy className="w-16 h-16 text-emerald-500/20 group-hover:text-emerald-500 transition-colors duration-500" />
                                    </div>
                                    <h4 className="text-emerald-500 font-display font-black text-3xl uppercase mb-4 flex items-center gap-4">
                                        The Win
                                    </h4>
                                    <p className="text-lg leading-relaxed text-muted-foreground font-medium uppercase tracking-tightest">
                                        "We were given a final chance to present. We pivot, we debugged, and we delivered. Result: A perfect score and a validated system."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Discord Channel Dialog */}
                    <AnimatePresence>
                        {activeDialog && (
                            <motion.div
                                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveDialog(null)}
                            >
                                <motion.div
                                    className="glass p-8 rounded-3xl border-primary/20 max-w-md mx-4"
                                    initial={{ scale: 0.8, y: 50 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.8, y: 50 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-lg ${brandBg} flex items-center justify-center text-white`}>
                                            <MessageSquare size={20} />
                                        </div>
                                        <h3 className="text-2xl font-display font-black uppercase tracking-tighter">#{activeDialog}</h3>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed mb-6">
                                        {channelDescriptions[activeDialog] || 'Channel description not available.'}
                                    </p>
                                    <button
                                        className={`w-full px-6 py-3 rounded-xl ${brandBg} text-white font-black uppercase tracking-widest hover:scale-105 transition-transform`}
                                        onClick={() => {
                                            setActiveDialog(null)
                                            playSound('click')
                                        }}
                                    >
                                        Close
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Discord Voice Call Modal */}
                    <AnimatePresence>
                        {showVoiceCall && (
                            <motion.div
                                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowVoiceCall(false)}
                            >
                                <motion.div
                                    className="glass p-8 rounded-3xl border-primary/20 max-w-4xl w-full mx-4 bg-background/95"
                                    initial={{ scale: 0.8, y: 50 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.8, y: 50 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white`}>
                                                <span className="text-lg">🔊</span>
                                            </div>
                                            <h3 className="text-2xl font-display font-black uppercase tracking-tighter">pinay.py</h3>
                                        </div>
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">LIVE</Badge>
                                    </div>

                                    {/* Name Grid - No Images, Only Colored Avatars */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {[
                                            { name: 'Catherine Arnado', role: 'Project Manager', color: 'from-purple-500 to-pink-600' },
                                            { name: 'Xander Palma', role: 'Systems Analyst', color: 'from-cyan-500 to-blue-600' },
                                            { name: 'Ashlee Madriñan', role: 'Technical Writer', color: 'from-green-500 to-emerald-600' },
                                            { name: 'Joey Salazar', role: 'Brand Designer', color: 'from-orange-500 to-red-600' },
                                            { name: 'Norman Asakil', role: 'QA Tester', color: 'from-blue-500 to-indigo-600' }
                                        ].map((member, i) => (
                                            <motion.div
                                                key={member.name}
                                                className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border flex flex-col items-center justify-center p-4"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                {/* Colored Avatar Circle with Initials */}
                                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-black text-2xl mb-3`}>
                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                </div>

                                                {/* Name and Role */}
                                                <div className="text-center">
                                                    <div className="text-foreground font-bold text-sm">{member.name}</div>
                                                    <div className="text-muted-foreground text-xs">{member.role}</div>
                                                </div>

                                                {/* Online Indicator */}
                                                <motion.div
                                                    className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500"
                                                    animate={{ opacity: [1, 0.5, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Discord Controls */}
                                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                        <div className="flex items-center gap-2">
                                            <button className="w-10 h-10 rounded-full bg-[#5865F2] hover:bg-[#4752C4] flex items-center justify-center transition-colors">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </button>
                                            <button className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                                                <Users className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 flex items-center gap-2 transition-colors"
                                            onClick={() => {
                                                setShowVoiceCall(false)
                                                playSound('click')
                                            }}
                                        >
                                            <span className="text-white text-sm font-semibold">Disconnect</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 5. Phase / Gantt Section */}
                    <section className="flex flex-col gap-12 min-w-[100vw]">
                        <div className="space-y-4">
                            <h2 className="text-6xl font-display font-black uppercase tracking-tighter">
                                Gantt <span className={brandColor}>Chart</span>
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">The roadmap of our technological evolution.</p>
                        </div>

                        <div className="grid grid-cols-5 gap-6">
                            {/* Phase 1: Institutional Infrastructure */}
                            <motion.div
                                className="glass p-6 rounded-[2rem] border-white/5 relative group hover:border-primary/40 transition-all duration-700 h-[450px] flex flex-col"
                                whileHover={{ y: -20 }}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${brandBg} flex items-center justify-center text-white mb-6 shadow-2xl`}>
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em] mb-2">Phase 1</div>
                                <h3 className="text-lg font-display font-black uppercase mb-4 tracking-tighter leading-tight">Institutional Infrastructure</h3>

                                {/* Code Block Visual */}
                                <div className="flex-1 space-y-2 mb-4">
                                    <div className="bg-white/5 rounded-lg p-3 font-mono text-[10px] leading-relaxed">
                                        <div className="text-emerald-400">class <span className="text-blue-400">Event</span>:</div>
                                        <div className="pl-4 text-muted-foreground">def __init__(self):</div>
                                        <div className="pl-8 text-yellow-400">self.rbac = True</div>
                                    </div>
                                    <div className="space-y-1">
                                        {['System Blueprinting', 'Data Modeling', 'RBAC Setup'].map((task, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                <span className="line-clamp-1">{task}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-white/5">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${brandBg}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '100%' }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phase 2: Administrative Operations */}
                            <motion.div
                                className="glass p-6 rounded-[2rem] border-white/5 relative group hover:border-primary/40 transition-all duration-700 h-[450px] flex flex-col"
                                whileHover={{ y: -20 }}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${brandBg} flex items-center justify-center text-white mb-6 shadow-2xl`}>
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em] mb-2">Phase 2</div>
                                <h3 className="text-lg font-display font-black uppercase mb-4 tracking-tighter leading-tight">Administrative Operations</h3>

                                {/* Flow Diagram */}
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 mb-4">
                                    <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-lg p-2 text-center">
                                        <div className="text-[10px] font-black uppercase text-blue-400">Create Event</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 rotate-90 text-muted-foreground" />
                                    <div className="w-full bg-purple-500/20 border border-purple-500/50 rounded-lg p-2 text-center">
                                        <div className="text-[10px] font-black uppercase text-purple-400">Check-in</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 rotate-90 text-muted-foreground" />
                                    <div className="w-full bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-2 text-center">
                                        <div className="text-[10px] font-black uppercase text-emerald-400">Dashboard</div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-white/5">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${brandBg}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '100%' }}
                                            transition={{ delay: 0.7, duration: 1 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phase 3: Participant Experience */}
                            <motion.div
                                className="glass p-6 rounded-[2rem] border-white/5 relative group hover:border-primary/40 transition-all duration-700 h-[450px] flex flex-col"
                                whileHover={{ y: -20 }}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${brandBg} flex items-center justify-center text-white mb-6 shadow-2xl`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em] mb-2">Phase 3</div>
                                <h3 className="text-lg font-display font-black uppercase mb-4 tracking-tighter leading-tight">Participant Experience</h3>

                                {/* Countup Stats */}
                                <div className="flex-1 flex flex-col justify-center gap-4 mb-4">
                                    <div className="text-center">
                                        <motion.div
                                            className="text-4xl font-display font-black text-primary"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                transition={{ duration: 2 }}
                                            >
                                                500+
                                            </motion.span>
                                        </motion.div>
                                        <div className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Active Users</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white/5 rounded-lg p-2 text-center">
                                            <div className="text-xl font-black text-emerald-400">98%</div>
                                            <div className="text-[8px] uppercase text-muted-foreground">Satisfaction</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2 text-center">
                                            <div className="text-xl font-black text-blue-400">0.3s</div>
                                            <div className="text-[8px] uppercase text-muted-foreground">Check-in</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-white/5">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${brandBg}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '100%' }}
                                            transition={{ delay: 0.9, duration: 1 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phase 4: Automation Hub */}
                            <motion.div
                                className="glass p-6 rounded-[2rem] border-white/5 relative group hover:border-primary/40 transition-all duration-700 h-[450px] flex flex-col"
                                whileHover={{ y: -20 }}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${brandBg} flex items-center justify-center text-white mb-6 shadow-2xl`}>
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em] mb-2">Phase 4</div>
                                <h3 className="text-lg font-display font-black uppercase mb-4 tracking-tighter leading-tight">Automation Hub</h3>

                                {/* Automation Icons */}
                                <div className="flex-1 flex flex-col justify-center gap-3 mb-4">
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                        <Code2 className="w-5 h-5 text-purple-400" />
                                        <div className="text-[10px] font-bold uppercase">PDF Engine</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                        <div className="text-[10px] font-bold uppercase">SMTP Mailer</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                        <div className="text-[10px] font-bold uppercase">Portfolio</div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-white/5">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${brandBg}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '100%' }}
                                            transition={{ delay: 1.1, duration: 1 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phase 5: Analytics & Visual Polishing */}
                            <motion.div
                                className="glass p-6 rounded-[2rem] border-white/5 relative group hover:border-primary/40 transition-all duration-700 h-[450px] flex flex-col"
                                whileHover={{ y: -20 }}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${brandBg} flex items-center justify-center text-white mb-6 shadow-2xl`}>
                                    <GitBranch className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.15em] mb-2">Phase 5</div>
                                <h3 className="text-lg font-display font-black uppercase mb-4 tracking-tighter leading-tight">Analytics & Polishing</h3>

                                {/* Analytics Chart */}
                                <div className="flex-1 flex flex-col justify-center mb-4">
                                    <div className="flex items-end justify-between h-32 gap-1 px-2">
                                        {[40, 65, 45, 80, 95, 70, 100].map((height, i) => (
                                            <motion.div
                                                key={i}
                                                className={`flex-1 rounded-t-lg ${brandBg}`}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${height}%` }}
                                                transition={{ delay: i * 0.1 + 1.3, duration: 0.5 }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase text-emerald-400">Performance Optimized</span>
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-white/5">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${brandBg}`}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '100%' }}
                                            transition={{ delay: 1.3, duration: 1 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* 6. Ready to Scale - Final Section */}
                    <section className="min-w-[100vw] min-h-screen flex flex-col items-center justify-center text-center px-32">
                        <h2 className="text-9xl font-display font-black uppercase tracking-tightest mb-8">
                            READY TO <span className={brandColor}>SCALE?</span>
                        </h2>
                        <p className="text-2xl text-muted-foreground max-w-2xl mb-12 uppercase tracking-widest font-bold">
                            CROSSCERT is more than just a project; it's a new standard for HCDC events.
                        </p>
                        <Link href="/">
                            <motion.button
                                className={`px-12 py-6 rounded-2xl ${brandBg} text-white text-xl font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all`}
                                whileHover={{ rotate: 1, boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                                onClick={() => playSound('click')}
                            >
                                Back to Home
                            </motion.button>
                        </Link>
                    </section>

                </motion.div>

                {/* Scroll Progress Bar at Bottom */}


                {/* Gradual Blur Mask on Right End */}
                <div className="absolute top-0 right-0 w-[15vw] h-full bg-gradient-to-l from-background to-transparent pointer-events-none backdrop-blur-[2px]" />
            </div>

            <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        .tracking-tightest {
          letter-spacing: -0.05em;
        }
      `}</style>
        </div>
    )
}
