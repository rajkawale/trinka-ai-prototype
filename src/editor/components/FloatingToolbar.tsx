import React from 'react'
import { BubbleMenu, Editor } from '@tiptap/react'
import { Sparkles, ChevronDown, Minimize2, Maximize2, Mic, RefreshCw, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { AiAction } from '../hooks/useAI'

export const PRIMARY_ACTIONS: AiAction[] = [
    { id: 'rewrite', label: 'Rewrite', description: 'Rephrase for clarity', mode: 'rewrite', tone: 'academic', icon: RefreshCw },
    { id: 'shorten', label: 'Shorten', description: 'Make it concise', mode: 'shorten', tone: 'neutral', icon: Minimize2 },
]

export const SECONDARY_ACTIONS: AiAction[] = [
    { id: 'expand', label: 'Expand', description: 'Add more depth and clarity', mode: 'expand', tone: 'academic', icon: Maximize2 },
    { id: 'tone', label: 'Improve Tone', description: 'Make text formal or academic', mode: 'tone', tone: 'formal', icon: Mic },
    { id: 'paraphrase', label: 'Paraphrase', description: 'Rewrite using different words', mode: 'paraphrase', tone: 'neutral', icon: RefreshCw },
    { id: 'factcheck', label: 'Fact Check', description: 'Verify claims & highlight citations', mode: 'fix', tone: 'neutral', icon: Check },
]

interface FloatingToolbarProps {
    editor: Editor | null
    isMoreMenuOpen: boolean
    setIsMoreMenuOpen: (isOpen: boolean) => void
    requestRewrite: (action: AiAction) => void
    editorRef: React.RefObject<HTMLDivElement | null>
    isHidden?: boolean
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    editor,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
    requestRewrite,
    editorRef,
    isHidden
}) => {
    if (!editor) return null

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ state, from, to }) => {
                if (isHidden) return false
                const { selection } = state
                const { empty } = selection
                const text = state.doc.textBetween(from, to, ' ')
                if (empty || !text.trim()) {
                    return false
                }
                return true
            }}
            tippyOptions={{
                duration: 100,
                placement: 'top',
                animation: 'fade',
                interactive: true,
                appendTo: () => editorRef.current || document.body,
                offset: [0, 8],
                zIndex: 100
            }}
        >
            <div
                className="flex items-center gap-1 bg-white/90 backdrop-blur-lg shadow-lg border border-gray-200/50 rounded-full px-2 py-1 overflow-visible animate-in fade-in slide-in-from-bottom-2 relative"
                style={{
                    minHeight: '36px',
                    whiteSpace: 'nowrap'
                }}
            >
                <button
                    onClick={() => requestRewrite({
                        id: 'smart',
                        label: 'Smart Edit',
                        description: 'Auto-improve',
                        mode: 'smart',
                        icon: Sparkles
                    })}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#6B46FF]/10 hover:bg-[#6B46FF]/20 text-[#6B46FF] transition-colors group flex-shrink-0 border border-[#6B46FF]/20"
                    style={{ fontSize: '13px' }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-semibold whitespace-nowrap">Smart Edit</span>
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />

                {PRIMARY_ACTIONS.map(action => (
                    <button
                        key={action.id}
                        onClick={() => requestRewrite(action)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0"
                        style={{ fontSize: '13px' }}
                        aria-label={action.label}
                    >
                        <action.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                        <span className="font-medium text-gray-700 whitespace-nowrap">{action.label}</span>
                    </button>
                ))}

                <div className="relative">
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0",
                            isMoreMenuOpen && "bg-gray-100"
                        )}
                        style={{ fontSize: '13px' }}
                    >
                        <span className="font-medium text-gray-700 whitespace-nowrap">More</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>

                    {isMoreMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            <div className="px-3 py-1.5 border-b border-gray-50 mb-1">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Advanced Actions</span>
                            </div>
                            {SECONDARY_ACTIONS.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => {
                                        requestRewrite(action)
                                        setIsMoreMenuOpen(false)
                                    }}
                                    className="flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors w-full group"
                                >
                                    <div className="mt-0.5 p-1 rounded-md bg-gray-50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <action.icon className="w-4 h-4 text-gray-500 group-hover:text-[#6B46FF] transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                                        <span className="text-[11px] text-gray-400 group-hover:text-gray-500 leading-tight">{action.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BubbleMenu>
    )
}
