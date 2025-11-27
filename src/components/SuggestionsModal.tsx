import { useState, useEffect, useRef } from 'react'
import { X, Eye, Check, XCircle, Search, ArrowUpDown } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Recommendation } from './RecommendationCard'

interface SuggestionsModalProps {
    isOpen: boolean
    onClose: () => void
    suggestions: Recommendation[]
    docId: string
    onApply?: (recommendationId: string) => void
    onDismiss?: (recommendationId: string) => void
    onPreview?: (recommendation: Recommendation) => void
}

const SuggestionsModal = ({
    isOpen,
    onClose,
    suggestions,
    docId,
    onApply,
    onDismiss,
    onPreview
}: SuggestionsModalProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [activeTab, setActiveTab] = useState<'all' | 'grammar' | 'tone' | 'clarity'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'impact' | 'location'>('location')

    const filteredSuggestions = suggestions
        .filter(s => {
            if (activeTab === 'all') return true
            if (activeTab === 'grammar') return s.actionType === 'rewrite' || s.actionType === 'tighten'
            if (activeTab === 'tone') return s.actionType === 'tone'
            if (activeTab === 'clarity') return s.actionType === 'paraphrase' || s.actionType === 'expand' || s.actionType === 'summarize'
            return true
        })
        .filter(s => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
                s.title.toLowerCase().includes(query) ||
                s.summary.toLowerCase().includes(query) ||
                s.fullText.toLowerCase().includes(query)
            )
        })
        .sort((a, b) => {
            if (sortBy === 'impact') {
                const impactScore = { high: 3, medium: 2, low: 1 }
                return impactScore[b.estimatedImpact] - impactScore[a.estimatedImpact]
            }
            return 0
        })

    const modalRef = useRef<HTMLDivElement>(null)
    const firstButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (isOpen) {
            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('suggestions.modal.open', {
                    docId,
                    total: suggestions.length
                })
            }
            // Focus first button for accessibility
            setTimeout(() => {
                firstButtonRef.current?.focus()
            }, 100)
        }
    }, [isOpen, docId, suggestions.length])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const selected = suggestions[selectedIndex]
                if (selected && onPreview) {
                    onPreview(selected)
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, suggestions, onClose, onPreview])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestions-modal-title"
        >
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col border-b border-gray-200">
                    <div className="flex items-center justify-between p-6 pb-4">
                        <div>
                            <h2 id="suggestions-modal-title" className="text-lg font-semibold text-gray-800 mb-1">
                                Top Suggestions ({filteredSuggestions.length})
                            </h2>
                            <p className="text-sm text-gray-600">
                                Review, preview, or apply improvements to strengthen the document.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs and Actions */}
                    <div className="flex items-center justify-between px-6 pb-0">
                        <div className="flex items-center gap-6">
                            {(['all', 'grammar', 'tone', 'clarity'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "pb-3 text-sm font-medium border-b-2 transition-colors capitalize",
                                        activeTab === tab
                                            ? "border-[#6C2BD9] text-[#6C2BD9]"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                if (onApply) {
                                    filteredSuggestions.forEach((s, i) => {
                                        setTimeout(() => onApply(s.id), i * 200)
                                    })
                                }
                            }}
                            className="mb-3 px-3 py-1.5 bg-[#6C2BD9] text-white text-xs font-medium rounded-lg hover:bg-[#5b21b6] transition-colors flex items-center gap-1.5"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Accept All
                        </button>
                    </div>
                </div>

                {/* Search and Sort */}
                <div className="flex items-center gap-3 px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search suggestions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C2BD9]/20 focus:border-[#6C2BD9] transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setSortBy(prev => prev === 'impact' ? 'location' : 'impact')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        Sort: {sortBy === 'impact' ? 'Impact' : 'Location'}
                    </button>
                </div>



                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredSuggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.id}
                            className={cn(
                                "p-3 rounded-lg border transition-colors",
                                selectedIndex === index
                                    ? "border-[#6C2BD9] bg-[#6C2BD9]/5"
                                    : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="font-semibold text-[14px] text-gray-800 mb-1">
                                        {suggestion.title}
                                    </div>
                                    <div className="text-[12px] text-gray-600 mb-2">
                                        {suggestion.summary}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        Impact: {suggestion.estimatedImpact.charAt(0).toUpperCase() + suggestion.estimatedImpact.slice(1)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    ref={index === 0 ? firstButtonRef : undefined}
                                    onClick={() => {
                                        if (onPreview) {
                                            onPreview(suggestion)
                                        }
                                    }}
                                    className="px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                                    Preview
                                </button>
                                <button
                                    onClick={async () => {
                                        if (onApply) {
                                            await onApply(suggestion.id)
                                        }
                                    }}
                                    className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#6C2BD9] hover:bg-[#6C2BD9]/90 rounded transition-colors"
                                >
                                    <Check className="w-3.5 h-3.5 inline mr-1.5" />
                                    Apply
                                </button>
                                <button
                                    onClick={async () => {
                                        if (onDismiss) {
                                            await onDismiss(suggestion.id)
                                        }
                                    }}
                                    className="px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <XCircle className="w-3.5 h-3.5 inline mr-1.5" />
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[13px] font-medium text-[#6C2BD9] hover:bg-[#6C2BD9]/10 rounded transition-colors"
                    >
                        Show less
                    </button>
                </div>
            </div >
        </div >
    )
}

export default SuggestionsModal

