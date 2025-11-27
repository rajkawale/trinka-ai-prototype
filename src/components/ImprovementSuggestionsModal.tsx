import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface ImprovementSuggestionsModalProps {
    factor: string
    onClose: () => void
    onApplyFix?: (fix: string) => void
}

const improvementGuides = {
    'Correctness': {
        title: 'Improve Correctness',
        description: 'Fix grammar, spelling, and punctuation issues',
        tips: [
            { text: 'Review grammar errors highlighted in red', actionable: true },
            { text: 'Fix spelling mistakes', actionable: true },
            { text: 'Check subject-verb agreement', actionable: false },
            { text: 'Verify proper punctuation placement', actionable: false },
        ],
        quickFixes: [
            'Apply all grammar suggestions',
            'Run spell check',
        ]
    },
    'Clarity': {
        title: 'Improve Clarity',
        description: 'Make your writing clearer and more concise',
        tips: [
            { text: 'Break down long, complex sentences', actionable: true },
            { text: 'Remove unnecessary words and phrases', actionable: true },
            { text: 'Use active voice instead of passive', actionable: false },
            { text: 'Define technical terms for your audience', actionable: false },
        ],
        quickFixes: [
            'Simplify complex sentences',
            'Remove filler words',
        ]
    },
    'Tone': {
        title: 'Improve Tone',
        description: 'Match your writing tone to your goals',
        tips: [
            { text: 'Review tone suggestions in the editor', actionable: true },
            { text: 'Adjust formality based on your audience', actionable: false },
            { text: 'Use consistent language throughout', actionable: false },
            { text: 'Check Goals settings for tone preferences', actionable: false },
        ],
        quickFixes: [
            'Apply tone adjustments',
            'Review Goals settings',
        ]
    },
    'Engagement': {
        title: 'Improve Engagement',
        description: 'Make your writing more engaging and interesting',
        tips: [
            { text: 'Vary sentence length for better rhythm', actionable: true },
            { text: 'Use strong, active verbs', actionable: false },
            { text: 'Add relevant examples and details', actionable: false },
            { text: 'Ask rhetorical questions to engage readers', actionable: false },
        ],
        quickFixes: [
            'Add transitional phrases',
            'Strengthen weak verbs',
        ]
    },
    'Structure': {
        title: 'Improve Structure',
        description: 'Organize your content for better flow',
        tips: [
            { text: 'Add headings to break up long sections', actionable: true },
            { text: 'Use bullet points for lists', actionable: true },
            { text: 'Ensure logical paragraph progression', actionable: false },
            { text: 'Add topic sentences to paragraphs', actionable: false },
        ],
        quickFixes: [
            'Generate heading suggestions',
            'Reorder paragraphs',
        ]
    }
}

const ImprovementSuggestionsModal = ({ factor, onClose, onApplyFix }: ImprovementSuggestionsModalProps) => {
    const guide = improvementGuides[factor as keyof typeof improvementGuides]

    if (!guide) {
        return null
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#6C2BD9]/5 to-[#A93AFF]/5">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{guide.title}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{guide.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {/* Quick Fixes */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#6C2BD9]" />
                            Quick Fixes
                        </h4>
                        <div className="space-y-2">
                            {guide.quickFixes.map((fix, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (onApplyFix) {
                                            onApplyFix(fix)
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2.5 bg-[#6C2BD9]/5 hover:bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 rounded-lg transition-colors group"
                                >
                                    <span className="text-sm text-gray-700 group-hover:text-[#6C2BD9] font-medium">
                                        {fix}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Improvement Tips */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Improvement Tips
                        </h4>
                        <div className="space-y-2">
                            {guide.tips.map((tip, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-start gap-3 px-4 py-3 rounded-lg border",
                                        tip.actionable
                                            ? "bg-amber-50/50 border-amber-200"
                                            : "bg-gray-50 border-gray-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                                        tip.actionable ? "bg-amber-600" : "bg-gray-400"
                                    )} />
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {tip.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-[#6C2BD9] hover:bg-[#5835FF] text-white font-medium rounded-lg transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ImprovementSuggestionsModal
