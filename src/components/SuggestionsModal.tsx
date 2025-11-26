import { useState, useEffect, useRef } from 'react'
import { X, Eye, Check, XCircle } from 'lucide-react'
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
                <div className="p-6 border-b border-gray-200">
                    <h2 id="suggestions-modal-title" className="text-lg font-semibold text-gray-800 mb-1">
                        Top Suggestions ({suggestions.length})
                    </h2>
                    <p className="text-sm text-gray-600">
                        Review, preview, or apply improvements to strengthen the document.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.id}
                            className={cn(
                                "p-3 rounded-lg border transition-colors",
                                selectedIndex === index
                                    ? "border-[#6B46FF] bg-[#6B46FF]/5"
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
                                    className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#6B46FF] hover:bg-[#6B46FF]/90 rounded transition-colors"
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
                        className="px-4 py-2 text-[13px] font-medium text-[#6B46FF] hover:bg-[#6B46FF]/10 rounded transition-colors"
                    >
                        Show less
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SuggestionsModal

