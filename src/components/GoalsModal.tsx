import { useState, useEffect } from 'react'
import { X, Target, Briefcase, GraduationCap, Users, Sparkles, Zap, BookOpen, MessageCircle } from 'lucide-react'
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

    const handleSave = () => {
        onSave(goals)
        onClose()
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Target className="w-5 h-5 text-[#6C2BD9]" />
                            Writing Goals
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Customize Trinka's feedback to match your intent.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">

                    {/* Domain Section */}
                    <section className="space-y-4">
                        <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            Domain
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'general', label: 'General', icon: Zap, desc: 'Everyday communication' },
                                { id: 'business', label: 'Business', icon: Briefcase, desc: 'Professional & clear' },
                                { id: 'academic', label: 'Academic', icon: GraduationCap, desc: 'Scholarly & precise' },
                                { id: 'creative', label: 'Creative', icon: Sparkles, desc: 'Expressive & engaging' },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setGoals({ ...goals, domain: option.id as Goals['domain'] })}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md",
                                        goals.domain === option.id
                                            ? "border-[#6C2BD9] bg-[#6C2BD9]/5 ring-1 ring-[#6C2BD9]/20"
                                            : "border-gray-100 hover:border-[#6C2BD9]/30 hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-lg shrink-0",
                                        goals.domain === option.id ? "bg-[#6C2BD9] text-white" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <option.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className={cn("font-semibold", goals.domain === option.id ? "text-[#6C2BD9]" : "text-gray-900")}>
                                            {option.label}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Audience Section */}
                        <section className="space-y-4">
                            <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                Audience
                            </label>
                            <div className="space-y-2">
                                {[
                                    { id: 'general', label: 'General Audience', icon: Users },
                                    { id: 'expert', label: 'Experts', icon: BookOpen },
                                    { id: 'student', label: 'Students', icon: GraduationCap },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setGoals({ ...goals, audience: option.id as Goals['audience'] })}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                                            goals.audience === option.id
                                                ? "border-[#6C2BD9] bg-[#6C2BD9]/5 text-[#6C2BD9]"
                                                : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <option.icon className={cn("w-4 h-4", goals.audience === option.id ? "text-[#6C2BD9]" : "text-gray-400")} />
                                            <span className="font-medium text-sm">{option.label}</span>
                                        </div>
                                        {goals.audience === option.id && <div className="w-2 h-2 rounded-full bg-[#6C2BD9]" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Formality Section */}
                        <section className="space-y-4">
                            <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                Formality
                            </label>
                            <div className="space-y-2">
                                {[
                                    { id: 'casual', label: 'Casual', desc: 'Relaxed tone' },
                                    { id: 'neutral', label: 'Neutral', desc: 'Standard tone' },
                                    { id: 'formal', label: 'Formal', desc: 'Professional tone' },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setGoals({ ...goals, formality: option.id as Goals['formality'] })}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                                            goals.formality === option.id
                                                ? "border-[#6C2BD9] bg-[#6C2BD9]/5 text-[#6C2BD9]"
                                                : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <span className="font-medium text-sm">{option.label}</span>
                                        <span className="text-xs text-gray-400">{option.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#6C2BD9] hover:bg-[#5835FF] shadow-lg shadow-[#6C2BD9]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Save Goals
                    </button>
                </div>
            </div>
        </div>
    )
}
