import React from 'react'
import { X, Check, Ban, BookOpen } from 'lucide-react'
import type { Recommendation } from './RecommendationCard'
import { groupRecommendations } from '../utils/groupRecommendations'

interface AllSuggestionsModalProps {
    isOpen: boolean
    onClose: () => void
    recommendations: Recommendation[]
    onApply?: (id: string, text: string) => void
    onIgnore?: (id: string) => void
    onAddToDictionary?: (id: string) => void
}

export const AllSuggestionsModal: React.FC<AllSuggestionsModalProps> = ({
    isOpen,
    onClose,
    recommendations,
    onApply,
    onIgnore,
    onAddToDictionary
}) => {
    if (!isOpen) return null

    const grouped = groupRecommendations(recommendations)

    const handleApply = (rec: Recommendation) => {
        if (onApply) {
            onApply(rec.id, rec.replacementText || rec.fullText)
        }
    }

    const handleIgnore = (rec: Recommendation) => {
        if (onIgnore) {
            onIgnore(rec.id)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">All Writing Suggestions</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{recommendations.length} total suggestions</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {grouped.map((group) => (
                        <div key={group.type} className="space-y-3">
                            {/* Group Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                    {group.type}
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {group.count}
                                </span>
                            </div>

                            {/* Recommendations List */}
                            <div className="space-y-2">
                                {group.recommendations.map((rec) => (
                                    <div
                                        key={rec.id}
                                        className="p-4 rounded-lg border border-gray-200 hover:border-[#6C2BD9]/20 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                                    {rec.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 mb-2">{rec.summary}</p>
                                                {rec.fullText && (
                                                    <p className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded">
                                                        {rec.fullText}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {onApply && (
                                                    <button
                                                        onClick={() => handleApply(rec)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#6C2BD9] text-white hover:bg-[#5A27C2] rounded-lg transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Apply
                                                    </button>
                                                )}
                                                {onIgnore && (
                                                    <button
                                                        onClick={() => handleIgnore(rec)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <Ban className="w-3 h-3" />
                                                        Ignore
                                                    </button>
                                                )}
                                                {onAddToDictionary && (
                                                    <button
                                                        onClick={() => {
                                                            if (onAddToDictionary) {
                                                                onAddToDictionary(rec.id)
                                                            }
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <BookOpen className="w-3 h-3" />
                                                        Add to Dict
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AllSuggestionsModal

