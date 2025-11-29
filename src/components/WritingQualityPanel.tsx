import React, { useRef, useState, useEffect } from 'react'
import { Gauge, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { useClickOutside } from '../hooks/useClickOutside'
import ImprovementSuggestionsModal from './ImprovementSuggestionsModal'

interface QualitySignal {
    label: string
    value: string
    status: 'success' | 'warning' | 'info'
}

interface WritingQualityPanelProps {
    isOpen: boolean
    onClose: () => void
    score: number
    wordCount: number
    readTime: string
    qualitySignals?: QualitySignal[]
    onApplyFix?: (fix: string) => void
    position?: 'left' | 'right' | 'floating'
    anchorElement?: HTMLElement | null
    isScoreSubPopupOpen?: boolean
    onOpenSubPopup?: () => void
    onCloseSubPopup?: () => void
}

/**
 * Writing Quality Panel - Toggleable panel showing document metrics
 * Opens when ScorePill is clicked, closes on outside click or X button
 * Quality factors are clickable to show improvement suggestions
 */
// Default quality signals matching Trinka design
const DEFAULT_QUALITY_SIGNALS: QualitySignal[] = [
    { label: 'Correctness', value: 'Good', status: 'success' },
    { label: 'Clarity', value: 'Crisp', status: 'success' },
    { label: 'Tone', value: 'Needs Polish', status: 'warning' },
    { label: 'Engagement', value: 'High', status: 'success' },
    { label: 'Structure', value: '1 headings', status: 'info' },
]

export const WritingQualityPanel: React.FC<WritingQualityPanelProps> = ({
    isOpen,
    onClose,
    score,
    wordCount,
    readTime,
    qualitySignals = DEFAULT_QUALITY_SIGNALS,
    onApplyFix,
    position = 'floating',
    anchorElement,
    isScoreSubPopupOpen = false,
    onOpenSubPopup,
    onCloseSubPopup
}) => {
    const panelRef = useRef<HTMLDivElement>(null)
    const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 })
    const [selectedFactor, setSelectedFactor] = useState<string | null>(null)
    
    // Reset selected factor when sub-popup closes
    useEffect(() => {
        if (!isScoreSubPopupOpen) {
            setSelectedFactor(null)
        }
    }, [isScoreSubPopupOpen])

    useClickOutside(panelRef, () => {
        if (isOpen) {
            onClose()
        }
    })

    // Calculate panel position based on anchor element or position prop
    useEffect(() => {
        if (!isOpen || !anchorElement) return

        if (position === 'floating' && anchorElement) {
            const rect = anchorElement.getBoundingClientRect()
            const spacing = 8
            
            // Position ABOVE the button (opens upward from bottom-left)
            // Calculate height needed for panel (max-h-[80vh] = ~600px max)
            const panelHeight = Math.min(600, window.innerHeight * 0.8)
            
            setPanelPosition({
                top: rect.top - panelHeight - spacing, // Position above button with spacing
                left: rect.left // Align with left edge of button
            })
            
            // Adjust if panel would overflow top - position to the right instead
            if (rect.top - panelHeight - spacing < 0) {
                setPanelPosition({
                    top: rect.bottom + spacing, // Position below if not enough space above
                    left: rect.left
                })
            }
        }
    }, [isOpen, anchorElement, position])

    // Position classes based on position prop with smooth animations
    const positionClasses = 
        position === 'floating' && anchorElement
            ? `fixed z-[45] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2`
            : position === 'right'
            ? 'fixed top-16 right-4 z-[45] transition-all duration-300 ease-out animate-in fade-in slide-in-from-right-2'
            : 'fixed top-16 left-4 z-[45] transition-all duration-300 ease-out animate-in fade-in slide-in-from-left-2'

    const panelStyle: React.CSSProperties = position === 'floating' && anchorElement
        ? { 
            top: `${panelPosition.top}px`, 
            left: `${panelPosition.left}px`,
        }
        : {}

    // Reset sub-popup when main panel closes
    useEffect(() => {
        if (!isOpen && onCloseSubPopup) {
            onCloseSubPopup()
        }
    }, [isOpen, onCloseSubPopup])

    if (!isOpen) return null

    return (
        <>
        {/* Backdrop for Score Panel */}
        <div 
            className="fixed inset-0 bg-black/20 z-[44] animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
        />
        <div className={positionClasses} style={panelStyle}>
            <div
                ref={panelRef}
                className="bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-80 max-h-[80vh] overflow-y-auto transition-all duration-300"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#6C2BD9]">
                        <Gauge className="w-4 h-4" />
                        <h3 className="font-semibold text-sm text-gray-900">Writing Quality</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close panel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Score Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">Overall Score</span>
                        <span className={cn(
                            "text-2xl font-bold",
                            score >= 90 ? "text-emerald-600" :
                                score >= 80 ? "text-blue-600" :
                                    "text-amber-600"
                        )}>
                            {score}
                        </span>
                    </div>
                    
                    {/* Quality Signals/Factors - Clickable */}
                    <div className="space-y-3">
                        {qualitySignals.map((signal) => (
                            <button
                                key={signal.label}
                                onClick={() => {
                                    // Set selected factor and open sub-popup
                                    setSelectedFactor(signal.label)
                                    if (onOpenSubPopup) {
                                        onOpenSubPopup()
                                    }
                                }}
                                className="w-full group text-left"
                            >
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className={cn(
                                        "text-gray-600 group-hover:text-gray-900 transition-colors",
                                        signal.status !== 'success' && "font-medium"
                                    )}>
                                        {signal.label}
                                    </span>
                                    <span className={cn(
                                        "font-medium px-1.5 py-0.5 rounded",
                                        signal.status === 'success' ? "bg-green-50 text-green-700" :
                                            signal.status === 'warning' ? "bg-amber-50 text-amber-700" :
                                                "bg-blue-50 text-blue-700"
                                    )}>
                                        {signal.value}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            signal.status === 'success' ? "bg-[#35C28B] w-full" :
                                                signal.status === 'warning' ? "bg-amber-400 w-[60%]" : "bg-blue-400 w-[80%]"
                                        )}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Words</div>
                        <div className="font-semibold text-gray-800">{wordCount}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Read Time</div>
                        <div className="font-semibold text-gray-800">{readTime}</div>
                    </div>
                </div>
            </div>
        </div>
        {/* Improvement Suggestions Modal */}
        {isScoreSubPopupOpen && selectedFactor && (
            <ImprovementSuggestionsModal
                factor={selectedFactor}
                onClose={() => {
                    setSelectedFactor(null)
                    if (onCloseSubPopup) {
                        onCloseSubPopup()
                    }
                }}
                onApplyFix={(fix) => {
                    if (onApplyFix) {
                        onApplyFix(fix)
                    } else {
                        console.log('[WritingQualityPanel] Apply fix requested:', fix)
                    }
                    setSelectedFactor(null)
                    if (onCloseSubPopup) {
                        onCloseSubPopup()
                    }
                }}
            />
        )}
        </>
    )
}

export default WritingQualityPanel

