import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'
import RecommendationDetailPopover from './RecommendationDetailPopover'
import { cn } from '../lib/utils'

interface RecommendationListPopoverProps {
    recommendations: Recommendation[]
    docId: string
    onClose: () => void
    onApply?: (recommendationId: string) => void
    onDismiss?: (recommendationId: string) => void
    onShowToast?: (message: string) => void
}

const RecommendationListPopover = ({
    recommendations,
    docId,
    onClose,
    onApply,
    onDismiss,
    onShowToast
}: RecommendationListPopoverProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [showAll, setShowAll] = useState(false)

    const selectedRec = selectedId ? recommendations.find(r => r.id === selectedId) : null

    if (selectedRec) {
        return (
            <RecommendationDetailPopover
                recommendation={selectedRec}
                docId={docId}
                onClose={() => {
                    // If we have multiple suggestions, go back to list instead of closing entirely?
                    // Design doesn't specify, but usually "Back" is better.
                    // But onClose usually means "Close Popover".
                    // Let's add a "Back" button to Detail view?
                    // For now, onClose closes the whole thing.
                    onClose()
                }}
                onApply={onApply}
                onDismiss={onDismiss}
                onShowToast={onShowToast}
            />
        )
    }

    const displayedRecs = showAll ? recommendations : recommendations.slice(0, 3)

    return (
        <div
            className="w-[300px] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/60 ring-1 ring-black/5 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-label="Suggestions list"
        >
            <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-100/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Suggestions ({recommendations.length})
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <span className="sr-only">Close</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
                {displayedRecs.map((rec) => (
                    <button
                        key={rec.id}
                        onClick={() => setSelectedId(rec.id)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                                        rec.actionType === 'rewrite' || rec.actionType === 'tighten'
                                            ? 'text-purple-600 bg-purple-50'
                                            : 'text-blue-600 bg-blue-50'
                                    )}>
                                        {rec.actionType}
                                    </span>
                                </div>
                                <p className="text-[13px] font-medium text-gray-900 truncate">
                                    {rec.title}
                                </p>
                                <p className="text-[12px] text-gray-500 truncate mt-0.5">
                                    {rec.summary}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors mt-1" />
                        </div>
                    </button>
                ))}
            </div>

            {!showAll && recommendations.length > 3 && (
                <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-2 text-[12px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                >
                    See {recommendations.length - 3} more
                </button>
            )}
        </div>
    )
}

export default RecommendationListPopover
