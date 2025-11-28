import React from 'react'
import { Loader2, Sparkles, AlertTriangle, Check } from 'lucide-react'

interface DiffPreviewBubbleProps {
    preview: any
    applySuggestion: () => void
    discardSuggestion: () => void
}

export const DiffPreviewBubble: React.FC<DiffPreviewBubbleProps> = ({
    preview,
    applySuggestion,
    discardSuggestion
}) => {
    if (!preview) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[640px] bg-white/95 backdrop-blur-lg border border-gray-200 shadow-2xl rounded-xl p-4 z-30 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#6b6f76]">Diff preview</p>
                    <p className="text-[14px] font-semibold text-gray-800">{preview.label}</p>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#6b6f76]">
                    {preview.status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{preview.status === 'ready' ? 'Ready to apply' : preview.status === 'loading' ? 'Streaming...' : 'Retry needed'}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/60 max-h-32 overflow-y-auto">
                    <p className="text-[11px] text-[#6b6f76] mb-1.5">Original</p>
                    <p className="text-gray-700 text-[13px] whitespace-pre-wrap leading-relaxed">{preview.original}</p>
                </div>
                <div className="border border-[#6B46FF]/20 rounded-lg p-3 bg-[#6B46FF]/5 max-h-32 overflow-y-auto">
                    <p className="text-[11px] text-[#6B46FF] mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Suggested
                    </p>
                    <p className="text-gray-800 text-[13px] whitespace-pre-wrap leading-relaxed">
                        {preview.status === 'loading' ? 'Generating better phrasing…' : (
                            <span>
                                {preview.suggestion.split(' ').map((word: string, i: number) => (
                                    <span
                                        key={i}
                                        className={preview.changedTokens?.some((t: any) => t.from <= i && t.to >= i) ? 'bg-[#FDE68A]' : ''}
                                    >
                                        {word}{' '}
                                    </span>
                                ))}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4">
                {preview.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-[12px] text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        We could not complete that action. Please try again.
                    </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={discardSuggestion}
                        className="px-3.5 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Reject
                    </button>
                    <button
                        disabled={preview.status !== 'ready'}
                        onClick={applySuggestion}
                        className="px-3.5 py-2 bg-[#6B46FF] text-white text-[13px] font-semibold rounded-lg shadow-sm disabled:bg-purple-300 flex items-center gap-1.5 hover:bg-[#6B46FF]/90 transition-colors"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Apply
                    </button>
                </div>
            </div>
        </div>
    )
}
