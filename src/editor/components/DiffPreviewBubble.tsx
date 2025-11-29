import React from 'react'
import { Loader2, Sparkles, Check, X, AlertTriangle } from 'lucide-react'
import { Portal } from '../../components/Portal'
import { DiffView } from './DiffView'
import { Z_INDEX } from '../../lib/constants'

interface DiffPreviewBubbleProps {
    preview: {
        status: 'loading' | 'ready' | 'error'
        label: string
        original: string
        suggestion: string
    } | null
    onDiscard: () => void
    onApply: () => void
    onReplacePartial: (text: string) => void
}

export const DiffPreviewBubble: React.FC<DiffPreviewBubbleProps> = ({
    preview,
    onDiscard,
    onApply,
    onReplacePartial
}) => {
    if (!preview) return null

    return (
        <Portal>
            <div
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-white/95 backdrop-blur-lg border border-gray-200 shadow-2xl rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4"
                style={{ zIndex: Z_INDEX.FLOATING_POPUP }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 bg-[#6B46FF]/10 text-[#6B46FF] rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            {preview.label || 'AI Action'}
                        </div>
                        {preview.status === 'loading' && (
                            <div className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating<span className="animate-pulse">...</span></span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onDiscard}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {preview.status === 'loading' ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                            <div className="h-4 bg-gray-100 rounded w-full" />
                            <div className="h-4 bg-gray-100 rounded w-5/6" />
                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-3 w-3 bg-gray-200 rounded-full" />
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                            </div>
                        </div>
                    ) : preview.status === 'error' ? (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-3 text-amber-700">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <div className="text-[13px]">
                                <p className="font-semibold">Something went wrong</p>
                                <p className="opacity-90">We couldn't generate a suggestion. Please try again.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Review Changes</span>
                                <span className="text-[11px] text-gray-400">Click blue text to replace</span>
                            </div>
                            <div className="p-4 bg-white max-h-[200px] overflow-y-auto">
                                <DiffView
                                    originalText={preview.original}
                                    newText={preview.suggestion}
                                    onReplace={onReplacePartial}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {preview.status === 'ready' && (
                    <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-gray-100">
                        <button
                            onClick={onDiscard}
                            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onApply}
                            className="px-4 py-2 bg-[#6B46FF] text-white text-[13px] font-semibold rounded-lg shadow-sm hover:bg-[#6B46FF]/90 transition-all flex items-center gap-2"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Replace Selection
                        </button>
                    </div>
                )}
            </div>
        </Portal>
    )
}
