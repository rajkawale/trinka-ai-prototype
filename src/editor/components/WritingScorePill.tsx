import React, { useRef } from 'react'
import { Target, ChevronUp, ChevronDown, History } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { QualitySignal } from '../types'
import { useClickOutside } from '../../hooks/useClickOutside'
import { Z_INDEX } from '../../lib/constants'

interface WritingScorePillProps {
    score: number
    signals: QualitySignal[]
    wordCount: number
    readTime: string
    revisionCount: number
    onOpenGoals: () => void
    onOpenHistory: () => void
    isOpen: boolean
    onToggle: () => void
}

export const WritingScorePill: React.FC<WritingScorePillProps> = ({
    score,
    signals,
    wordCount,
    readTime,
    revisionCount,
    onOpenGoals,
    onOpenHistory,
    isOpen,
    onToggle
}) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useClickOutside(containerRef, () => {
        if (isOpen) onToggle()
    })

    return (
        <div
            className="fixed bottom-6 left-6"
            ref={containerRef}
            style={{ zIndex: Z_INDEX.FAB }}
        >
            {/* Popover Content */}
            <div
                className={cn(
                    "absolute bottom-full left-0 mb-3 w-[300px] bg-white rounded-xl shadow-2xl border border-gray-200/60 overflow-hidden transition-all duration-200 origin-bottom-left",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                )}
            >
                <div className="p-4 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#6F4FF0]/10 flex items-center justify-center">
                                <Target className="w-3.5 h-3.5 text-[#6F4FF0]" />
                            </div>
                            <span className="text-[13px] font-semibold text-gray-800">Writing Quality Score</span>
                            <span className={cn(
                                "text-[13px] font-bold px-2 py-0.5 rounded-full",
                                score >= 90 ? "bg-[#35C28B]/10 text-[#35C28B]" :
                                    score >= 70 ? "bg-blue-100 text-blue-700" :
                                        "bg-amber-100 text-amber-700"
                            )}>
                                {score}
                            </span>
                        </div>
                    </div>

                    {/* Score Factors */}
                    <div className="space-y-2.5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Score Factors</p>
                        <div className="space-y-2">
                            {signals.map((signal) => (
                                <div key={signal.label} className="flex items-center justify-between text-[13px]">
                                    <span className="text-gray-600">{signal.label}</span>
                                    <span className={cn(
                                        "font-medium",
                                        signal.status === 'success' ? "text-[#35C28B]" :
                                            signal.status === 'warning' ? "text-amber-600" : "text-blue-600"
                                    )}>
                                        {signal.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100" />

                    {/* Document Stats */}
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Document Stats</p>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col gap-1">
                                <span className="text-[11px] text-gray-500">Word Count</span>
                                <span className="text-[13px] font-semibold text-gray-900">{wordCount}</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col gap-1">
                                <span className="text-[11px] text-gray-500">Read Time</span>
                                <span className="text-[13px] font-semibold text-gray-900">{readTime}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onOpenHistory}
                                className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-3 border border-gray-100 flex flex-col gap-1 text-left group"
                            >
                                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                    Versions <History className="w-3 h-3 opacity-50" />
                                </span>
                                <span className="text-[13px] font-semibold text-[#6F4FF0] group-hover:underline">
                                    {revisionCount} versions
                                </span>
                            </button>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col gap-1">
                                <span className="text-[11px] text-gray-500">Last Edited</span>
                                <span className="text-[13px] font-semibold text-gray-900">Just now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pill Button */}
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-3 px-4 py-2.5 bg-white rounded-full shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 group",
                    isOpen && "ring-2 ring-[#6F4FF0]/20 border-[#6F4FF0]"
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
