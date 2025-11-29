import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, User, ChevronLeft, X, ThumbsUp, ThumbsDown, Copy, RotateCcw, Upload, Mic, Plus, FileText, Sparkles, Type, ChevronDown, EyeOff } from 'lucide-react'
import { cn, getTrinkaApi } from '../lib/utils'
import RecommendationCard from './RecommendationCard'
import type { Recommendation } from './RecommendationCard'

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
    onClose,
    docId = 'default-doc',
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

    // Update input when initialQuery or initialMessage changes
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage)
            // Optional: Auto-send if it's a direct command
            if (onMessageHandled) onMessageHandled()
        } else if (initialQuery) {
            setInput(initialQuery)
        }
    }, [initialQuery, initialMessage, onMessageHandled])

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
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])

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
        setStreamingProgress(0)

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
                setStreamingProgress(Math.round((i / chars.length) * 100))
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
    }

    const handleRecommendationDismiss = (id: string) => {
        setRecommendations(prev => prev.filter(r => r.id !== id))
    }

    return (
        <div className={cn(
            "flex flex-col h-full bg-white relative",
            isCompact ? "p-2" : "p-0"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] rounded-lg flex items-center justify-center shadow-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800 text-sm">Trinka Copilot</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-gray-500 font-medium">
                                {status === 'streaming' ? 'Thinking...' : 'Online'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {isPrivacyMode && (
                        <div className="mr-2 px-2 py-0.5 bg-gray-100 rounded-full flex items-center gap-1 text-[10px] text-gray-600" title="Privacy Mode On">
                            <EyeOff className="w-3 h-3" />
                            <span>Private</span>
                        </div>
                    )}
                    <button
                        onClick={onToggleCompact}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {isCompact ? <ChevronLeft className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 rotate-180" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
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

                {/* Recommendations Stream */}
                {recommendations.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
                            <Sparkles className="w-3 h-3" />
                            Suggested Improvements
                        </div>
                        {recommendations.map(rec => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                onApply={(id, text) => handleRecommendationApply(id, text)}
                                onDismiss={handleRecommendationDismiss}
                            />
                        ))}
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
                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowModelSelector(!showModelSelector)}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                        >
                            <Sparkles className="w-3 h-3 text-[#6C2BD9]" />
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
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 transition-colors"
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

                <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#6C2BD9]/20 focus-within:border-[#6C2BD9] transition-all">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                        title="Attach file"
                    >
                        <Upload className="w-5 h-5" />
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
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">AI can make mistakes. Please review generated content.</p>
                </div>
            </div>
        </div>
    )
}

export default Copilot
