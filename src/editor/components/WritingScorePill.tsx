import React, { useState, useRef } from 'react'
import { Target, Clock, History, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { QualitySignal } from '../types'
import { useClickOutside } from '../../hooks/useClickOutside'

interface WritingScorePillProps {
    score: number
    signals: QualitySignal[]
    wordCount: number
    readTime: string
    revisionCount: number
    onOpenGoals: () => void
    onOpenHistory: () => void
    onClick?: () => void
}

export const WritingScorePill: React.FC<WritingScorePillProps> = ({
    score,
    signals,
    wordCount,
    readTime,
    revisionCount,
    onOpenGoals,
    onOpenHistory,
    onClick
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useClickOutside(containerRef, () => setIsOpen(false))

    return (
        <div className="fixed bottom-6 left-6 z-50" ref={containerRef}>
            {/* Popover Content */}
            <div
                className={cn(
                    "absolute bottom-full left-0 mb-3 w-[280px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-200 origin-bottom-left",
                    isOpen && !onClick ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                )}
            >
                <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Writing Quality</span>
                            <span className={cn(
                                "text-sm font-bold px-2 py-0.5 rounded",
                                score >= 90 ? "bg-[#35C28B]/10 text-[#35C28B]" :
                                    score >= 70 ? "bg-blue-100 text-blue-700" :
                                        "bg-amber-100 text-amber-700"
                            )}>
                                {score}
                            </span>
                        </div>
                        <button
                            onClick={onOpenGoals}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                            title="Set Goals"
                        >
                            <Target className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Score Factors */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Score Factors</p>
                        {signals.map((signal) => (
                            <div key={signal.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{signal.label}</span>
                                    <span className={cn(
                                        "font-medium",
                                        signal.status === 'success' ? "text-[#35C28B]" :
                                            signal.status === 'warning' ? "text-amber-600" : "text-blue-600"
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
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Word count</span>
                            <span className="font-medium text-gray-900">{wordCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Read time
                            </span>
                            <span className="font-medium text-gray-900">{readTime}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                                <History className="w-3 h-3" />
                                Versions
                            </span>
                            <button
                                onClick={onOpenHistory}
                                className="font-medium text-[#6C2BD9] hover:underline"
                            >
                                {revisionCount} saved
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pill Button */}
            <button
                onClick={() => onClick ? onClick() : setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 px-4 py-2.5 bg-white rounded-full shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 group",
                    isOpen && "ring-2 ring-[#6B46FF]/20 border-[#6B46FF]"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="10"
                                cy="10"
                                r="8"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                className="text-gray-100"
                            />
                            <circle
                                cx="10"
                                cy="10"
                                r="8"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                strokeDasharray={50.265}
                                strokeDashoffset={50.265 * (1 - score / 100)}
                                className={cn(
                                    "transition-all duration-1000 ease-out",
                                    score >= 90 ? "text-[#35C28B]" :
                                        score >= 70 ? "text-blue-500" :
                                            "text-amber-500"
                                )}
                            />
                        </svg>
                    </div>
                    <span className="font-semibold text-gray-700">{score}</span>
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                    Writing Score
                </span>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
            </button>
        </div>
    )
}
