import React, { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Loader2, Sparkles, ArrowRight, ChevronDown, Check, X, MessageSquarePlus } from 'lucide-react'
import { Portal } from '../../components/Portal'
import { DiffView } from './DiffView'
import { cn } from '../../lib/utils'
import { mockAi } from '../../api/mockAi'

interface SuggestionPopupProps {
    isOpen: boolean
    onClose: () => void
    originalText: string
    onAccept: (newText: string) => void
    selectionRect?: DOMRect | null
    initialTab?: string
    onSendToCopilot?: (query: string) => void
}

const PRIMARY_TABS = [
    { id: 'improve', label: 'Improve' },
    { id: 'rephrase', label: 'Rephrase' },
    { id: 'shorten', label: 'Shorten' },
]

const MORE_OPTIONS = [
    { id: 'expand', label: 'Expand' },
    { id: 'formal', label: 'Formal' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'academic', label: 'Academic' },
]

export const SuggestionPopup: React.FC<SuggestionPopupProps> = ({
    isOpen,
    onClose,
    originalText,
    onAccept,
    selectionRect,
    initialTab = 'improve',
    onSendToCopilot
}) => {
    const [activeTab, setActiveTab] = useState(initialTab)
    const [customPrompt, setCustomPrompt] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const [isMoreOpen, setIsMoreOpen] = useState(false)
    const popupRef = useRef<HTMLDivElement>(null)

    // Reset tab when reopening
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab)
            setCustomPrompt('')
            setIsMoreOpen(false)
        }
    }, [isOpen, initialTab])

    // Calculate position based on selection
    useEffect(() => {
        if (selectionRect && isOpen) {
            // Position 12px below selection, centered
            let top = selectionRect.bottom + 12
            let left = selectionRect.left + (selectionRect.width / 2)

            // Adjust if too close to right edge
            const popupWidth = 600 // Approx width
            if (left + (popupWidth / 2) > window.innerWidth - 20) {
                left = window.innerWidth - 20 - (popupWidth / 2)
            }
            if (left - (popupWidth / 2) < 20) {
                left = 20 + (popupWidth / 2)
            }

            // Auto-scroll if popup would be clipped at bottom
            const popupHeight = 400 // Approx max height
            if (top + popupHeight > window.innerHeight) {
                window.scrollBy({ top: 100, behavior: 'smooth' })
            }

            setPosition({ top, left })
        }
    }, [selectionRect, isOpen])

    // Trigger generation when tab changes
    useEffect(() => {
        if (isOpen && originalText && !customPrompt) {
            generateSuggestion()
        }
    }, [isOpen, activeTab, originalText])

    const generateSuggestion = async (overridePrompt?: string) => {
        setStatus('loading')
        setSuggestion(null)
        try {
            let result = ''

            if (overridePrompt) {
                result = await mockAi.generate(overridePrompt)
            } else {
                switch (activeTab) {
                    case 'improve':
                        const corrections = await mockAi.correct(originalText)
                        result = corrections.length > 0 ? corrections[0].suggestion : originalText
                        break
                    case 'rephrase':
                        result = await mockAi.rewrite(originalText)
                        break
                    case 'shorten':
                        result = await mockAi.shorten(originalText)
                        break
                    case 'expand':
                        result = await mockAi.expand(originalText)
                        break
                    case 'formal':
                    case 'friendly':
                    case 'academic':
                        result = await mockAi.tone(originalText, activeTab as any)
                        break
                    default:
                        result = await mockAi.correct(originalText).then(r => r[0]?.suggestion || originalText)
                }
            }
            setSuggestion(result)
            setStatus('success')
        } catch (error) {
            console.error('Generation failed', error)
            setStatus('error')
        }
    }

    const handleCustomSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && customPrompt.trim()) {
            setActiveTab('custom')
            generateSuggestion(customPrompt)
        }
    }

    return (
        <Portal>
            {isOpen && (
                <div className="fixed inset-0 z-[9998] pointer-events-none">
                    <div
                        className="absolute inset-0 bg-transparent pointer-events-auto"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <div
                        ref={popupRef}
                        className="absolute z-[9999] w-[600px] bg-white rounded-xl shadow-xl border border-gray-200/60 ring-1 ring-black/5 overflow-hidden font-sans pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150"
                        style={{
                            top: position.top,
                            left: position.left,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        {/* Header / Tabs */}
                        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-1">
                                {PRIMARY_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id)
                                            setCustomPrompt('')
                                            setIsMoreOpen(false)
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap",
                                            activeTab === tab.id
                                                ? "bg-[#6F4FF0]/10 text-[#6F4FF0]"
                                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}

                                <div className="relative">
                                    <button
                                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                                        className={cn(
                                            "px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1",
                                            isMoreOpen || !PRIMARY_TABS.find(t => t.id === activeTab) && activeTab !== 'custom'
                                                ? "bg-[#6F4FF0]/10 text-[#6F4FF0]"
                                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                        )}
                                    >
                                        More <ChevronDown className="w-3 h-3" />
                                    </button>

                                    {isMoreOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                                            {MORE_OPTIONS.map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        setActiveTab(option.id)
                                                        setCustomPrompt('')
                                                        setIsMoreOpen(false)
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors",
                                                        activeTab === option.id ? "text-[#6F4FF0] font-medium" : "text-gray-700"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-px h-5 bg-gray-200 mx-2" />

                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter your own..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    onKeyDown={handleCustomSubmit}
                                    className="flex-1 bg-transparent border-none text-[13px] text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none"
                                />
                                {customPrompt && (
                                    <button
                                        onClick={() => onSendToCopilot?.(customPrompt)}
                                        className="text-[11px] text-[#6F4FF0] hover:text-[#5B3FD9] font-medium flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-md hover:bg-[#6F4FF0]/5 transition-colors"
                                    >
                                        Send to Copilot <MessageSquarePlus className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 min-h-[120px]">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[11px] font-bold text-[#6F4FF0] uppercase tracking-wider bg-[#6F4FF0]/10 px-2 py-0.5 rounded-full">
                                    AI Suggestion — {customPrompt ? 'Custom' : activeTab}
                                </span>
                            </div>

                            <div className="relative">
                                {status === 'loading' ? (
                                    <div className="space-y-2 animate-pulse">
                                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                                        <div className="h-4 bg-gray-100 rounded w-full" />
                                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                                        <div className="flex items-center gap-2 mt-4 text-gray-400 text-xs">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Generating suggestion...
                                        </div>
                                    </div>
                                ) : status === 'error' ? (
                                    <div className="text-amber-600 text-sm flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <Sparkles className="w-4 h-4" />
                                        Something went wrong. <button onClick={() => generateSuggestion(customPrompt)} className="underline font-medium">Retry?</button>
                                    </div>
                                ) : (
                                    <div className="text-[15px] leading-relaxed text-gray-800">
                                        <DiffView
                                            originalText={originalText}
                                            newText={suggestion || originalText}
                                            onReplace={(text) => {
                                                onAccept(text)
                                                // Single undo logic handled by Editor
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (suggestion) onAccept(suggestion)
                                    }}
                                    disabled={status !== 'success'}
                                    className="px-4 py-1.5 bg-[#6F4FF0] hover:bg-[#5B3FD9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm shadow-[#6F4FF0]/20 flex items-center gap-2"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Accept
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-[13px] font-medium transition-colors hover:bg-gray-100 rounded-lg"
                                >
                                    Dismiss
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                                    Feedback
                                </button>
                                <div className="w-px h-3 bg-gray-200" />
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#6F4FF0] to-[#35C28B] flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                                        T
                                    </div>
                                    <span className="text-[11px] font-medium text-gray-400">Trinka AI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Portal>
    )
}
