import { useState } from 'react'
import { X, Trash2, MoreHorizontal, ArrowRight } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'
import { trinkaApi, cn } from '../lib/utils'

interface RecommendationDetailPopoverProps {
    recommendation: Recommendation
    docId: string
    onClose: () => void
    onApply?: (recommendationId: string) => void
    onDismiss?: (recommendationId: string) => void
}

const RecommendationDetailPopover = ({
    recommendation,
    docId,
    onClose,
    onApply,
    onDismiss
}: RecommendationDetailPopoverProps) => {
    const [isApplying, setIsApplying] = useState(false)

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

    const handleDismiss = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.dismiss', {
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
            console.error('Dismiss failed:', error)
        }
    }

    const actionColor = recommendation.actionType === 'rewrite' || recommendation.actionType === 'tighten'
        ? 'text-purple-600 bg-purple-50'
        : 'text-blue-600 bg-blue-50'

    return (
        <div
            className="w-[340px] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/60 ring-1 ring-black/5 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200"
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
                    onClick={onClose}
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
                    {recommendation.summary}
                </div>

                <div className="mt-2 text-[12px] text-gray-500">
                    {recommendation.fullText}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 pb-4 pt-1">
                <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="flex-1 bg-[#6B46FF] hover:bg-[#5a37e6] text-white text-[13px] font-medium py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isApplying ? 'Applying...' : 'Accept'}
                </button>

                <button
                    onClick={handleDismiss}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Dismiss"
                >
                    <Trash2 size={16} />
                </button>

                <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More options"
                >
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>
    )
}

export default RecommendationDetailPopover

