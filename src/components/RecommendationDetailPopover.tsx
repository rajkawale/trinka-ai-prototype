import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, Check, XCircle, HelpCircle } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'

interface RecommendationDetailPopoverProps {
    recommendation: Recommendation
    docId: string
    anchorElement: HTMLElement
    onClose: () => void
    onApply?: (recommendationId: string) => void
    onDismiss?: (recommendationId: string) => void
}

const RecommendationDetailPopover = ({
    recommendation,
    docId,
    anchorElement,
    onClose,
    onApply,
    onDismiss
}: RecommendationDetailPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null)
    const previewButtonRef = useRef<HTMLButtonElement>(null)
    const [showHelpTooltip, setShowHelpTooltip] = useState(false)
    const [position, setPosition] = useState<{ top: number; left: number; placement: string }>({ top: 0, left: 0, placement: 'top-start' })

    // Calculate position with Popper-like logic
    useEffect(() => {
        if (!popoverRef.current || !anchorElement) return

        const updatePosition = () => {
            const anchorRect = anchorElement.getBoundingClientRect()
            const popover = popoverRef.current
            if (!popover) return

            const popoverRect = popover.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            const padding = 8

            // Preferred: top-start
            let top = anchorRect.top - popoverRect.height - 12
            let left = anchorRect.left
            let placement = 'top-start'

            // Check if top doesn't fit, try top-end
            if (top < padding) {
                top = anchorRect.top - popoverRect.height - 12
                left = anchorRect.right - popoverRect.width
                placement = 'top-end'
            }

            // If still doesn't fit, try bottom-start
            if (top < padding) {
                top = anchorRect.bottom + 12
                left = anchorRect.left
                placement = 'bottom-start'
            }

            // If still doesn't fit, try bottom-end
            if (top + popoverRect.height > viewportHeight - padding) {
                top = anchorRect.bottom + 12
                left = anchorRect.right - popoverRect.width
                placement = 'bottom-end'
            }

            // Prevent overflow with preventOverflow modifier
            if (left < padding) {
                left = padding
            }
            if (left + popoverRect.width > viewportWidth - padding) {
                left = viewportWidth - popoverRect.width - padding
            }
            if (top < padding) {
                top = padding
            }
            if (top + popoverRect.height > viewportHeight - padding) {
                top = viewportHeight - popoverRect.height - padding
            }

            setPosition({ top, left, placement })
        }

        updatePosition()
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)

        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
        }
    }, [anchorElement])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
                !anchorElement.contains(event.target as Node)) {
                onClose()
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                // Return focus to anchor element
                if (anchorElement instanceof HTMLElement) {
                    anchorElement.focus()
                }
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        // Focus Preview button on open
        setTimeout(() => {
            previewButtonRef.current?.focus()
        }, 100)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose, anchorElement])

    const handlePreview = () => {
        // Emit telemetry
        if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('rec.preview', {
                docId,
                recommendationId: recommendation.id
            })
        }
        // TODO: Open preview modal with diff view
        onClose()
    }

    const handleApply = async () => {
        try {
            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.apply', {
                    docId,
                    recommendationId: recommendation.id,
                    estimatedImpact: recommendation.estimatedImpact
                })
            }

            const response = await fetch('/api/recommendations/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user', // TODO: Get from auth context
                    docId,
                    recommendationId: recommendation.id
                })
            })

            if (response.ok) {
                await response.json()
                if (onApply) {
                    onApply(recommendation.id)
                }
                // Show toast with undo
                // TODO: Implement toast system
                onClose()
            } else {
                // Show error toast
                alert('Action failed. Try again')
            }
        } catch (error) {
            console.error('Apply failed:', error)
            alert('Action failed. Try again')
        }
    }

    const handleDismiss = async () => {
        try {
            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.dismiss', {
                    docId,
                    recommendationId: recommendation.id
                })
            }

            const response = await fetch('http://localhost:8000/api/recommendations/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user', // TODO: Get from auth context
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

    const popoverContent = (
        <div
            ref={popoverRef}
            className="fixed w-[360px] max-w-[360px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in fade-in slide-in-from-top-2"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 1400
            }}
            role="dialog"
            aria-labelledby="recommendation-title"
            aria-modal="true"
        >
            <div className="flex items-start justify-between mb-3">
                <h3 id="recommendation-title" className="text-[14px] font-semibold text-gray-800 flex-1">
                    {recommendation.title}
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <p className="text-[13px] text-gray-700 mb-3 leading-relaxed">
                {recommendation.fullText}
            </p>

            <div className="text-[11px] text-gray-500 mb-4">
                Impact: {recommendation.estimatedImpact.charAt(0).toUpperCase() + recommendation.estimatedImpact.slice(1)}
            </div>

            <div className="flex items-center gap-2 mb-4">
                <button
                    ref={previewButtonRef}
                    onClick={handlePreview}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Preview suggestion"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                </button>
                <button
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-[#6B46FF] hover:bg-[#6B46FF]/90 rounded-lg transition-colors"
                    aria-label="Apply suggestion"
                >
                    <Check className="w-3.5 h-3.5" />
                    Apply
                </button>
                <button
                    onClick={handleDismiss}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Dismiss suggestion"
                >
                    <XCircle className="w-3.5 h-3.5" />
                    Dismiss
                </button>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                    className="text-[12px] text-[#6B46FF] hover:text-[#6B46FF]/80 transition-colors flex items-center gap-1"
                    aria-label="Why this suggestion?"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Why this suggestion?
                </button>
                {showHelpTooltip && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[12px] rounded-lg shadow-lg z-10">
                        This suggestion is based on readability analysis, tone consistency, and academic writing best practices.
                    </div>
                )}
            </div>
        </div>
    )

    // Render via portal to document.body
    return typeof document !== 'undefined' 
        ? createPortal(popoverContent, document.body)
        : null
}

export default RecommendationDetailPopover

