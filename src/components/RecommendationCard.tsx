import { usePopover } from './PopoverManager'
import { cn } from '../lib/utils'
import RecommendationDetailPopover from './RecommendationDetailPopover'

export type ActionType = 'rewrite' | 'paraphrase' | 'summarize' | 'tighten' | 'cite' | 'expand' | 'tone' | 'clarify' | 'smart'
export type EstimatedImpact = 'low' | 'medium' | 'high'

export interface Recommendation {
    id: string
    title: string
    summary: string
    fullText: string
    originalText?: string
    replacementText?: string
    actionType: ActionType
    estimatedImpact: EstimatedImpact
    previewPatch?: any
    range?: { from: number; to: number }
}

interface RecommendationCardProps {
    recommendation: Recommendation
    docId?: string
    onApply?: (recommendationId: string, text: string) => void
    onDismiss?: (recommendationId: string) => void
    onChat?: (text: string) => void
}

const RecommendationCard = ({ recommendation, docId, onApply, onDismiss, onChat }: RecommendationCardProps) => {
    const { openPopover, closePopover } = usePopover()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onChat) {
            onChat(recommendation.title)
            return
        }

        openPopover(e.currentTarget, (
            <RecommendationDetailPopover
                recommendation={recommendation}
                docId={docId}
                onClose={closePopover}
                onApply={onApply}
                onDismiss={onDismiss}
            />
        ), {
            placement: 'bottom',
            offset: 5
        })
    }

    return (
        <div className={cn(
            "w-full flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all group border border-gray-100 hover:border-[#6C2BD9]/20 hover:shadow-sm min-h-[56px]"
        )}>
            <button
                onClick={handleClick}
                className="flex-1 text-left focus:outline-none"
                aria-label={`${recommendation.title}. Open details`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-[14px] font-semibold text-gray-800">{recommendation.title}</p>
                        <p className="text-[12px] text-[#6b7280] mt-0.5">{recommendation.summary}</p>
                    </div>
                </div>
            </button>

            {onApply && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onApply(recommendation.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#6C2BD9] hover:bg-[#6C2BD9]/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Insert"
                    aria-label="Insert suggestion"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                </button>
            )}
        </div>
    )
}

export default RecommendationCard

