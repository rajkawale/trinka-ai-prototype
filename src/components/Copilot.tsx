import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, User, ChevronRight, X, ThumbsUp, ThumbsDown, Copy, RotateCcw, Plus, Mic, FileText, Sparkles, Type, ChevronDown, EyeOff, Loader2, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import RecommendationCard from './RecommendationCard'
import type { Recommendation } from './RecommendationCard'
import { groupRecommendations, getTopRecommendations, type RecommendationGroupType } from '../utils/groupRecommendations'
import AllSuggestionsModal from './AllSuggestionsModal'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    intent?: string
    metadata?: string
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
    {
        id: 'mock-1',
        title: 'Improve clarity',
        summary: 'Simplify sentence structure for better readability.',
        fullText: 'Consider breaking this long sentence into two for better readability.',
        originalText: '...',
        actionType: 'rewrite',
        estimatedImpact: 'high',
        range: { from: 0, to: 0 }
    },
    {
        id: 'mock-2',
        title: 'Fix tone',
        summary: 'Change "kids" to "children" for academic tone.',
        fullText: 'Change "kids" to "children" to maintain a formal academic tone.',
        originalText: 'kids',
        actionType: 'tone',
        estimatedImpact: 'medium',
        range: { from: 0, to: 0 }
    },
    {
        id: 'mock-3',
        title: 'Fix grammar',
        summary: 'Correct subject-verb agreement.',
        fullText: 'The data suggests (not suggest) that the hypothesis is valid.',
        originalText: 'suggest',
        actionType: 'rewrite',
        estimatedImpact: 'high',
        range: { from: 0, to: 0 }
    }
]

