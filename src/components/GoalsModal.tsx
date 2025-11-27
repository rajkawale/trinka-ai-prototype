import { useState, useEffect } from 'react'
import { X, Target, Briefcase, GraduationCap, Users, Sparkles, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

export type Goals = {
    audience: 'general' | 'expert' | 'student'
    formality: 'casual' | 'neutral' | 'formal'
    domain: 'general' | 'academic' | 'business' | 'creative'
}

interface GoalsModalProps {
    isOpen: boolean
    onClose: () => void
    initialGoals: Goals
    onSave: (goals: Goals) => void
}

export default function GoalsModal({ isOpen, onClose, initialGoals, onSave }: GoalsModalProps) {
    const [goals, setGoals] = useState<Goals>(initialGoals)

    useEffect(() => {
        setGoals(initialGoals)
    }, [initialGoals, isOpen])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goals-modal-title"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#6B46FF]/10 rounded-lg">
                            <Target className="w-5 h-5 text-[#6B46FF]" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 id="goals-modal-title" className="text-lg font-semibold text-gray-900">Set your goals</h2>
                            <p className="text-xs text-gray-500">Tailor suggestions to your audience</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Domain */}
                    <div className="space-y-3" role="group" aria-labelledby="domain-label">
                        <label id="domain-label" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            Domain
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'general', label: 'General', icon: Users },
                                { id: 'academic', label: 'Academic', icon: GraduationCap },
                                { id: 'business', label: 'Business', icon: Briefcase },
                                { id: 'creative', label: 'Creative', icon: Sparkles },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setGoals({ ...goals, domain: option.id as Goals['domain'] })}
                                    aria-pressed={goals.domain === option.id}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200",
                                        goals.domain === option.id
                                            ? "border-[#6B46FF] bg-[#6B46FF]/5 text-[#6B46FF] shadow-sm ring-1 ring-[#6B46FF]/20"
                                            : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <option.icon className={cn("w-4 h-4", goals.domain === option.id ? "text-[#6B46FF]" : "text-gray-400")} aria-hidden="true" />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Audience */}
                    <div className="space-y-3" role="group" aria-labelledby="audience-label">
                        <label id="audience-label" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            Audience
                        </label>
                        <div className="flex p-1 bg-gray-100 rounded-lg">
                            {['general', 'expert', 'student'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setGoals({ ...goals, audience: option as Goals['audience'] })}
                                    aria-pressed={goals.audience === option}
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                                        goals.audience === option
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Formality */}
                    <div className="space-y-3">
                        <label id="formality-label" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            Formality
                        </label>
                        <div className="relative pt-6 pb-2 px-2">
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="1"
                                value={goals.formality === 'casual' ? 0 : goals.formality === 'neutral' ? 1 : 2}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    const map = ['casual', 'neutral', 'formal'] as const
                                    setGoals({ ...goals, formality: map[val] })
                                }}
                                aria-labelledby="formality-label"
                                aria-valuetext={goals.formality}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6B46FF]"
                            />
                            <div className="flex justify-between mt-2 text-xs font-medium text-gray-500" aria-hidden="true">
                                <span className={cn(goals.formality === 'casual' && "text-[#6B46FF]")}>Casual</span>
                                <span className={cn(goals.formality === 'neutral' && "text-[#6B46FF]")}>Neutral</span>
                                <span className={cn(goals.formality === 'formal' && "text-[#6B46FF]")}>Formal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave(goals)
                            onClose()
                        }}
                        className="px-6 py-2 text-sm font-medium text-white bg-[#6B46FF] hover:bg-[#6B46FF]/90 rounded-lg shadow-lg shadow-[#6B46FF]/20 transition-all active:scale-95"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    )
}
