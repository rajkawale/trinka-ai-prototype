import React from 'react'
import { Activity } from 'lucide-react'
import { cn } from '../lib/utils'

interface ScorePillProps {
    score: number
    onClick?: () => void
    className?: string
}

const ScorePill: React.FC<ScorePillProps> = ({ score, onClick, className }) => {
    // Determine color based on score
    const getScoreColor = (s: number) => {
        if (s >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
        if (s >= 80) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (s >= 60) return 'text-amber-600 bg-amber-50 border-amber-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all",
                onClick && "hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer",
                !onClick && "cursor-default",
                getScoreColor(score),
                className
            )}
            aria-label={`Writing quality score: ${score}`}
            title="Click to view writing quality factors"
        >
            <Activity className="w-4 h-4" />
            <span className="text-sm font-semibold whitespace-nowrap">Score: {score}</span>
        </button>
    )
}

export default ScorePill
