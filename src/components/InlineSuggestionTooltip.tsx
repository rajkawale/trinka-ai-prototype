import React, { useState, useRef, useEffect } from 'react'
import { Check, X, Loader2, BookOpen, Ban, MoreHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'
import { Portal } from './Portal'

interface InlineSuggestionTooltipProps {
    message: string
    suggestion?: string
    issueType: 'grammar' | 'tone' | 'clarity' | 'ai-suggestion' | 'paraphrase'
    position: { top: number; left: number }
    onApply?: () => void
    onDismiss?: () => void
    onIgnore?: () => void
    onAddToDictionary?: () => void
    onShowMore?: () => void
}

export const InlineSuggestionTooltip: React.FC<InlineSuggestionTooltipProps> = ({
    message,
    suggestion,
    issueType,
    position,
    onApply,
    onDismiss,
    onIgnore,
    onAddToDictionary,
    onShowMore
}) => {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const [adjustedPosition, setAdjustedPosition] = useState(position)
    const [isApplying, setIsApplying] = useState(false)

    // Add Escape key handler to close tooltip
    useEffect(() => {
        if (!onDismiss) return
        
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onDismiss()
            }
        }
        
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onDismiss])

    // Adjust position to stay within viewport
    useEffect(() => {
        if (!tooltipRef.current) return

        const tooltip = tooltipRef.current
        const rect = tooltip.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let newLeft = position.left
        let newTop = position.top

        // Adjust horizontal position
        if (rect.right > viewportWidth) {
            newLeft = viewportWidth - rect.width - 16
        }
        if (rect.left < 0) {
            newLeft = 16
        }

        // Adjust vertical position
        if (rect.bottom > viewportHeight) {
            newTop = position.top - rect.height - 40 // Position above
        }
        if (rect.top < 0) {
            newTop = 16
        }

        setAdjustedPosition({ top: newTop, left: newLeft })
    }, [position])

    const getIssueColor = () => {
        switch (issueType) {
            case 'grammar':
                return 'bg-red-50 border-red-200 text-red-800'
            case 'tone':
                return 'bg-amber-50 border-amber-200 text-amber-800'
            case 'clarity':
                return 'bg-blue-50 border-blue-200 text-blue-800'
            case 'paraphrase':
            default:
                return 'bg-purple-50 border-purple-200 text-purple-800'
        }
    }

    const handleApply = async () => {
        if (onApply) {
            setIsApplying(true)
            try {
                await onApply()
            } finally {
                setIsApplying(false)
            }
        }
        onDismiss?.()
    }

    return (
        <Portal>
            <div
                ref={tooltipRef}
                data-tooltip="true"
                className={cn(
                    "fixed z-[10000] bg-white rounded-lg border shadow-xl p-3 min-w-[200px] max-w-[300px] transition-all duration-200",
                    getIssueColor(),
                    "animate-in fade-in zoom-in-95"
                )}
                style={{
                    top: `${adjustedPosition.top}px`,
                    left: `${adjustedPosition.left}px`
                }}
            >
                {/* Arrow pointing UP to the underlined text */}
                <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"
                    style={{ filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))' }}
                />
                <div className="text-sm font-medium mb-1">{message}</div>
                {suggestion && (
                    <div className="text-xs text-gray-600 mb-3 mt-1 italic">
                        "{suggestion}"
                    </div>
                )}

                <div className="space-y-2 mt-3 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        {onApply && (
                            <button
                                onClick={handleApply}
                                disabled={isApplying}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                                    isApplying
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-[#6C2BD9] text-white hover:bg-[#5A27C2]"
                                )}
                            >
                                {isApplying ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3 h-3" />
                                        Apply
                                    </>
                                )}
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {onIgnore && (
                            <button
                                onClick={() => {
                                    onIgnore()
                                    onDismiss?.()
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Ban className="w-3 h-3" />
                                Ignore
                            </button>
                        )}
                        {onAddToDictionary && issueType === 'grammar' && (
                            <button
                                onClick={() => {
                                    onAddToDictionary()
                                    onDismiss?.()
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <BookOpen className="w-3 h-3" />
                                Add to Dictionary
                            </button>
                        )}
                        {onShowMore && (
                            <button
                                onClick={() => {
                                    onShowMore()
                                    onDismiss?.()
                                }}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreHorizontal className="w-3 h-3" />
                                More...
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    )
}

