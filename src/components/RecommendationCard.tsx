import { useState } from 'react'
import { cn } from '../lib/utils'
import RecommendationDetailPopover from './RecommendationDetailPopover'

export type ActionType = 'rewrite' | 'paraphrase' | 'summarize' | 'tighten' | 'cite' | 'expand'
export type EstimatedImpact = 'low' | 'medium' | 'high'

export interface Recommendation {
    id: string
    title: string
    summary: string
    fullText: string
    actionType: ActionType
    estimatedImpact: EstimatedImpact
    previewPatch?: any
}

interface RecommendationCardProps {
    recommendation: Recommendation
    docId: string
    onApply?: (recommendationId: string) => void
    onDismiss?: (recommendationId: string) => void
}

const RecommendationCard = ({ recommendation, docId, onApply, onDismiss }: RecommendationCardProps) => {
    const [showPopover, setShowPopover] = useState(false)
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setPopoverAnchor(e.currentTarget)
        setShowPopover(true)
    }

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all group border border-gray-100 hover:border-[#6B46FF]/20 hover:shadow-sm min-h-[56px]",
                    "focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/20"
                )}
                aria-label={`${recommendation.title}. Open details`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-[14px] font-semibold text-gray-800">{recommendation.title}</p>
                        <p className="text-[12px] text-[#6b7280] mt-0.5">{recommendation.summary}</p>
                    </div>
                </div>
            </button>
            {showPopover && popoverAnchor && (
                <RecommendationDetailPopover
                    recommendation={recommendation}
                    docId={docId}
                    anchorElement={popoverAnchor}
                    onClose={() => setShowPopover(false)}
                    onApply={onApply}
                    onDismiss={onDismiss}
                />
            )}
        </>
    )
}

export default RecommendationCard

