import { useEffect, useState, useRef, useMemo } from 'react'
import {
    Heading1, Heading2, Heading3, List, ListOrdered, Sparkles,
    Wand2, ArrowDownRight, ArrowUpRight, Mic, Repeat, BookOpen, Lightbulb,
    Quote, Highlighter, Table, Sigma, Code, Divide, BarChart, Settings, FileText
} from 'lucide-react'
import { cn } from '../lib/utils'

interface SlashCommandMenuProps {
    position: { top: number; left: number } | null
    query: string
    onSelect: (command: string) => void
    onClose: () => void
}

type CommandItem = {
    id: string
    label: string
    icon: any
    desc: string
    shortcut?: string
}

type CommandSection = {
    title: string
    items: CommandItem[]
}

export default function SlashCommandMenu({ position, query, onSelect, onClose }: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)

    const sections: CommandSection[] = [
        {
            title: 'AI Actions',
            items: [
                { id: 'smart', label: 'Smart Edit', icon: Sparkles, desc: 'Improve based on preferences' },
                { id: 'rewrite', label: 'Rewrite', icon: Wand2, desc: 'Change style or tone' },
                { id: 'shorten', label: 'Shorten', icon: ArrowDownRight, desc: 'Make it concise' },
                { id: 'expand', label: 'Expand', icon: ArrowUpRight, desc: 'Elaborate or add clarity' },
                { id: 'tone', label: 'Improve Tone', icon: Mic, desc: 'Formal, neutral, academic' },
                { id: 'paraphrase', label: 'Paraphrase', icon: Repeat, desc: 'Provide alternative wording' },
                { id: 'factcheck', label: 'Fact Check', icon: BookOpen, desc: 'Validate claims' },
                { id: 'explain', label: 'Explain', icon: Lightbulb, desc: 'Breakdown complex sentences' },
            ]
        },
        {
            title: 'Structure Blocks',
            items: [
                { id: 'h1', label: 'Heading 1', icon: Heading1, desc: 'Big section header', shortcut: '#' },
                { id: 'h2', label: 'Heading 2', icon: Heading2, desc: 'Medium section header', shortcut: '##' },
                { id: 'h3', label: 'Heading 3', icon: Heading3, desc: 'Small section header', shortcut: '###' },
                { id: 'bullet', label: 'Bullet List', icon: List, desc: 'Simple bullet points', shortcut: '-' },
                { id: 'ordered', label: 'Numbered List', icon: ListOrdered, desc: 'Ordered list', shortcut: '1.' },
                { id: 'quote', label: 'Quote', icon: Quote, desc: 'Capture a quote' },
                { id: 'callout', label: 'Callout', icon: Highlighter, desc: 'Highlight key info' },
            ]
        },
        {
            title: 'Insert Elements',
            items: [
                { id: 'table', label: 'Table', icon: Table, desc: 'Insert simple table' },
                { id: 'equation', label: 'Equation', icon: Sigma, desc: 'LaTeX equation' },
                { id: 'code', label: 'Code Block', icon: Code, desc: 'Code snippet' },
                { id: 'divider', label: 'Divider', icon: Divide, desc: 'Visual separation' },
                { id: 'citation', label: 'Citation', icon: BookOpen, desc: 'Insert citation placeholder' },
            ]
        },
        {
            title: 'Document Utilities',
            items: [
                { id: 'analysis', label: 'Writing Analysis', icon: BarChart, desc: 'Show score metrics' },
                { id: 'preferences', label: 'Preferences', icon: Settings, desc: 'Domain, tone, audience' },
                { id: 'outline', label: 'Show Outline', icon: FileText, desc: 'Navigate headings' },
            ]
        }
    ]

    const filteredSections = useMemo(() => {
        if (!query) return sections

        const lowerQuery = query.toLowerCase()
        return sections.map(section => ({
            ...section,
            items: section.items.filter(item =>
                item.label.toLowerCase().includes(lowerQuery) ||
                item.desc.toLowerCase().includes(lowerQuery)
            )
        })).filter(section => section.items.length > 0)
    }, [query])

    const flatItems = useMemo(() => {
        return filteredSections.flatMap(s => s.items)
    }, [filteredSections])

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % flatItems.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (flatItems[selectedIndex]) {
                    onSelect(flatItems[selectedIndex].id)
                }
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [selectedIndex, flatItems, onSelect, onClose])

    if (!position || flatItems.length === 0) return null

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-[340px] animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[400px]"
            style={{ top: position.top, left: position.left }}
        >
            <div className="overflow-y-auto py-2">
                {filteredSections.map((section: CommandSection) => (
                    <div key={section.title} className="mb-2 last:mb-0">
                        <div className="text-[11px] font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                            {section.title}
                        </div>
                        {section.items.map((item: CommandItem) => {
                            // Calculate global index for selection
                            const globalIndex = flatItems.findIndex(i => i.id === item.id)
                            const isSelected = globalIndex === selectedIndex

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.id)}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 transition-colors relative",
                                        isSelected ? "bg-purple-50" : "hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-md border shadow-sm flex-shrink-0",
                                        isSelected ? "bg-white border-purple-200 text-purple-600" : "bg-gray-50 border-gray-200 text-gray-500"
                                    )}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className={cn(
                                            "font-medium text-[13px] truncate",
                                            isSelected ? "text-purple-900" : "text-gray-700"
                                        )}>
                                            {item.label}
                                        </div>
                                        <div className="text-[11px] text-gray-400 leading-none mt-0.5 truncate">
                                            {item.desc}
                                        </div>
                                    </div>
                                    {item.shortcut && (
                                        <div className="text-[10px] font-mono text-gray-400 border border-gray-200 rounded px-1 min-w-[20px] text-center">
                                            {item.shortcut}
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-600" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
            {filteredSections.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                    No commands found
                </div>
            )}
        </div>
    )
}