const Copilot = ({
    isCompact,
    onToggleCompact,
    hasSelection: _hasSelection,
    onClose: _onClose,
    defaultShowRecommendations = true,
    isPrivacyMode = false,
    initialQuery = '',
    initialMessage,
    onMessageHandled,
    onInsertText
}: {
    isCompact?: boolean
    onToggleCompact?: () => void
    hasSelection?: boolean
    onClose?: () => void
    docId?: string
    defaultShowRecommendations?: boolean
    isPrivacyMode?: boolean
    initialQuery?: string
    initialMessage?: string | null
    onMessageHandled?: () => void
    onInsertText?: (text: string) => void
}) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState(initialQuery || initialMessage || '')

    // Store onMessageHandled in a ref to avoid dependency issues
    const onMessageHandledRef = useRef(onMessageHandled)
    useEffect(() => {
        console.log('[Copilot] onMessageHandledRef updated', { hasCallback: !!onMessageHandled })
        onMessageHandledRef.current = onMessageHandled
    }, [onMessageHandled])

    // Update input when initialQuery or initialMessage changes
    useEffect(() => {
        console.log('[Copilot] useEffect for input update triggered', { initialMessage, initialQuery })
        if (initialMessage) {
            console.log('[Copilot] Setting input from initialMessage:', initialMessage)
            setInput(initialMessage)
            // Optional: Auto-send if it's a direct command
            if (onMessageHandledRef.current) {
                console.log('[Copilot] Calling onMessageHandledRef.current()')
                onMessageHandledRef.current()
            }
        } else if (initialQuery) {
            console.log('[Copilot] Setting input from initialQuery:', initialQuery)
            setInput(initialQuery)
        }
    }, [initialQuery, initialMessage])

    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'streaming'>('idle')
    const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [selectedModel, setSelectedModel] = useState('GPT-4')
    const [selectedTone, setSelectedTone] = useState('Standard')
    const [showModelSelector, setShowModelSelector] = useState(false)
    const [showToneSelector, setShowToneSelector] = useState(false)
    const [recommendations, setRecommendations] = useState<Recommendation[]>(defaultShowRecommendations ? MOCK_RECOMMENDATIONS : [])
    const [expandedGroups, setExpandedGroups] = useState<Set<RecommendationGroupType>>(new Set())
    const [showAllSuggestionsModal, setShowAllSuggestionsModal] = useState(false)
    
    // Get top 3 recommendations
    const topRecommendations = useMemo(() => getTopRecommendations(recommendations, 3), [recommendations])
    
    // Get top recommendation IDs to exclude from grouped view
    const topRecommendationIds = useMemo(() => 
        new Set(topRecommendations.map(r => r.id)), 
        [topRecommendations]
    )
    
    // Group remaining recommendations (excluding top 3)
    const remainingRecommendations = useMemo(() => 
        recommendations.filter(r => !topRecommendationIds.has(r.id)),
        [recommendations, topRecommendationIds]
    )
    
    const groupedRecommendations = useMemo(() => 
        groupRecommendations(remainingRecommendations), 
        [remainingRecommendations]
    )
    
    const toggleGroup = (groupType: RecommendationGroupType) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupType)) {
                next.delete(groupType)
            } else {
                next.add(groupType)
            }
            return next
        })
    }

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, status])

    // Load recommendations
    useEffect(() => {
        if (defaultShowRecommendations) {
            setRecommendations(MOCK_RECOMMENDATIONS)
        }
    }, [defaultShowRecommendations])

    const handleSend = async () => {
        if (!input.trim() && uploadedFiles.length === 0) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            metadata: uploadedFiles.length > 0 ? `Attached: ${uploadedFiles.map(f => f.name).join(', ')}` : undefined
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setUploadedFiles([])
        setIsLoading(true)
        setStatus('streaming')

        // Simulate streaming response
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800))

            const responseId = (Date.now() + 1).toString()
            let responseContent = ''
            const fullResponse = "I can certainly help you with that. Based on your document's context, here is a revised version that improves flow and clarity."

            // Stream characters
            const chars = fullResponse.split('')
            setMessages(prev => [...prev, { id: responseId, role: 'assistant', content: '' }])

            for (let i = 0; i < chars.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 15)) // Typing effect
                responseContent += chars[i]
                setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: responseContent } : m))
            }

            setStatus('idle')
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again."
            }])
        } finally {
            setIsLoading(false)
            setStatus('idle')
        }
    }

    const handleFileUpload = (files: FileList | null) => {
        if (!files) return
        const newFiles = Array.from(files)
        setUploadedFiles(prev => [...prev, ...newFiles])
    }

    const [applyingBatch, setApplyingBatch] = useState<string | null>(null)
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)

    const handleRecommendationApply = (id: string, text: string) => {
        // In a real app, this would apply to the editor
        console.log('Applying recommendation:', id, text)
        setRecommendations(prev => prev.filter(r => r.id !== id))

        // Add system message confirming action
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Applied change: "${text}"`
        }])
        
        // If using onInsertText, apply to editor
        if (onInsertText) {
            onInsertText(text)
        }
    }

    const handleBatchApply = async (groupType: RecommendationGroupType) => {
        const group = groupedRecommendations.find(g => g.type === groupType)
        if (!group || group.recommendations.length === 0) return

        setApplyingBatch(groupType)
        setBatchProgress({ current: 0, total: group.recommendations.length })

        // Apply recommendations one by one with a small delay
        for (let i = 0; i < group.recommendations.length; i++) {
            const rec = group.recommendations[i]
            const text = rec.replacementText || rec.fullText
            
            // Apply each recommendation
            handleRecommendationApply(rec.id, text)
            
            // Update progress
            setBatchProgress({ current: i + 1, total: group.recommendations.length })
            
            // Small delay between applications for smooth UX
            if (i < group.recommendations.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200))
            }
        }

        // Complete
        setBatchProgress(null)
        setApplyingBatch(null)
        
        // Show completion message
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Applied all ${group.recommendations.length} ${groupType.toLowerCase()} suggestions.`
        }])
    }

    const handleRecommendationDismiss = (id: string) => {
        setRecommendations(prev => prev.filter(r => r.id !== id))
    }

    return (
        <div className={cn(
            "flex flex-col h-full bg-white relative",
            isCompact ? "p-2" : "p-0"
        )}>
            {/* Header - Sticky */}
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] rounded-lg flex items-center justify-center shadow-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800 text-sm">Trinka AI</h2>
                        {status === 'streaming' && (
                            <span className="text-[10px] text-gray-500 font-medium">Thinking...</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {isPrivacyMode && (
                        <div className="mr-2 px-2 py-0.5 bg-gray-100 rounded-full flex items-center gap-1 text-[10px] text-gray-600" title="Privacy Mode On">
                            <EyeOff className="w-3 h-3" />
                            <span>Private</span>
                        </div>
                    )}
                    {onToggleCompact && (
                        <button
                            onClick={onToggleCompact}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Collapse"
                            aria-label="Collapse Trinka AI"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {/* Welcome State */}
                {messages.length === 0 && recommendations.length === 0 && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-[#6C2BD9]" />
                        </div>
                        <h3 className="text-gray-900 font-medium">How can I help you today?</h3>
                        <p className="text-sm text-gray-500 max-w-[240px] mx-auto">
                            I can help you write, edit, and improve your document. Try asking me to:
                        </p>
                        <div className="grid grid-cols-1 gap-2 max-w-[260px] mx-auto">
                            <button onClick={() => setInput("Summarize this document")} className="text-xs text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                📝 Summarize this document
                            </button>
                            <button onClick={() => setInput("Fix grammar and tone")} className="text-xs text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                ✨ Fix grammar and tone
                            </button>
                            <button onClick={() => setInput("Make it more academic")} className="text-xs text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                🎓 Make it more academic
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Suggestions Button - Opens in Center Modal */}
                {recommendations.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-gray-100">
                        <button
                            onClick={() => setShowAllSuggestionsModal(true)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#6C2BD9]/10 to-[#8B5CF6]/10 hover:from-[#6C2BD9]/20 hover:to-[#8B5CF6]/20 rounded-lg border border-[#6C2BD9]/20 transition-all group"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#6C2BD9]" />
                                <span className="text-sm font-semibold text-gray-900">
                                    Top Suggestions ({recommendations.length})
                                </span>
                            </div>
                            <span className="text-xs font-medium text-[#6C2BD9] group-hover:text-[#5A27C2] transition-colors">
                                See More →
                            </span>
                        </button>
                    </div>
                )}

                {/* Grouped Recommendations */}
                {groupedRecommendations.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider px-1 mb-2">
                            <Sparkles className="w-3 h-3 text-[#6C2BD9]" />
                            All Suggestions by Category
                        </div>
                        {groupedRecommendations.map(group => {
                            const isExpanded = expandedGroups.has(group.type)
                            const displayRecs = isExpanded ? group.recommendations : group.recommendations.slice(0, 1)
                            const hasMore = group.recommendations.length > 1

                            return (
                                <div key={group.type} className="space-y-2 pb-3 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={() => toggleGroup(group.type)}
                                            className="flex-1 flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{group.type}</span>
                                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {group.count}
                                                </span>
                                            </div>
                                            {hasMore && (
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                        
                                        {/* Batch Apply Button */}
                                        {group.count > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleBatchApply(group.type)
                                                }}
                                                disabled={applyingBatch === group.type}
                                                className={cn(
                                                    "px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
                                                    applyingBatch === group.type
                                                        ? "bg-[#6C2BD9]/20 text-[#6C2BD9] cursor-not-allowed"
                                                        : "bg-[#6C2BD9] text-white hover:bg-[#5A27C2]"
                                                )}
                                            >
                                                {applyingBatch === group.type ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        {batchProgress && (
                                                            <span>{batchProgress.current}/{batchProgress.total}</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-3 h-3" />
                                                        Apply All ({group.count})
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {group.count > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    // Ignore all recommendations of this type
                                                    const idsToIgnore = group.recommendations.map(r => r.id)
                                                    setRecommendations(prev => prev.filter(r => !idsToIgnore.includes(r.id)))
                                                }}
                                                className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                title={`Ignore all ${group.type.toLowerCase()} suggestions`}
                                            >
                                                Ignore All
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    {applyingBatch === group.type && batchProgress && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-[#6C2BD9] h-full transition-all duration-300 ease-out"
                                                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2 pl-1">
                                        {displayRecs.map(rec => (
                                            <RecommendationCard
                                                key={rec.id}
                                                recommendation={rec}
                                                onApply={(id, text) => handleRecommendationApply(id, text)}
                                                onDismiss={handleRecommendationDismiss}
                                            />
                                        ))}
                                        
                                        {!isExpanded && hasMore && (
                                            <button
                                                onClick={() => toggleGroup(group.type)}
                                                className="w-full text-xs text-[#6C2BD9] font-medium hover:text-[#5A27C2] px-3 py-2 hover:bg-[#6C2BD9]/5 rounded-lg transition-colors"
                                            >
                                                View all {group.count} {group.type.toLowerCase()} suggestions →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Chat Messages */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                            msg.role === 'user' ? "bg-gray-900" : "bg-[#6C2BD9]"
                        )}>
                            {msg.role === 'user' ? (
                                <User className="w-4 h-4 text-white" />
                            ) : (
                                <Sparkles className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? "bg-gray-900 text-white rounded-tr-none"
                                : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
                        )}>
                            {msg.metadata && (
                                <div className="mb-2 pb-2 border-b border-white/10 text-xs opacity-70 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {msg.metadata}
                                </div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.content}</div>

                            {/* Assistant Actions */}
                            {msg.role === 'assistant' && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                                    <button
                                        className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Copy"
                                        onClick={() => {
                                            navigator.clipboard.writeText(msg.content)
                                            // TODO: Show toast
                                        }}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600 transition-colors" title="Regenerate">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="h-3 w-px bg-gray-200 mx-1" />
                                    <button className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-green-600 transition-colors">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-red-600 transition-colors">
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                    {onInsertText && (
                                        <button
                                            onClick={() => onInsertText(msg.content)}
                                            className="ml-auto flex items-center gap-1 text-xs font-medium text-[#6C2BD9] hover:bg-[#6C2BD9]/5 px-2 py-1 rounded transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Insert
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Clarifying Question */}
                {clarifyingQuestion && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in">
                        <p className="text-sm text-blue-800 font-medium mb-2">I need a bit more context:</p>
                        <p className="text-sm text-blue-700 mb-3">{clarifyingQuestion}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setInput("Yes, keep it formal")
                                    setClarifyingQuestion(null)
                                }}
                                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                Yes, keep it formal
                            </button>
                            <button
                                onClick={() => {
                                    setInput("No, make it casual")
                                    setClarifyingQuestion(null)
                                }}
                                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                No, make it casual
                            </button>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                {/* File Upload Preview */}
                {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {uploadedFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-700">
                                <FileText className="w-3 h-3 text-gray-500" />
                                <span className="max-w-[100px] truncate">{file.name}</span>
                                <button
                                    onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    className="hover:text-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#6C2BD9]/20 focus-within:border-[#6C2BD9] transition-all">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                        title="Attach file"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                    />

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Ask Trinka to write, edit, or explain..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-sm text-gray-800 placeholder:text-gray-400"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />

                    {input.trim() || uploadedFiles.length > 0 ? (
                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="p-2 bg-[#6C2BD9] hover:bg-[#5a37e6] text-white rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    ) : (
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Model, Tone, Style Selectors - Below Chat Bar */}
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowModelSelector(!showModelSelector)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md text-xs font-medium text-gray-600 transition-colors whitespace-nowrap"
                            >
                                <Sparkles className="w-3 h-3" />
                                {selectedModel}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            {showModelSelector && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                                    {['GPT-4', 'Claude 3', 'Trinka Pro'].map(model => (
                                        <button
                                            key={model}
                                            onClick={() => {
                                                setSelectedModel(model)
                                                setShowModelSelector(false)
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-3 w-px bg-gray-200" />

                        <div className="relative">
                            <button
                                onClick={() => setShowToneSelector(!showToneSelector)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md text-xs font-medium text-gray-600 transition-colors whitespace-nowrap"
                            >
                                <Type className="w-3 h-3 text-gray-500" />
                                {selectedTone}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                            {showToneSelector && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                                    {['Standard', 'Academic', 'Creative', 'Professional'].map(tone => (
                                        <button
                                            key={tone}
                                            onClick={() => {
                                                setSelectedTone(tone)
                                                setShowToneSelector(false)
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 opacity-70 text-center">AI can make mistakes. Please review generated content.</p>
                </div>
            </div>

            {/* All Suggestions Modal */}
            <AllSuggestionsModal
                isOpen={showAllSuggestionsModal}
                onClose={() => setShowAllSuggestionsModal(false)}
                recommendations={recommendations}
                onApply={handleRecommendationApply}
                onIgnore={handleRecommendationDismiss}
                onAddToDictionary={(id) => {
                    // Add to dictionary functionality
                    console.log('Added to dictionary:', id)
                    setRecommendations(prev => prev.filter(r => r.id !== id))
                }}
            />
        </div>
    )
}

export default Copilot
