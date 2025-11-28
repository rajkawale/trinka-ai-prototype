import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

interface CopilotFabProps {
    onClick: () => void
    isOpen: boolean
    className?: string
}

const CopilotFab: React.FC<CopilotFabProps> = ({ onClick, isOpen, className }) => {
    return (
        <div className="group relative">
            <button
                onClick={onClick}
                className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 active:scale-95",
                    isOpen
                        ? "bg-gray-100 text-gray-600 rotate-180"
                        : "bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white",
                    className
                )}
                aria-label={isOpen ? "Close Copilot" : "Open Copilot"}
            >
                <Sparkles className={cn("w-6 h-6", isOpen && "text-gray-600")} />
            </button>

            {/* Tooltip */}
            {!isOpen && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Chat with Trinka AI
                    {/* Arrow */}
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
            )}
        </div>
    )
}

export default CopilotFab
