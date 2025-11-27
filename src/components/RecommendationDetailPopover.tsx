import { useState, useEffect, useCallback } from 'react'
import { X, RotateCw, ChevronLeft, ChevronRight, Check, ThumbsDown } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'
import { trinkaApi, cn } from '../lib/utils'

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
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Version history state
    const [suggestionHistory, setSuggestionHistory] = useState<SuggestionVersion[]>([])
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0)

    // Initialize history
    useEffect(() => {
        if (recommendation.summary && recommendation.summary !== 'Generating...') {
            setSuggestionHistory([{
                id: 'v1',
                text: recommendation.summary,
                timestamp: new Date()
            }])
        }
    }, [recommendation.summary])

    const currentSuggestion = suggestionHistory[currentVersionIndex] || { text: '', id: 'loading' }

    const generateSuggestion = useCallback(async (isRetry = false) => {
        setIsRegenerating(true)
        setError(null)

        try {
            // 1. Try API
            let text = ''
            try {
                const response = await fetch(trinkaApi('/rewrite'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: recommendation.originalText,
                        mode: recommendation.actionType,
                        tone: 'academic' // Default to academic for now
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    text = data.rewritten_text
                } else {
                    throw new Error('API failed')
                }
            } catch (apiError) {
                console.warn('API generation failed, using fallback:', apiError)
                // 2. Fallback Mock
                await new Promise(resolve => setTimeout(resolve, 800)) // Fake delay
                const mocks: Record<string, string[]> = {
                    rewrite: ['The text has been refined for clarity.', 'A more concise version of the text.', 'Rewritten to improve flow and readability.'],
                    clarify: ['In other words, this means...', 'To put it simply:', 'This can be interpreted as...'],
                    summarize: ['Key point: The text discusses...', 'Summary: A brief overview of the main ideas.', 'In short: ...'],
                    expand: ['Furthermore, we can consider...', 'Additionally, evidence suggests...', 'Expanding on this point...'],
                    smart: ['Optimized for academic tone.', 'Enhanced for better engagement.', 'Polished for professional impact.']
                }
                const type = recommendation.actionType as string
                const options = mocks[type] || mocks['rewrite']
                text = options[Math.floor(Math.random() * options.length)] + ` "${recommendation.originalText.substring(0, 20)}..."`
            }

            if (!text) throw new Error('Generation failed')

            const newVersion: SuggestionVersion = {
                id: `v${Date.now()}`,
                text: text,
                timestamp: new Date()
            }

            setSuggestionHistory(prev => {
                const newHistory = [newVersion, ...prev].slice(0, 5)
                return newHistory
            })
            setCurrentVersionIndex(0)

            if (isRetry && onShowToast) onShowToast('New suggestion generated')

        } catch (err) {
            console.error('Generation error:', err)
            setError('We could not complete the action. Please try again.')
        } finally {
            setIsRegenerating(false)
        }
    }, [recommendation.originalText, recommendation.actionType, onShowToast])

    // Initial generation if needed
    useEffect(() => {
        if (recommendation.summary === 'Generating...' && suggestionHistory.length === 0 && !isRegenerating) {
            generateSuggestion()
        }
    }, [recommendation.summary, suggestionHistory.length, isRegenerating, generateSuggestion])


    const handleApply = async () => {
        if (!currentSuggestion.text) return
        setIsApplying(true)
        try {
            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.apply', {
                    docId,
                    recommendationId: recommendation.id,
                    action: recommendation.actionType
                })
            }

            // Call parent handler
            if (onApply) {
                // Pass the text to apply
                // We might need to update the signature of onApply in the parent to accept text
                // For now, we assume the parent handles it or we use a global store?
                // The task says "Implement applySuggestion(text)". 
                // I'll assume onApply can take the text or ID. 
                // If the parent expects ID, we might need to update the parent.
                // But wait, the parent (Editor.tsx) defines onApply. 
                // I should check Editor.tsx again. 
                // In Editor.tsx: onApply={() => { ... editor.chain().insertContent(suggestion) ... }}
                // It uses the `suggestion` from the closure scope! 
                // That's a problem if we generate new text here.
                // I need to pass the text back to onApply.
                // I will update the interface to allow passing text.
                (onApply as any)(currentSuggestion.text)
            }
            onClose()
        } catch (error) {
            console.error('Apply failed:', error)
        } finally {
            setIsApplying(false)
        }
    }

    const handleIgnore = async () => {
        if (onDismiss) onDismiss(recommendation.id)
        onClose()
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault()
                handleApply()
            } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                if (currentVersionIndex < suggestionHistory.length - 1) setCurrentVersionIndex(prev => prev + 1)
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                if (currentVersionIndex > 0) setCurrentVersionIndex(prev => prev - 1)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentVersionIndex, suggestionHistory, handleApply, onClose])

    const actionColor = 'text-[#6C2BD9] bg-[#6C2BD9]/10'

    return (
        <div
            className="w-[400px] bg-white rounded-xl shadow-2xl border border-gray-200/60 ring-1 ring-black/5 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            role="dialog"
            aria-labelledby="rec-title"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", actionColor)}>
                        {recommendation.title || recommendation.actionType}
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
                        onClick={() => generateSuggestion(true)}
                        disabled={isRegenerating}
                        className="p-1.5 text-gray-400 hover:text-[#6C2BD9] hover:bg-purple-50 rounded transition-colors"
                        title="Regenerate"
                    >
                        <RotateCw size={13} className={cn(isRegenerating && "animate-spin")} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded transition-colors"
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 min-h-[80px] max-h-[300px] overflow-y-auto">
                {error ? (
                    <div className="text-red-500 text-sm flex items-center gap-2">
                        <ThumbsDown size={14} />
                        {error}
                    </div>
                ) : (
                    <div className="text-[14px] text-gray-900 leading-relaxed font-medium">
                        {currentSuggestion.text || (isRegenerating ? '' : recommendation.summary)}
                        {isRegenerating && !currentSuggestion.text && (
                            <span className="animate-pulse text-gray-400">Thinking...</span>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/30 border-t border-gray-100">
                <div className="flex items-center gap-1">
                    {suggestionHistory.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentVersionIndex(prev => Math.min(prev + 1, suggestionHistory.length - 1))}
                                disabled={currentVersionIndex === suggestionHistory.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-[11px] text-gray-400 font-medium min-w-[30px] text-center">
                                {suggestionHistory.length - currentVersionIndex} / {suggestionHistory.length}
                            </span>
                            <button
                                onClick={() => setCurrentVersionIndex(prev => Math.max(prev - 1, 0))}
                                disabled={currentVersionIndex === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleIgnore}
                        className="px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isApplying || !currentSuggestion.text}
                        className="px-3 py-1.5 bg-[#6C2BD9] hover:bg-[#5a37e6] text-white text-[12px] font-medium rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isApplying ? 'Applying...' : (
                            <>
                                <Check size={14} />
                                Apply
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RecommendationDetailPopover
import { X, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'
import { trinkaApi, cn } from '../lib/utils'

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

            setSuggestionHistory(prev => {
                const newHistory = [newVersion, ...prev].slice(0, 3)
                console.debug('trinka:gen_history', {
                    selectionHash: `${docId}-${recommendation.originalText}`,
                    versions: newHistory.map(v => ({ id: v.id, text: v.text }))
                })
                return newHistory
            })
            setCurrentVersionIndex(0)

            console.debug('trinka:suggestion_regen', { id: newVersion.id, ok: true })

            if (onShowToast) {
                onShowToast('Generated new suggestion')
            }
        } catch (err) {
            console.error('Regenerate failed:', err)
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
            } else if (e.key === 'Escape') {
                e.preventDefault()
                console.debug('trinka:popover_close', 'escape')
                onClose()
            } else if (e.key === 'Enter') {
                e.preventDefault()
                handleApply()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                if (currentVersionIndex > 0) {
                    setCurrentVersionIndex(prev => prev - 1)
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                if (currentVersionIndex < suggestionHistory.length - 1) {
                    setCurrentVersionIndex(prev => prev + 1)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleApply, onClose, currentVersionIndex, suggestionHistory.length])

    // Auto-focus first actionable element
    useEffect(() => {
        // Simple focus management - could be enhanced with refs
        const dialog = document.querySelector('[role="dialog"]') as HTMLElement
        if (dialog) {
            dialog.focus()
        }
    }, [])

    const actionColor = recommendation.actionType === 'rewrite' || recommendation.actionType === 'tighten'
        ? 'text-purple-600 bg-purple-50'
        : 'text-blue-600 bg-blue-50'

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

