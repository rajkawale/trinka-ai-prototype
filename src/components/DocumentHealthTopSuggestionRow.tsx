import { useRef } from 'react'
import { cn } from '../lib/utils'
import RecommendationDetailPopover from './RecommendationDetailPopover'
import type { Recommendation } from './RecommendationCard'
import { usePopover } from './PopoverManager'

interface DocumentHealthTopSuggestionRowProps {
    suggestion: Recommendation
    docId: string
    onApply?: (suggestionId: string) => void
    onDismiss?: (suggestionId: string) => void
}

const DocumentHealthTopSuggestionRow = ({
    suggestion,
    docId,
    onApply,
    onDismiss
}: DocumentHealthTopSuggestionRowProps) => {
    const rowRef = useRef<HTMLButtonElement>(null)
    const { openPopover, closePopover } = usePopover()

    const handleClick = () => {
        // Emit telemetry
        if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('topSuggestion.click', {
                docId,
                suggestionId: suggestion.id
            })
        }

        if (rowRef.current) {
            openPopover(rowRef.current, (
                <RecommendationDetailPopover
                    recommendation={suggestion}
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
    }

    return (
        <button
            ref={rowRef}
            onClick={handleClick}
            className={cn(
                "w-full text-left px-2 py-1 text-[12px] text-gray-700 hover:bg-gray-50 rounded transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-[#6C2BD9]/20 min-h-[44px] flex items-center"
            )}
            aria-label={`${suggestion.title}. Open details`}
        >
            <span className="flex-1">{suggestion.title}</span>
        </button>
    )
}

export default DocumentHealthTopSuggestionRow

