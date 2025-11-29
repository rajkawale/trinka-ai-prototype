import React, { useState, useEffect, useRef } from 'react'
import { Loader2, ChevronDown, Check, MessageSquarePlus } from 'lucide-react'
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

                            <div className="flex-1" />

                            {/* Custom Prompt Input */}
                            <div className="relative w-48">
                                <input
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    onKeyDown={handleCustomSubmit}
                                    placeholder="Ask AI to..."
                                    className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F4FF0]/20 focus:border-[#6F4FF0] transition-all"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">↵</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 bg-white min-h-[120px]">
                            {status === 'loading' ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#6F4FF0]" />
                                    <span className="text-sm">Generating suggestion...</span>
                                </div>
                            ) : status === 'error' ? (
                                <div className="text-center py-8 text-red-500 text-sm">
                                    Failed to generate suggestion. Please try again.
                                </div>
                            ) : suggestion ? (
                                <div className="space-y-4">
                                    <DiffView
                                        originalText={originalText}
                                        newText={suggestion}
                                        onReplace={onAccept}
                                    />

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onSendToCopilot?.(`Why did you suggest this change: "${suggestion}"?`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                                Ask Copilot
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={onClose}
                                                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={() => onAccept(suggestion)}
                                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-[#6F4FF0] text-white hover:bg-[#5B3FD9] rounded-lg shadow-sm shadow-[#6F4FF0]/20 transition-all"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Accept Change
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </Portal>
    )
}

export default SuggestionPopup
