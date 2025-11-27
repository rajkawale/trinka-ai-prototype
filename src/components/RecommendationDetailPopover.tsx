import { useState, useEffect } from 'react'
import { X, Trash2, MoreHorizontal, ArrowRight, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'
import { trinkaApi, cn } from '../lib/utils'
import { diffWords } from '../lib/diffUtils'

interface RecommendationDetailPopoverProps {
    recommendation: Recommendation
    docId: string
    onClose: () => void
    onApply?: (recommendationId: string) => void
    onDismiss?: (recommendationId: string) => void
    onShowToast?: (message: string) => void
}

type SuggestionVersion = {
    id: string
    text: string
    timestamp: Date
}

const RecommendationDetailPopover = ({
    recommendation,
    docId,
    onClose,
    onApply,
    onDismiss,
    onShowToast
}: RecommendationDetailPopoverProps) => {
    const [isApplying, setIsApplying] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)

    // Version history state
    const [suggestionHistory, setSuggestionHistory] = useState<SuggestionVersion[]>([
        {
            id: 'v1',
            text: recommendation.replacementText || recommendation.summary,
            timestamp: new Date()
        }
    ])
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0)

    const currentSuggestion = suggestionHistory[currentVersionIndex]

    const handleApply = async () => {
        setIsApplying(true)
        try {
            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.apply', {
                    docId,
                    recommendationId: recommendation.id,
                    estimatedImpact: recommendation.estimatedImpact
                })
            }

            const response = await fetch(trinkaApi('/api/recommendations/apply'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user',
                    docId,
                    recommendationId: recommendation.id
                })
            })

            if (response.ok) {
                await response.json()
                if (onApply) {
                    onApply(recommendation.id)
                }
                onClose()
            }
        } catch (error) {
            console.error('Apply failed:', error)
        } finally {
            setIsApplying(false)
        }
    }

    const handleIgnore = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.ignore', {
                    docId,
                    recommendationId: recommendation.id
                })
            }

            const response = await fetch(trinkaApi('/api/recommendations/dismiss'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user',
                    docId,
                    recommendationId: recommendation.id
                })
            })

            if (response.ok && onDismiss) {
                onDismiss(recommendation.id)
            }
            onClose()
        } catch (error) {
            console.error('Ignore failed:', error)
        }
    }

    const handleAddToDictionary = () => {
        const word = recommendation.originalText
        if (!word) return

        const dictionary = JSON.parse(localStorage.getItem('trinka-dictionary') || '[]')
        if (!dictionary.includes(word)) {
            dictionary.push(word)
            localStorage.setItem('trinka-dictionary', JSON.stringify(dictionary))
            if (onShowToast) onShowToast(`Added "${word}" to dictionary`)
        } else {
            if (onShowToast) onShowToast(`"${word}" is already in dictionary`)
        }
        setShowMenu(false)
        onClose()
    }

    const handleExplain = () => {
        if (currentVersionIndex > 0) {
            setCurrentVersionIndex(currentVersionIndex - 1)
        }
    }

    const handleNextVersion = () => {
        if (currentVersionIndex < suggestionHistory.length - 1) {
            setCurrentVersionIndex(currentVersionIndex + 1)
        }
    }

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault()
                handleApply()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleApply])

    const actionColor = recommendation.actionType === 'rewrite' || recommendation.actionType === 'tighten'
        ? 'text-purple-600 bg-purple-50'
        : 'text-blue-600 bg-blue-50'

    return (
    return (
        <div
            className="w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200/60 ring-1 ring-black/5 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            role="dialog"
            aria-labelledby="rec-title"
            style={{ maxHeight: '220px' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", actionColor)}>
                        {recommendation.actionType}
                    </span>
                    {isRegenerating && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <RotateCw size={10} className="animate-spin" />
                            Generating...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="p-1 text-gray-400 hover:text-[#6C2BD9] hover:bg-purple-50 rounded transition-colors"
                        title="Regenerate"
                    >
                        <RotateCw size={12} className={cn(isRegenerating && "animate-spin")} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded transition-colors"
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 flex-1 overflow-y-auto">
                <div className="text-[14px] text-gray-900 leading-relaxed font-medium">
                    {currentSuggestion.text || recommendation.summary}
                </div>

                {/* History Thumbnails */}
                {suggestionHistory.length > 1 && (
                    <div className="mt-2 flex items-center gap-1.5">
                        {suggestionHistory.map((version, idx) => (
                            <button
                                key={version.id}
                                onClick={() => setCurrentVersionIndex(idx)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    currentVersionIndex === idx ? "bg-[#6C2BD9] scale-125" : "bg-gray-300 hover:bg-gray-400"
                                )}
                                title={`Version ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50/30 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePreviousVersion}
                        disabled={currentVersionIndex === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[10px] text-gray-400 font-medium">
                        {currentVersionIndex + 1} / {suggestionHistory.length}
                    </span>
                    <button
                        onClick={handleNextVersion}
                        disabled={currentVersionIndex === suggestionHistory.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleIgnore}
                        className="px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isApplying}
                        className="px-3 py-1.5 bg-[#6C2BD9] hover:bg-[#5a37e6] text-white text-[12px] font-medium rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                    >
                        {isApplying ? 'Applying...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RecommendationDetailPopover

