import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

interface ScorePillProps {
    score: number
    isOpen?: boolean
    onClick?: () => void
    className?: string
}

const ScorePill = React.forwardRef<HTMLButtonElement, ScorePillProps>(({ score, isOpen = false, onClick, className }, ref) => {
    // Determine progress bar color based on score range
    const getProgressColor = (s: number) => {
        if (s <= 35) return 'bg-red-500' // Red for <=35
        if (s >= 36 && s <= 80) return 'bg-yellow-500' // Yellow for 36-80
        return 'bg-green-500' // Green for >81
    }

    // Determine button background color
    const getButtonColor = (s: number) => {
        if (s <= 35) return 'bg-red-50 border-red-200 text-red-800'
        if (s >= 36 && s <= 80) return 'bg-yellow-50 border-yellow-200 text-yellow-800'
        return 'bg-green-50 border-green-200 text-green-800'
    }

    return (
        <button
            ref={ref}
            onClick={onClick}
            onMouseDown={(e) => {
              // Prevent default focus behavior on mousedown
              if (onClick) {
                e.preventDefault()
              }
            }}
            disabled={!onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 shadow-md transition-all duration-200",
                onClick && "hover:shadow-lg cursor-pointer",
                !onClick && "cursor-default",
                "focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none active:ring-0",
                getButtonColor(score),
                className
            )}
            aria-label={`Writing quality score: ${score}`}
            title="Click to view writing quality factors"
        >
            <span className="text-sm font-semibold whitespace-nowrap">
                Writing Score
            </span>
            
            {/* Progress bar wrapper */}
            <div className="flex items-center gap-2">
                <div className="relative w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full rounded-full transition-all duration-500", getProgressColor(score))}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                </div>
                <span className="text-sm font-bold whitespace-nowrap min-w-[2rem] text-right">
                    {score}
                </span>
            </div>
            
            {onClick && (
                isOpen ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200 flex-shrink-0" />
                ) : (
                    <ChevronUp className="w-4 h-4 transition-transform duration-200 flex-shrink-0" />
                )
            )}
        </button>
    )
})

ScorePill.displayName = 'ScorePill'

export default ScorePill
