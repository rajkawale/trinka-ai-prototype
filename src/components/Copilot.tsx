import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, User, ChevronLeft, X, ThumbsUp, ThumbsDown, Copy, RotateCcw, Upload, Mic, Plus, FileText, Sparkles, Type, ChevronDown, EyeOff } from 'lucide-react'
import { cn, trinkaApi } from '../lib/utils'
import RecommendationCard from './RecommendationCard'
import type { Recommendation } from './RecommendationCard'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    intent?: string
    metadata?: string
}

const Copilot = ({ 
    isCompact,
    onToggleCompact,
    hasSelection: _hasSelection,
    onClose,
    docId = 'default-doc',
    defaultShowRecommendations = true
}: { 
    isCompact?: boolean
    onToggleCompact?: () => void
    hasSelection?: boolean
    onClose?: () => void
    docId?: string
    defaultShowRecommendations?: boolean
}) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'streaming'>('idle')
    const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null)
    const [streamingProgress, setStreamingProgress] = useState(0)
    const [_actionHistory, setActionHistory] = useState<Array<{ id: string; action: string; timestamp: string }>>([])
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [selectedModel, setSelectedModel] = useState('GPT-4')
    const [selectedTone, setSelectedTone] = useState('Standard')
    const [showModelSelector, setShowModelSelector] = useState(false)
    const [showToneSelector, setShowToneSelector] = useState(false)
    const [showRecommendations, setShowRecommendations] = useState(defaultShowRecommendations)
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [recommendationsExpanded, setRecommendationsExpanded] = useState(false)
    const [recommendationsLoading, setRecommendationsLoading] = useState(false)
    const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set())
    const [isRecording, setIsRecording] = useState(false)
    const [isVoiceAvailable, setIsVoiceAvailable] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const requestStartTime = useRef<number>(0)
    const modelSelectorRef = useRef<HTMLDivElement>(null)
    const toneSelectorRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Focus composer when Copilot opens
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    // Load recommendations visibility from storage
    useEffect(() => {
        const userId = 'current-user' // TODO: Get from auth context
        const storageKey = `trinka.recsVisible.${userId}.${docId}`
        // Try to load from server first, then local storage
        fetch(trinkaApi(`/api/user-settings?userId=${userId}&docId=${docId}`))
            .then(res => res.json())
            .then(data => {
                if (data.settings?.recommendationsVisible !== undefined) {
                    setShowRecommendations(data.settings.recommendationsVisible)
                } else {
                    const stored = localStorage.getItem(storageKey)
                    if (stored !== null) {
                        setShowRecommendations(stored === 'true')
                    }
                }
            })
            .catch(() => {
                const stored = localStorage.getItem(storageKey)
                if (stored !== null) {
                    setShowRecommendations(stored === 'true')
                }
            })
    }, [docId])


    // Fetch recommendations
    const fetchRecommendations = async (limit = 5, offset = 0) => {
        setRecommendationsLoading(true)
        try {
            const response = await fetch(trinkaApi(`/api/recommendations?docId=${docId}&limit=${limit}&offset=${offset}`))
            if (response.ok) {
                const data = await response.json()
                const filtered = data.items.filter((r: Recommendation) => !dismissedRecommendations.has(r.id))
                setRecommendations(filtered)
            } else {
                throw new Error('Failed to fetch recommendations')
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error)
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('rec.fetch.error', { docId })
            }
        } finally {
            setRecommendationsLoading(false)
        }
    }

    useEffect(() => {
        if (showRecommendations && messages.length === 0) {
            fetchRecommendations(recommendationsExpanded ? 15 : 5)
        }
    }, [showRecommendations, recommendationsExpanded, docId, messages.length])

    const handleShowMore = () => {
        const newExpanded = !recommendationsExpanded
        setRecommendationsExpanded(newExpanded)
        
        if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('rec.showMore', {
                docId,
                requestedCount: newExpanded ? 15 : 5
            })
        }
        
        fetchRecommendations(newExpanded ? 15 : 5)
    }

    const handleApplyRecommendation = async (recommendationId: string) => {
        try {
            const response = await fetch(trinkaApi('/api/recommendations/apply'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user',
                    docId,
                    recommendationId
                })
            })

            if (response.ok) {
                await response.json()
                // Remove from recommendations
                setRecommendations(prev => prev.filter((r: Recommendation) => r.id !== recommendationId))
                
                // Show toast
                const suggestion = recommendations.find((r: Recommendation) => r.id === recommendationId)
                if (suggestion) {
                    // TODO: Show toast "Applied: {title}. Undo"
                    console.log(`Applied: ${suggestion.title}. Undo`)
                }

                // Emit telemetry
                if (typeof window !== 'undefined' && (window as any).analytics) {
                    (window as any).analytics.track('suggestions.apply', {
                        docId,
                        suggestionId: recommendationId,
                        impact: suggestion?.estimatedImpact
                    })
                }
            }
        } catch (error) {
            console.error('Apply failed:', error)
        }
    }

    const handleDismissRecommendation = async (recommendationId: string) => {
        try {
            await fetch(trinkaApi('/api/recommendations/dismiss'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'current-user',
                    docId,
                    recommendationId
                })
            })
            
            setDismissedRecommendations(prev => new Set([...prev, recommendationId]))
            setRecommendations(prev => prev.filter((r: Recommendation) => r.id !== recommendationId))

            // Emit telemetry
            if (typeof window !== 'undefined' && (window as any).analytics) {
                (window as any).analytics.track('suggestions.dismiss', {
                    docId,
                    suggestionId: recommendationId
                })
            }
        } catch (error) {
            console.error('Dismiss failed:', error)
        }
    }

    // Check voice availability
    useEffect(() => {
        try {
            if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
                setIsVoiceAvailable(true)
            }
        } catch (e) {
            setIsVoiceAvailable(false)
        }
    }, [])

    // Close selectors when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
                setShowModelSelector(false)
            }
            if (toneSelectorRef.current && !toneSelectorRef.current.contains(event.target as Node)) {
                setShowToneSelector(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement
            const isInCopilot = activeElement?.closest('.copilot-panel')
            
            if (!isInCopilot) return

            // R toggles Recommended Actions when Copilot has focus
            if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault()
                toggleRecommendations()
            }
            
            // M opens model/tone selector when composer has focus
            if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement
                if (activeElement === inputRef.current) {
                    e.preventDefault()
                    setShowModelSelector(true)
                }
            }
            
            // U opens upload modal
            if ((e.key === 'u' || e.key === 'U') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement
                if (activeElement?.closest('.copilot-panel')) {
                    e.preventDefault()
                    setShowUploadModal(true)
                }
            }
            
            // Enter sends message, Shift+Enter creates newline
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                if (input.trim() && !isLoading) {
                    handleSubmit(e as any)
                }
            }
            if (e.key === 'Escape') {
                setClarifyingQuestion(null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [input, isLoading, showRecommendations])
    
    // Persist recommendations visibility
    const toggleRecommendations = () => {
        const newState = !showRecommendations
        setShowRecommendations(newState)
        
        const userId = 'current-user'
        const storageKey = `trinka.recsVisible.${userId}.${docId}`
        localStorage.setItem(storageKey, String(newState))
        
        // Sync to server
        fetch(trinkaApi('/api/user-settings'), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                docId,
                settings: { recommendationsVisible: newState }
            })
        }).catch(console.error)

        // Emit telemetry
        if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('rec.panel.toggle', {
                docId,
                newState
            })
        }
    }

    const sendPrompt = useCallback(async (prompt: string, meta?: { intent?: string; tone?: string }) => {
        if (!prompt.trim()) return

        const intent = meta?.intent || 'rewrite'
        const tone = meta?.tone || 'academic'

        // Simulate clarifying question for ambiguous prompts
        if (prompt.length < 10 && !meta) {
            setClarifyingQuestion('What would you like me to do?')
            return
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            intent
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)
        setStatus('streaming')
        setStreamingProgress(0)
        setClarifyingQuestion(null)
        requestStartTime.current = Date.now()

        try {
            const response = await fetch(trinkaApi('/chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    intent,
                    tone
                }),
            })

            if (!response.body) return

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            const assistantMessageId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                intent
            }])

            let receivedFirstToken = false
            let tokenCount = 0

            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                if (!receivedFirstToken && chunk.trim().length) {
                    receivedFirstToken = true
                    setStatus('streaming')
                }
                tokenCount += chunk.length
                setStreamingProgress(Math.min(100, (tokenCount / 500) * 100))
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + chunk }
                        : msg
                ))
            }
            setIsLoading(false)
            setStatus('idle')
            setStreamingProgress(0)
            
            // Record action history (saves silently, no popup)
            setActionHistory(prev => {
                const newHistory = [{
                    id: assistantMessageId,
                    action: `${intent}: ${prompt.slice(0, 30)}...`,
                    timestamp: new Date().toLocaleTimeString()
                }, ...prev].slice(0, 5)
                console.log('Action saved to history:', newHistory[0])
                return newHistory
            })
        } catch (error) {
            console.error('Error fetching chat response:', error)
            setIsLoading(false)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I couldn't connect to the server. Please make sure the backend is running."
            }])
            setStatus('idle')
            setStreamingProgress(0)
        }
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return
        const currentInput = input
        setInput('')
        // Hide recommendations when user starts typing
        if (showRecommendations && messages.length === 0) {
            setShowRecommendations(false)
        }
        sendPrompt(currentInput)
    }

    const handleFileUpload = (files: FileList | null) => {
        if (!files) return
        const fileArray = Array.from(files)
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
        const validFiles = fileArray.filter(f => allowedTypes.includes(f.type))
        setUploadedFiles(prev => [...prev, ...validFiles])
    }

    const handleQuickReply = (reply: string) => {
        setClarifyingQuestion(null)
        sendPrompt(reply)
    }

    if (isCompact) {
        return (
            <div className="flex flex-col h-full bg-white border-l border-gray-200 w-12 items-center py-4">
                <button
                    onClick={onToggleCompact}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Expand Copilot"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white copilot-panel">
            {/* Compact Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">Copilot</h2>
                    <div className="flex items-center gap-2">
                        {/* Show/Hide Recommended Actions Toggle */}
                        {showRecommendations ? (
                            <button
                                onClick={toggleRecommendations}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-gray-600 hover:text-gray-800 transition-colors"
                                aria-pressed="true"
                                aria-label="Hide recommendations"
                            >
                                <EyeOff className="w-3.5 h-3.5" />
                                Hide suggestions
                            </button>
                        ) : (
                            <button
                                onClick={toggleRecommendations}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-[#6B46FF] bg-[#6B46FF]/10 hover:bg-[#6B46FF]/20 rounded-full transition-colors"
                                aria-pressed="false"
                                aria-label="Show recommendations"
                            >
                                Recommendations hidden • Show
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                                title="Close chat"
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Streaming Progress Bar */}
                {status === 'streaming' && (
                    <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                        <div 
                            className="h-full bg-[#6B46FF] transition-all duration-300"
                            style={{ width: `${streamingProgress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Recommended Actions - Collapsible */}
                {showRecommendations && messages.length === 0 && !isLoading && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="text-[11px] uppercase tracking-wide text-[#6b6f76] font-medium">
                            Recommended actions
                        </div>
                        {recommendationsLoading ? (
                            <div className="text-center py-4 text-gray-400 text-sm">Loading recommendations...</div>
                        ) : recommendations.length === 0 ? (
                            <div className="p-3 border border-gray-200 rounded-lg">
                                <p className="text-[13px] text-gray-600 mb-2">Recommendations unavailable. Retry</p>
                                <button
                                    onClick={() => fetchRecommendations(recommendationsExpanded ? 15 : 5)}
                                    className="text-[12px] text-[#6B46FF] hover:text-[#6B46FF]/80 font-medium"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    {recommendations.slice(0, recommendationsExpanded ? 15 : 5).map((rec) => (
                                        <RecommendationCard
                                            key={rec.id}
                                            recommendation={rec}
                                            docId={docId}
                                            onApply={handleApplyRecommendation}
                                            onDismiss={handleDismissRecommendation}
                                        />
                                    ))}
                                </div>
                                {recommendations.length > 5 && (
                                    <button
                                        onClick={handleShowMore}
                                        className="text-[12px] text-[#6B46FF] hover:text-[#6B46FF]/80 font-medium transition-colors"
                                    >
                                        {recommendationsExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {messages.length === 0 && !isLoading && !showRecommendations && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">How can I help you rewrite or expand this?</p>
                    </div>
                )}

                {/* Active Chat Messages */}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex gap-2.5 text-[13px] animate-in fade-in group",
                            message.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {message.role === 'user' && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                                <User className="w-3.5 h-3.5" />
                            </div>
                        )}
                        <div className="flex-1 space-y-1">
                            {message.metadata && (
                                <div className="text-[11px] text-[#6b6f76]">{message.metadata}</div>
                            )}
                            <div className={cn(
                                "px-3.5 py-2.5 rounded-xl max-w-[85%] relative",
                                message.role === 'user'
                                    ? "bg-[#6B46FF] text-white rounded-tr-none ml-auto"
                                    : "bg-gray-100 text-gray-800 rounded-tl-none border-l-2 border-[#6B46FF]"
                            )}>
                                {message.content}
                            </div>
                            {/* Action buttons for assistant messages */}
                            {message.role === 'assistant' && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                        title="Thumbs up"
                                        aria-label="Thumbs up"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                        title="Thumbs down"
                                        aria-label="Thumbs down"
                                    >
                                        <ThumbsDown className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                        title="Copy"
                                        aria-label="Copy message"
                                        onClick={() => {
                                            navigator.clipboard.writeText(message.content)
                                        }}
                                    >
                                        <Copy className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                        title="Regenerate"
                                        aria-label="Regenerate response"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Clarifying Question */}
                {clarifyingQuestion && (
                    <div className="space-y-2">
                        <div className="flex gap-2.5 text-[13px]">
                            <div className="flex-1">
                                <div className="px-3.5 py-2.5 rounded-xl rounded-tl-none bg-gray-100 text-gray-800 border-l-2 border-[#6B46FF]">
                                    {clarifyingQuestion}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['Summarize section?', 'Rewrite academically?', 'Fix tone only?'].map((reply) => (
                                <button
                                    key={reply}
                                    onClick={() => handleQuickReply(reply)}
                                    className="px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    aria-label={reply}
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex gap-2.5 text-[13px]">
                        <div className="bg-gray-100 px-3.5 py-2.5 rounded-xl rounded-tl-none border-l-2 border-[#6B46FF]">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Empty Suggestion Strip Container - 40px height */}
            <div 
                className="suggestion-strip-empty h-10 border-t border-gray-100 bg-white"
                aria-hidden="true"
                tabIndex={-1}
            />

            {/* Composer Bar - Sticky to bottom */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <form onSubmit={handleSubmit} className="relative flex items-center gap-2 mb-2">
                    {/* Upload Button */}
                    <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 flex-shrink-0"
                        title="Upload file (U)"
                        aria-label="Upload file"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    {/* Input Box */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value)
                            // Hide recommendations when user starts typing
                            if (e.target.value.trim() && showRecommendations && messages.length === 0) {
                                setShowRecommendations(false)
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                                e.preventDefault()
                                if (input.trim() && !isLoading) {
                                    handleSubmit(e as any)
                                }
                            }
                        }}
                        placeholder="Message Copilot or @ mention a tab"
                        className="flex-1 pl-3.5 pr-20 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/20 focus:border-[#6B46FF] transition-all text-[13px]"
                        aria-label="Chat input"
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-12 p-1.5 text-gray-400 hover:text-[#6B46FF] disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                        title="Send (Ctrl/Cmd + Enter)"
                        aria-label="Send message"
                    >
                        <Send className="w-4 h-4" />
                    </button>

                    {/* Mic Button */}
                    <button
                        type="button"
                        onMouseDown={() => {
                            if (isVoiceAvailable) {
                                setIsRecording(true)
                            }
                        }}
                        onMouseUp={() => setIsRecording(false)}
                        onMouseLeave={() => setIsRecording(false)}
                        disabled={!isVoiceAvailable}
                        className={cn(
                            "absolute right-2 p-1.5 rounded-lg transition-colors",
                            isRecording ? "bg-red-500 text-white" : "text-gray-400 hover:text-gray-600",
                            !isVoiceAvailable && "opacity-50 cursor-not-allowed"
                        )}
                        title={isVoiceAvailable ? (isRecording ? "Recording..." : "Hold to talk") : "Enable microphone in Settings"}
                        aria-label="Voice record"
                    >
                        <Mic className="w-4 h-4" />
                    </button>
                </form>

                {/* Model and Tone Pills - Below Composer */}
                <div className="flex items-center gap-2">
                    {/* Model Pill */}
                    <div className="relative" ref={modelSelectorRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowModelSelector(!showModelSelector)
                                setShowToneSelector(false)
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[12px] font-medium text-gray-700 transition-colors"
                            title="Select model (M)"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#6B46FF]" />
                            <span>{selectedModel}</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showModelSelector && (
                            <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
                                {['GPT-4', 'GPT-3.5', 'Claude', 'Gemini'].map(model => (
                                    <button
                                        key={model}
                                        type="button"
                                        onClick={() => {
                                            setSelectedModel(model)
                                            setShowModelSelector(false)
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded",
                                            selectedModel === model && "bg-[#6B46FF]/10 text-[#6B46FF]"
                                        )}
                                    >
                                        {model}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tone Pill */}
                    <div className="relative" ref={toneSelectorRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowToneSelector(!showToneSelector)
                                setShowModelSelector(false)
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[12px] font-medium text-gray-700 transition-all",
                                selectedTone !== 'Standard' && "animate-pulse"
                            )}
                            title="Select tone (M)"
                        >
                            <Type className="w-3.5 h-3.5 text-[#6B46FF]" />
                            <span>{selectedTone}</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showToneSelector && (
                            <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
                                {['Standard', 'Academic', 'Formal', 'Concise', 'Simple'].map(tone => (
                                    <button
                                        key={tone}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTone(tone)
                                            setShowToneSelector(false)
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded",
                                            selectedTone === tone && "bg-[#6B46FF]/10 text-[#6B46FF]"
                                        )}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Upload Files</h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6B46FF] transition-colors cursor-pointer"
                            onDrop={(e) => {
                                e.preventDefault()
                                handleFileUpload(e.dataTransfer.files)
                            }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">Drag and drop files here</p>
                            <p className="text-sm text-gray-400 mb-4">or</p>
                            <label className="inline-block px-4 py-2 bg-[#6B46FF] text-white rounded-lg cursor-pointer hover:bg-[#6B46FF]/90 transition-colors">
                                Browse Files
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.pptx"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />
                            </label>
                            <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG, PDF, DOCX, PPTX</p>
                        </div>
                        {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700">{file.name}</span>
                                            <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <button
                                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Copilot
