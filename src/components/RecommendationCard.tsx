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
                docId={docId || 'unknown'}
                onClose={closePopover}
                onApply={onApply}
                onDismiss={onDismiss}
            />
        ), {
            placement: 'bottom',
            offset: 5
        })
    }

    // Determine badge type from action type
    const getBadgeType = (actionType: ActionType): 'grammar' | 'clarity' | 'tone' | 'style' => {
        if (actionType === 'rewrite' || actionType === 'clarify') return 'clarity'
        if (actionType === 'tone') return 'tone'
        return 'grammar'
    }

    const badgeType = getBadgeType(recommendation.actionType)
    const badgeConfig = {
        grammar: { label: 'Grammar', color: 'bg-red-100 text-red-700' },
        clarity: { label: 'Clarity', color: 'bg-blue-100 text-blue-700' },
        tone: { label: 'Tone', color: 'bg-amber-100 text-amber-700' },
        style: { label: 'Style', color: 'bg-purple-100 text-purple-700' }
    }
    const badge = badgeConfig[badgeType]

    return (
        <div className={cn(
            "w-full flex items-center gap-2 p-3 rounded-md hover:bg-gray-50 transition-all group border border-gray-100 hover:border-[#6C2BD9]/20 hover:shadow-md shadow-sm"
        )}>
            <button
                onClick={handleClick}
                className="flex-1 text-left focus:outline-none"
                aria-label={`${recommendation.title}. Open details`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", badge.color)}>
                                {badge.label}
                            </span>
                            <p className="text-[14px] font-semibold text-gray-800">{recommendation.title}</p>
                        </div>
                        <p className="text-[12px] font-normal text-gray-600 opacity-80 mt-0.5">{recommendation.summary}</p>
                    </div>
                </div>
            </button>

            {onApply && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onApply(recommendation.id, recommendation.replacementText || recommendation.fullText)
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

