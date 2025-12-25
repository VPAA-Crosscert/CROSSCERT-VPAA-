export interface Theme {
    id: number
    name: string
    color: string
    accent: string
    textColor?: string
    border?: string
    gradientFrom: string
    description?: string
}

export const THEMES: Theme[] = [
    { id: 1, name: 'HCDC', color: 'bg-blue-900', accent: '#1e3a8a', textColor: 'text-blue-900', border: 'border-blue-900', gradientFrom: 'from-blue-900' },
    { id: 2, name: 'CCJE', color: 'bg-red-700', accent: '#b91c1c', textColor: 'text-red-700', border: 'border-red-700', gradientFrom: 'from-red-700' },
    { id: 3, name: 'CET', color: 'bg-orange-500', accent: '#f97316', textColor: 'text-orange-500', border: 'border-orange-500', gradientFrom: 'from-orange-500' },
    { id: 4, name: 'CHATME', color: 'bg-gray-500', accent: '#6b7280', textColor: 'text-gray-500', border: 'border-gray-500', gradientFrom: 'from-gray-500' },
    { id: 5, name: 'HUSOCOM', color: 'bg-fuchsia-700', accent: '#a21caf', textColor: 'text-fuchsia-700', border: 'border-fuchsia-700', gradientFrom: 'from-fuchsia-700' },
    { id: 6, name: 'COME', color: 'bg-sky-600', accent: '#0284c7', textColor: 'text-sky-600', border: 'border-sky-600', gradientFrom: 'from-sky-600' },
    { id: 7, name: 'SBME', color: 'bg-yellow-500', accent: '#eab308', textColor: 'text-yellow-600', border: 'border-yellow-500', gradientFrom: 'from-yellow-500' },
    { id: 8, name: 'STE', color: 'bg-blue-600', accent: '#2563eb', textColor: 'text-blue-600', border: 'border-blue-600', gradientFrom: 'from-blue-600' },
    { id: 9, name: 'Dark Red', color: 'bg-red-950', accent: '#450a0a', textColor: 'text-red-950', border: 'border-red-950', gradientFrom: 'from-red-950' },
    { id: 10, name: 'Dark Blue', color: 'bg-slate-900', accent: '#0f172a', textColor: 'text-slate-900', border: 'border-slate-900', gradientFrom: 'from-slate-900' },
    { id: 11, name: 'White', color: 'bg-white', accent: '#ffffff', textColor: 'text-slate-900', border: 'border-slate-200', gradientFrom: 'from-white' },
]

export const getThemeByName = (name: string | undefined): Theme => {
    if (!name) return THEMES[0] // Default to HCDC
    return THEMES.find(t => t.name.toLowerCase() === name.toLowerCase()) || THEMES[0]
}

export const getThemeById = (id: number | undefined): Theme => {
    if (!id) return THEMES[0]
    return THEMES.find(t => t.id === id) || THEMES[0]
}
