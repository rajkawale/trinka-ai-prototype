import React from 'react'
import { Gauge, ChevronLeft, BookMarked } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Editor } from '@tiptap/react'

interface WritingAnalysisSidebarProps {
    editor: Editor | null
    isHealthCollapsed: boolean
    writingScore: number
    wordCount: number
    readTime: string
    qualitySignals: { label: string; value: string; status: string }[]
    outline: { id: string; label: string; level: number; position: number }[]
    setSelectedFactorForImprovement: (factor: string) => void
}

export const WritingAnalysisSidebar: React.FC<WritingAnalysisSidebarProps> = ({
    editor,
    writingScore,
    wordCount,
    readTime,
    qualitySignals,
    outline,
    setSelectedFactorForImprovement
}) => {
    return (
        <aside className="w-80 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col h-full overflow-hidden">
            <div className="p-6 overflow-y-auto h-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-[#6C2BD9]">
                        <Gauge className="w-5 h-5" />
                        <h2 className="font-semibold text-gray-900">Writing Analysis</h2>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Score Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">Overall Score</span>
                        <span className={cn(
                            "text-2xl font-bold",
                            writingScore >= 90 ? "text-emerald-600" :
                                writingScore >= 70 ? "text-blue-600" :
                                    "text-amber-600"
                        )}>
                            {writingScore}
                        </span>
                    </div>
                    {/* Quality Signals */}
                    <div className="space-y-3">
                        {qualitySignals.map((signal) => (
                            <button
                                key={signal.label}
                                onClick={() => {
                                    if (signal.status !== 'success') {
                                        setSelectedFactorForImprovement(signal.label)
                                    }
                                }}
                                className="w-full group"
                            >
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors">{signal.label}</span>
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

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Words</div>
                        <div className="font-semibold text-gray-800">{wordCount}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Read Time</div>
                        <div className="font-semibold text-gray-800">{readTime}</div>
                    </div>
                </div>

                {/* Outline */}
                <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 mb-3">
                        <BookMarked className="w-3.5 h-3.5 text-[#6C2BD9]" />
                        Outline
                    </div>
                    <div className="space-y-0.5">
                        {(outline.length ? outline : [{ id: 'intro', label: 'Introduction', level: 2, position: 0 }]).map(node => (
                            <button
                                key={node.id}
                                className={cn(
                                    'w-full text-left text-[13px] px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors',
                                    node.level > 2 && 'pl-4 text-[#6b6f76] text-[12px]'
                                )}
                                onClick={() => {
                                    const found = outline.find(o => o.id === node.id)
                                    if (found && editor) {
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextSelection({ from: found.position, to: found.position + found.label.length })
                                            .scrollIntoView()
                                            .run()
                                    }
                                }}
                            >
                                {node.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    )
}
