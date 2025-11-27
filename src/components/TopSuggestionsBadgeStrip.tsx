import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'
import type { Recommendation } from './RecommendationCard'
import RecommendationDetailPopover from './RecommendationDetailPopover'

interface TopSuggestionsBadgeStripProps {
    suggestions: Recommendation[]
    docId: string
    onApply?: (suggestionId: string) => void
    onDismiss?: (suggestionId: string) => void
    onView?: (count: number) => void
}

const TopSuggestionsBadgeStrip = ({
    suggestions,
    docId,
    onApply,
    onDismiss,
    onView
}: TopSuggestionsBadgeStripProps) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
    const [showTooltip, setShowTooltip] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
    const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null)
    const badgeRefs = useRef<(HTMLButtonElement | null)[]>([])

    const maxVisible = 9
    const visibleSuggestions = suggestions.slice(0, maxVisible - 1)
    const overflowCount = suggestions.length > maxVisible - 1 ? suggestions.length - (maxVisible - 1) : 0

    useEffect(() => {
        if (onView) {
            onView(suggestions.length)
        }
    }, [suggestions.length, onView])

    const handleMouseEnter = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
        const timeout = setTimeout(() => {
            const rect = event.currentTarget.getBoundingClientRect()
            setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 8
            })
            setHoveredIndex(index)
            setShowTooltip(true)

            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('suggestions.hover', {
                    docId,
                    suggestionId: suggestions[index].id
                })
            }
        }, 200)
        setHoverTimeout(timeout)
    }

    const handleMouseLeave = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout)
            setHoverTimeout(null)
        }
        setShowTooltip(false)
        setHoveredIndex(null)
    }

    const handleBadgeClick = (index: number) => {
        setOpenPopoverIndex(index)
        setShowTooltip(false)

        // Emit telemetry
        if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('suggestions.open', {
                docId,
                suggestionId: suggestions[index].id
            })
        }
    }

    const handleTooltipPreview = (index: number) => {
        setShowTooltip(false)
        setOpenPopoverIndex(index)
    }

    const handleTooltipApply = async (index: number) => {
        const suggestion = suggestions[index]
        if (onApply) {
            onApply(suggestion.id)
        }
        setShowTooltip(false)
    }

    const currentTooltip = hoveredIndex !== null ? suggestions[hoveredIndex] : null

    return (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 flex-wrap">
                {visibleSuggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className="relative">
                        <button
                            ref={(el) => { badgeRefs.current[index] = el }}
                            onClick={() => handleBadgeClick(index)}
                            onMouseEnter={(e) => handleMouseEnter(index, e)}
                            onMouseLeave={handleMouseLeave}
                            onFocus={() => {
                                // Trigger hover on focus for accessibility
                                const fakeEvent = { currentTarget: badgeRefs.current[index] } as React.MouseEvent<HTMLButtonElement>
                                if (badgeRefs.current[index]) {
                                    handleMouseEnter(index, fakeEvent)
                                }
                            }}
                            onBlur={handleMouseLeave}
                            className={cn(
                                "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[13px] font-medium text-gray-700 transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-[#6C2BD9]/20"
                            )}
                            aria-label={`Suggestion ${index + 1}. ${suggestion.summary}`}
                        >
                            {index + 1}
                        </button>
                        {openPopoverIndex === index && badgeRefs.current[index] && (
                            <RecommendationDetailPopover
                                recommendation={suggestion}
                                docId={docId}
                                anchorElement={badgeRefs.current[index]!}
                                onClose={() => setOpenPopoverIndex(null)}
                                onApply={onApply}
                                onDismiss={onDismiss}
                            />
                        )}
                    </div>
                ))}
                {overflowCount > 0 && (
                    <OverflowBadge
                        count={overflowCount}
                        allSuggestions={suggestions}
                        docId={docId}
                        onApply={onApply}
                        onDismiss={onDismiss}
                    />
                )}
            </div>

            {/* Hover Tooltip */}
            {showTooltip && currentTooltip && tooltipPosition && (
                <div
                    className="fixed z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-in fade-in slide-in-from-bottom-2"
                    style={{
                        left: `${tooltipPosition.x - 160}px`,
                        bottom: `${window.innerHeight - tooltipPosition.y + 8}px`
                    }}
                    role="tooltip"
                >
                    <div className="font-semibold text-[13px] text-gray-800 mb-1">
                        {hoveredIndex! + 1}. {currentTooltip.title}
                    </div>
                    <div className="text-[12px] text-gray-600 mb-3 line-clamp-2">
                        {currentTooltip.summary.length > 80 
                            ? currentTooltip.summary.substring(0, 80) + '...'
                            : currentTooltip.summary}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => handleTooltipPreview(hoveredIndex!)}
                            className="px-2.5 py-1 text-[12px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                            Preview
                        </button>
                        <button
                            onClick={() => handleTooltipApply(hoveredIndex!)}
                            className="px-2.5 py-1 text-[12px] font-medium text-white bg-[#6C2BD9] hover:bg-[#6C2BD9]/90 rounded transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                    <div className="text-[11px] text-gray-500">
                        Click for full details
                    </div>
                </div>
            )}
        </div>
    )
}

interface OverflowBadgeProps {
    count: number
    allSuggestions: Recommendation[]
    docId: string
    onApply?: (suggestionId: string) => void
    onDismiss?: (suggestionId: string) => void
}

const OverflowBadge = ({ count, allSuggestions, docId, onApply, onDismiss }: OverflowBadgeProps) => {
    const [showModal, setShowModal] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (showModal) {
            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('suggestions.modal.open', {
                    docId,
                    total: allSuggestions.length
                })
            }

            // Keyboard navigation
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSelectedIndex(prev => Math.min(prev + 1, allSuggestions.length - 1))
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSelectedIndex(prev => Math.max(prev - 1, 0))
                } else if (e.key === 'Enter') {
                    e.preventDefault()
                    // Open popover for selected row
                } else if (e.key === 'Escape') {
                    setShowModal(false)
                }
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [showModal, allSuggestions.length, docId])

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[13px] font-medium text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6C2BD9]/20"
                aria-label={`Show ${count} more suggestions`}
            >
                +{count}
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div
                        ref={modalRef}
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="overflow-modal-title"
                        aria-modal="true"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 id="overflow-modal-title" className="text-lg font-semibold text-gray-800 mb-1">
                                Top Suggestions ({allSuggestions.length})
                            </h2>
                            <p className="text-sm text-gray-600">
                                Review, preview, or apply improvements to strengthen the document.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {allSuggestions.map((suggestion, index) => (
                                <div
                                    key={suggestion.id}
                                    className={cn(
                                        "p-3 rounded-lg border transition-colors",
                                        selectedIndex === index
                                            ? "border-[#6C2BD9] bg-[#6C2BD9]/5"
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
                                            onClick={() => {
                                                // Open popover
                                            }}
                                            className="px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onApply) {
                                                    onApply(suggestion.id)
                                                }
                                            }}
                                            className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#6C2BD9] hover:bg-[#6C2BD9]/90 rounded transition-colors"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onDismiss) {
                                                    onDismiss(suggestion.id)
                                                }
                                            }}
                                            className="px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-[13px] font-medium text-[#6C2BD9] hover:bg-[#6C2BD9]/10 rounded transition-colors"
                            >
                                Show less
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TopSuggestionsBadgeStrip

