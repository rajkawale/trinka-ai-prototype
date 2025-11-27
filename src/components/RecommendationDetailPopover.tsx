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
        if (onShowToast) {
            onShowToast(`Explanation: ${recommendation.title} - ${recommendation.summary}`)
        }
        setShowMenu(false)
    }

    const handleRegenerate = async () => {
        setIsRegenerating(true)

        try {
            // Mock regeneration with variations
            const variations = [
                'enhanced phrasing',
                'improved clarity',
                'refined expression',
                'polished version',
                'optimized wording'
            ]

            const baseText = recommendation.originalText || ''
            const randomVariation = variations[Math.floor(Math.random() * variations.length)]
            const newSuggestion = `${baseText} (${randomVariation})`

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500))

            const newVersion: SuggestionVersion = {
                id: `v${suggestionHistory.length + 1}`,
                text: newSuggestion,
                timestamp: new Date()
            }

            setSuggestionHistory(prev => [...prev, newVersion])
            setCurrentVersionIndex(suggestionHistory.length)

            if (onShowToast) {
                onShowToast('Generated new suggestion')
            }
        } catch (error) {
            console.error('Regenerate failed:', error)
            if (onShowToast) {
                onShowToast('Failed to regenerate')
            }
        } finally {
            setIsRegenerating(false)
        }
    }

    const handlePreviousVersion = () => {
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
        <div
            className="w-[340px] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/60 ring-1 ring-black/5 overflow-visible font-sans animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-labelledby="rec-title"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", actionColor)}>
                        {recommendation.actionType}
                    </span>
                    {recommendation.estimatedImpact === 'high' && (
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            High Impact
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200/50 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {recommendation.originalText && (
                    <div className="mb-3 flex items-center gap-2 text-[13px] text-gray-400">
                        <span className="line-through decoration-gray-300 decoration-1">{recommendation.originalText}</span>
                        <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                    </div>
                )}

                <div className="text-[15px] font-medium text-gray-900 leading-relaxed">
                    {recommendation.originalText && currentSuggestion.text ? (
                        <div>
                            {diffWords(recommendation.originalText, currentSuggestion.text).map((part, i) => (
                                <span key={i} className={cn(
                                    part.removed && "line-through text-red-400 bg-red-50 mx-0.5 px-0.5 rounded decoration-2",
                                    part.added && "text-green-600 bg-green-50 font-semibold mx-0.5 px-0.5 rounded",
                                    !part.added && !part.removed && "text-gray-900"
                                )}>
                                    {part.value}
                                </span>
                            ))}
                        </div>
                    ) : (
                        currentSuggestion.text || recommendation.summary
                    )}
                </div>

                {/* Version Navigation */}
                {suggestionHistory.length > 1 && (
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePreviousVersion}
                                disabled={currentVersionIndex === 0}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Previous version"
                            >
                                <ChevronLeft size={12} />
                            </button>
                            <span className="px-2">
                                Version {currentVersionIndex + 1} of {suggestionHistory.length}
                            </span>
                            <button
                                onClick={handleNextVersion}
                                disabled={currentVersionIndex === suggestionHistory.length - 1}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Next version"
                            >
                                <ChevronRight size={12} />
                            </button>
                        </div>
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center gap-1 px-2 py-1 hover:bg-purple-50 text-[#6C2BD9] rounded transition-colors disabled:opacity-50"
                            title="Generate new suggestion"
                        >
                            <RotateCw size={12} className={cn(isRegenerating && "animate-spin")} />
                            {isRegenerating ? 'Generating...' : 'Regenerate'}
                        </button>
                    </div>
                )}

                {/* Show Regenerate button even when only one version */}
                {suggestionHistory.length === 1 && (
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] hover:bg-purple-50 text-[#6C2BD9] rounded-lg transition-colors disabled:opacity-50 font-medium"
                            title="Generate alternative suggestion"
                        >
                            <RotateCw size={14} className={cn(isRegenerating && "animate-spin")} />
                            {isRegenerating ? 'Generating...' : 'Regenerate'}
                        </button>
                    </div>
                )}

                <div className="mt-2 text-[12px] text-gray-500">
                    {recommendation.fullText}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 pb-4 pt-1 relative">
                <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="flex-1 bg-[#6C2BD9] hover:bg-[#5a37e6] text-white text-[13px] font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isApplying ? 'Applying...' : 'Accept'}
                </button>

                <button
                    onClick={handleIgnore}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Dismiss"
                >
                    <Trash2 size={16} />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={cn(
                            "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                            showMenu && "bg-gray-100 text-gray-600"
                        )}
                        title="More options"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={handleIgnore}
                                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Trash2 size={14} className="text-gray-400" />
                                Dismiss
                            </button>
                            <button
                                onClick={handleAddToDictionary}
                                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                {/* Book icon */}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                Add to dictionary
                            </button>
                            <button
                                onClick={handleExplain}
                                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                {/* Info icon */}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                Explain
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RecommendationDetailPopover

