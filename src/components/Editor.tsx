import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { GrammarToneExtension } from '../extensions/GrammarToneExtension'
import type { GrammarToneIssue } from '../extensions/GrammarToneExtension'
import DocumentHealthTopSuggestionRow from './DocumentHealthTopSuggestionRow'
import SuggestionsModal from './SuggestionsModal'
import type { Recommendation } from './RecommendationCard'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Sparkles,
    BookMarked,
    Check,
    X,
    AlertTriangle,
    Loader2,
    History,
    Undo2,
    Type,
    Table,
    FileText,
    Quote,
    ChevronDown,
    ChevronLeft,
    Gauge,
    Clock,
    Upload
} from 'lucide-react'
import { cn } from '../lib/utils'

type OutlineItem = {
    id: string
    label: string
    level: number
    position: number
}

type QualitySignal = {
    label: string
    value: string
    status: 'success' | 'warning' | 'info'
}

type PreviewState = {
    id: string
    label: string
    intent: string
    status: 'loading' | 'ready' | 'error'
    original: string
    suggestion: string
    range: { from: number; to: number }
    changedTokens?: { from: number; to: number }[]
}

type AiAction = {
    id: string
    label: string
    description: string
    mode: string
    tone: string
    icon?: any
}

type VersionSnapshot = {
    id: string
    timestamp: string
    action: string
    delta: string
}

const INLINE_ACTIONS: AiAction[] = [
    { id: 'rewrite', label: 'Rewrite', description: 'Sharper + academic safe', mode: 'rewrite', tone: 'academic' },
    { id: 'clarify', label: 'Clarify', description: 'Explain dense phrasing', mode: 'clarify', tone: 'academic' },
    { id: 'summarize', label: 'Summarize', description: '3-line digest', mode: 'summarize', tone: 'neutral' },
    { id: 'expand', label: 'Expand', description: 'Add support', mode: 'expand', tone: 'academic' },
    { id: 'tone', label: 'Tone Fix', description: 'Formal register', mode: 'tone', tone: 'formal' }
]


const createRequestId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `${Date.now()}`
}

const Editor = () => {
    const [outline, setOutline] = useState<OutlineItem[]>([])
    const [qualitySignals, setQualitySignals] = useState<QualitySignal[]>([
        { label: 'Tone', value: 'Stable', status: 'success' },
        { label: 'Clarity', value: 'Crisp', status: 'success' },
        { label: 'Structure', value: '2 headings', status: 'info' },
        { label: 'Coherence Score', value: 'High', status: 'success' },
        { label: 'Readability', value: 'Good', status: 'success' },
        { label: 'Academic Integrity', value: 'Safe', status: 'success' },
    ])
    const [isHealthCollapsed, setIsHealthCollapsed] = useState(false)
    const [hoverPreviewPosition, setHoverPreviewPosition] = useState<{ left: number; top: number } | null>(null)
    const healthButtonRef = useRef<HTMLButtonElement>(null)
    const [wordCount, setWordCount] = useState(0)
    const [readTime, setReadTime] = useState('0 min')
    const [revisionCount, setRevisionCount] = useState(0)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [preview, setPreview] = useState<PreviewState | null>(null)
    const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
    const [topSuggestions, setTopSuggestions] = useState<Recommendation[]>([])
    const [versions, setVersions] = useState<VersionSnapshot[]>([])
    const [showVersionTimeline, setShowVersionTimeline] = useState(false)
    const [fontSize, setFontSize] = useState(16)
    const [showFontMenu, setShowFontMenu] = useState(false)
    const [showParagraphMenu, setShowParagraphMenu] = useState(false)
    const [grammarToneIssues, setGrammarToneIssues] = useState<GrammarToneIssue[]>([])
    const [hoveredIssue, setHoveredIssue] = useState<{ issue: GrammarToneIssue; element: HTMLElement } | null>(null)
    const editorRef = useRef<HTMLDivElement>(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            BubbleMenuExtension,
            GrammarToneExtension.configure({
                issues: grammarToneIssues,
            }),
        ],
        content: `
      <h2>Academic Writing Sample</h2>
      <p>
        The rapid evolution of artificial intelligence has significantly impacted various sectors, including healthcare, finance, and education. 
        However, the integration of AI tools in academic writing poses unique challenges concerning integrity and originality.
      </p>
      <p>
        Researchers must navigate the fine line between assistance and automation. While AI can enhance clarity and grammar, 
        reliance on it for content generation remains a contentious issue.
      </p>
    `,
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] p-10 bg-gradient-to-br from-gray-50/30 to-white',
            },
        },
        onSelectionUpdate: () => {
            // Selection tracking removed - no longer needed for Quick Actions
        },
    })

    useEffect(() => {
        if (!editor) return

        const updateMeta = () => {
            const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
            const words = plainText.trim().split(/\s+/).filter(Boolean).length

            const nodes: OutlineItem[] = []
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    nodes.push({
                        id: `${node.textContent}-${pos}`,
                        label: node.textContent || 'Untitled section',
                        level: node.attrs.level ?? 2,
                        position: pos
                    })
                }
            })
            setOutline(nodes)

            // Calculate metrics
            const toneStatus = words % 3 ? 'Stable' : (words % 5 ? 'Neutral' : 'Aggressive')
            const clarityStatus = words > 120 ? 'Needs Work' : 'Crisp'
            const coherenceStatus = words > 200 ? (words % 2 ? 'High' : 'Medium') : 'High'
            const readabilityStatus = words > 150 ? 'Hard' : (words < 50 ? 'Easy' : 'Good')
            const integrityStatus = words % 7 ? 'Safe' : 'Review Required'

            setWordCount(words)
            const readingTimeMinutes = Math.ceil(words / 200) // 200 wpm default
            setReadTime(`${readingTimeMinutes} min`)

            setQualitySignals([
                { label: 'Tone', value: toneStatus, status: toneStatus === 'Stable' ? 'success' : (toneStatus === 'Neutral' ? 'info' : 'warning') },
                { label: 'Clarity', value: clarityStatus, status: clarityStatus === 'Crisp' ? 'success' : 'warning' },
                { label: 'Structure', value: `${nodes.length || 1} headings`, status: 'info' },
                { label: 'Coherence Score', value: coherenceStatus, status: coherenceStatus === 'High' ? 'success' : (coherenceStatus === 'Medium' ? 'info' : 'warning') },
                { label: 'Readability', value: readabilityStatus, status: readabilityStatus === 'Good' ? 'success' : (readabilityStatus === 'Easy' ? 'info' : 'warning') },
                { label: 'Academic Integrity', value: integrityStatus, status: integrityStatus === 'Safe' ? 'success' : 'warning' },
            ])
        }

        editor.on('create', updateMeta)
        editor.on('update', updateMeta)

        // Simulate grammar/tone issues for demo
        const simulateIssues = () => {
            const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
            const issues: GrammarToneIssue[] = []
            
            // Find "has significantly" - grammar issue
            const grammarMatch = plainText.indexOf('has significantly')
            if (grammarMatch !== -1) {
                issues.push({
                    from: grammarMatch,
                    to: grammarMatch + 'has significantly'.length,
                    type: 'grammar',
                    message: 'Consider using "significantly has" or rephrase',
                    suggestion: 'has had a significant impact'
                })
            }
            
            // Find "content generation" - tone issue
            const toneMatch = plainText.indexOf('content generation')
            if (toneMatch !== -1) {
                issues.push({
                    from: toneMatch,
                    to: toneMatch + 'content generation'.length,
                    type: 'tone',
                    message: 'Consider more formal phrasing',
                    suggestion: 'textual composition'
                })
            }
            
            // Find "AI can enhance" - AI suggestion
            const aiMatch = plainText.indexOf('AI can enhance')
            if (aiMatch !== -1) {
                issues.push({
                    from: aiMatch,
                    to: aiMatch + 'AI can enhance'.length,
                    type: 'ai-suggestion',
                    message: 'AI can improve clarity and grammatical precision',
                    suggestion: 'AI can improve'
                })
            }
            
            setGrammarToneIssues(issues)
        }

        simulateIssues()
        editor.on('update', simulateIssues)

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // D key toggles Document health
            if (e.key === 'd' || e.key === 'D') {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault()
                    setIsHealthCollapsed(!isHealthCollapsed)
                }
            }
            // M key opens model/tone selector (moved to Settings)
            // U key opens upload
            if (e.key === 'u' || e.key === 'U') {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault()
                    setShowUploadModal(true)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        
        return () => {
            if (editor) {
                editor.off('create', updateMeta)
                editor.off('update', updateMeta)
                editor.off('update', simulateIssues)
            }
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [editor, isHealthCollapsed])

    // Update extension when issues change
    useEffect(() => {
        if (!editor) return
        const extension = editor.extensionManager.extensions.find(ext => ext.name === 'grammarTone')
        if (extension) {
            extension.options.issues = grammarToneIssues
            editor.view.dispatch(editor.state.tr)
        }
    }, [editor, grammarToneIssues])

    // Handle hover on grammar/tone underlines
    useEffect(() => {
        if (!editor) return

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('grammar-tone-underline')) {
                const type = target.getAttribute('data-type')
                const message = target.getAttribute('data-message') || ''
                const suggestion = target.getAttribute('data-suggestion') || ''
                
                const issue: GrammarToneIssue = {
                    from: 0,
                    to: 0,
                    type: type as 'grammar' | 'tone' | 'ai-suggestion',
                    message,
                    suggestion
                }
                
                setHoveredIssue({ issue, element: target })
            }
        }

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('grammar-tone-underline')) {
                setTimeout(() => setHoveredIssue(null), 100)
            }
        }

        const editorElement = editor.view.dom
        editorElement.addEventListener('mouseover', handleMouseOver)
        editorElement.addEventListener('mouseout', handleMouseOut)

        return () => {
            editorElement.removeEventListener('mouseover', handleMouseOver)
            editorElement.removeEventListener('mouseout', handleMouseOut)
        }
    }, [editor])

    const showToast = useCallback((message: string, undo?: () => void) => {
        setToast({ message, undo })
        setTimeout(() => setToast(null), 3000)
    }, [])

    const createSnapshot = useCallback(async (action: string, delta: string) => {
        const snapshot: VersionSnapshot = {
            id: createRequestId(),
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            action,
            delta
        }
        setVersions(prev => [snapshot, ...prev].slice(0, 20))
        setRevisionCount(prev => prev + 1)
        
        // Save to backend
        try {
            const plainText = editor?.state.doc.textBetween(0, editor.state.doc.content.size, ' ') || ''
            const words = plainText.trim().split(/\s+/).filter(Boolean).length
            await fetch('http://localhost:8000/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary: `${action} - ${words} words`,
                    word_count: words,
                    action,
                    delta
                })
            })
        } catch (error) {
            console.error('Failed to save snapshot:', error)
        }
        return snapshot
    }, [editor])

    const requestRewrite = async (action: AiAction, sectionText?: string) => {
        if (!editor) return
        const { from, to } = editor.state.selection
        const selected = sectionText || editor.state.doc.textBetween(from, to)

        if (!selected.trim()) {
            showToast('Select text before triggering AI.')
            return
        }


        const previewId = createRequestId()
        setPreview({
            id: previewId,
            label: action.label,
            intent: action.mode,
            status: 'loading',
            original: selected,
            suggestion: '',
            range: { from, to }
        })

        try {
            const response = await fetch('http://localhost:8000/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selected,
                    tone: action.tone,
                    mode: action.mode
                })
            })
            const data = await response.json()
            const suggestion = data?.rewritten_text ?? selected
            
            // Highlight changed tokens (simple diff simulation)
            const changedTokens: { from: number; to: number }[] = []
            // In real implementation, use a proper diff algorithm
            
            setPreview(current => current && current.id === previewId ? {
                ...current,
                suggestion,
                status: suggestion ? 'ready' : 'error',
                changedTokens
            } : current)
        } catch (error) {
            console.error('Rewrite failed:', error)
            setPreview(current => current && current.id === previewId ? { ...current, status: 'error' } : current)
            showToast('Copilot could not complete that request. Please retry.')
        }
    }

    const applySuggestion = () => {
        if (!editor || !preview || preview.status !== 'ready') return


        const beforeState = editor.state.doc.toString()
        const undoFn = () => {
            editor.commands.setContent(beforeState)
            setPreview(null)
        }

        editor
            .chain()
            .focus()
            .insertContentAt({ from: preview.range.from, to: preview.range.to }, preview.suggestion)
            .run()
        
        // Create snapshot
        const delta = JSON.stringify({ from: preview.range.from, to: preview.range.to, text: preview.suggestion })
        createSnapshot('AI rewrite', delta)
        
        showToast('Version saved • Undo', undoFn)
        setPreview(null)
    }

    const discardSuggestion = () => {
        setPreview(null)
    }


    if (!editor) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Initializing editor…
            </div>
        )
    }

    const handleFileUpload = (files: FileList | null) => {
        if (!files) return
        const fileArray = Array.from(files)
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
        const validFiles = fileArray.filter(f => allowedTypes.includes(f.type))
        setUploadedFiles(prev => [...prev, ...validFiles])
    }


    return (
        <div className="w-full flex gap-4" ref={editorRef}>
            {/* Left Panel - Document Intelligence */}
            <aside 
                className={cn(
                    "flex-shrink-0 bg-white/80 backdrop-blur-lg border border-gray-200 rounded-xl shadow-sm transition-all duration-[200ms] ease-in-out",
                    isHealthCollapsed ? "w-[40px] p-2 doc-health-collapsed" : "w-[280px] p-4"
                )}
                style={{ outline: 'none' }}
                aria-hidden={isHealthCollapsed}
            >
                {isHealthCollapsed ? (
                    <div className="relative group">
                        <button
                            ref={healthButtonRef}
                            onClick={() => setIsHealthCollapsed(false)}
                            onMouseEnter={() => {
                                if (healthButtonRef.current) {
                                    const rect = healthButtonRef.current.getBoundingClientRect()
                                    setHoverPreviewPosition({
                                        left: rect.right + 8,
                                        top: rect.bottom
                                    })
                                }
                            }}
                            onMouseLeave={() => setHoverPreviewPosition(null)}
                            className="w-full h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors border border-gray-200"
                            title="Document Health (Press D)"
                        >
                            <Gauge className="w-4 h-4 text-[#6B46FF]" />
                        </button>
                        {/* Hover preview - above editor */}
                        {hoverPreviewPosition && (
                            <div 
                                className="fixed w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 pointer-events-none transition-opacity"
                                style={{ 
                                    zIndex: 10000,
                                    left: `${hoverPreviewPosition.left}px`,
                                    top: `${hoverPreviewPosition.top}px`
                                }}
                            >
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Tone</span>
                                        <span className="px-2 py-0.5 bg-[#35C28B]/10 text-[#35C28B] rounded-full text-xs">Stable</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Words</span>
                                        <span className="font-medium">{wordCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Read time</span>
                                        <span className="font-medium">{readTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Document Health Header */}
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#6b6f76]">Document health</span>
                            <button
                                onClick={() => setIsHealthCollapsed(true)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Collapse (Press D)"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </div>

                        {/* Document Health Metrics - Non-scrollable */}
                        <div className="space-y-2">
                            {/* Tone Pill */}
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] text-gray-600">Tone</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[11px] font-medium",
                                    qualitySignals.find(s => s.label === 'Tone')?.status === 'success' && "bg-[#35C28B]/10 text-[#35C28B]",
                                    qualitySignals.find(s => s.label === 'Tone')?.status === 'warning' && "bg-amber-100 text-amber-700",
                                    qualitySignals.find(s => s.label === 'Tone')?.status === 'info' && "bg-blue-100 text-blue-700"
                                )}>
                                    {qualitySignals.find(s => s.label === 'Tone')?.value || 'Stable'}
                                </span>
                            </div>

                            {/* Clarity */}
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-gray-600">Clarity</span>
                                <span className={cn(
                                    'text-[12px] font-medium',
                                    qualitySignals.find(s => s.label === 'Clarity')?.status === 'success' && 'text-[#35C28B]',
                                    qualitySignals.find(s => s.label === 'Clarity')?.status === 'warning' && 'text-amber-600'
                                )}>
                                    {qualitySignals.find(s => s.label === 'Clarity')?.value || 'Crisp'}
                                </span>
                            </div>

                            {/* Structure */}
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-gray-600">Structure</span>
                                <span className="text-[12px] font-medium text-blue-600">
                                    {qualitySignals.find(s => s.label === 'Structure')?.value || '0 headings'}
                                </span>
                            </div>

                            {/* Word Count */}
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-gray-600">Words</span>
                                <span className="text-[12px] font-medium text-gray-800">{wordCount}</span>
                            </div>

                            {/* Read Time */}
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Read time
                                </span>
                                <span className="text-[12px] font-medium text-gray-800">{readTime}</span>
                            </div>

                            {/* Revision Count */}
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-gray-600">Revisions</span>
                                <span className="text-[12px] font-medium text-gray-800">{revisionCount}</span>
                            </div>

                            {/* Top Suggestions - Actionable */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[13px] mb-1.5">
                                    <span className="text-gray-600 font-medium">Top suggestions</span>
                                    <button
                                        onClick={() => setShowSuggestionsModal(true)}
                                        className="text-[12px] text-[#6B46FF] hover:text-[#6B46FF]/80 font-medium transition-colors"
                                    >
                                        Show more
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <DocumentHealthTopSuggestionRow
                                        suggestion={{
                                            id: 'suggestion-1',
                                            title: 'This paragraph is overly complex.',
                                            summary: 'Simplify sentence structure',
                                            fullText: 'This paragraph contains multiple nested clauses and complex sentence structures that may reduce readability. Consider breaking it into shorter, clearer sentences.',
                                            actionType: 'tighten',
                                            estimatedImpact: 'medium'
                                        }}
                                        docId="current-doc"
                                        onApply={() => {
                                            showToast(`Applied: This paragraph is overly complex. Undo`)
                                        }}
                                    />
                                    <DocumentHealthTopSuggestionRow
                                        suggestion={{
                                            id: 'suggestion-2',
                                            title: 'Try reducing passive voice.',
                                            summary: 'Use active voice for clarity',
                                            fullText: 'Several sentences in this section use passive voice, which can make the writing less direct. Consider rewriting in active voice where possible.',
                                            actionType: 'rewrite',
                                            estimatedImpact: 'high'
                                        }}
                                        docId="current-doc"
                                        onApply={() => {
                                            showToast(`Applied: Try reducing passive voice. Undo`)
                                        }}
                                    />
                                    <DocumentHealthTopSuggestionRow
                                        suggestion={{
                                            id: 'suggestion-3',
                                            title: 'Sentence length exceeds recommended readability.',
                                            summary: 'Break into shorter sentences',
                                            fullText: 'Some sentences exceed 25 words, which can reduce readability. Consider splitting long sentences into two or more shorter ones.',
                                            actionType: 'tighten',
                                            estimatedImpact: 'low'
                                        }}
                                        docId="current-doc"
                                        onApply={() => {
                                            showToast(`Applied: Sentence length exceeds recommended readability. Undo`)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Outline */}
                        <div>
                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 mb-2">
                                <BookMarked className="w-3.5 h-3.5 text-[#6B46FF]" />
                                Outline
                            </div>
                            <div className="space-y-0.5">
                                {(outline.length ? outline : [{ id: 'intro', label: 'Introduction', level: 2, position: 0 }]).map(node => (
                                    <button
                                        key={node.id}
                                        className={cn(
                                            'w-full text-left text-[13px] px-2.5 py-1.5 rounded-lg hover:bg-black/3 transition-colors',
                                            node.level > 2 && 'pl-4 text-[#6b6f76] text-[12px]'
                                        )}
                                        onClick={() => {
                                            const found = outline.find(o => o.id === node.id)
                                            if (found) {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .setTextSelection({ from: found.position, to: found.position + found.label.length })
                                                    .scrollIntoView()
                                                    .run()
                                            }
                                        }}
                                    >
                                        <span>{node.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Center Editor */}
            <div className="flex-1">
                {/* Editor */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                    {/* Expanded Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 flex-wrap relative z-10 pointer-events-auto">
                        {/* Formatting */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                                "p-1.5 rounded hover:bg-gray-200 transition-colors",
                                editor.isActive('bold') ? 'bg-gray-200 text-[#6B46FF]' : 'text-gray-600'
                    )}
                            aria-label="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                                "p-1.5 rounded hover:bg-gray-200 transition-colors",
                                editor.isActive('italic') ? 'bg-gray-200 text-[#6B46FF]' : 'text-gray-600'
                    )}
                            aria-label="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                        <div className="w-px h-4 bg-gray-300 mx-0.5" />
                        
                        {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(
                                "p-1.5 rounded hover:bg-gray-200 transition-colors",
                                editor.isActive('bulletList') ? 'bg-gray-200 text-[#6B46FF]' : 'text-gray-600'
                    )}
                            aria-label="Bullet list"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(
                                "p-1.5 rounded hover:bg-gray-200 transition-colors",
                                editor.isActive('orderedList') ? 'bg-gray-200 text-[#6B46FF]' : 'text-gray-600'
                    )}
                            aria-label="Numbered list"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                        <div className="w-px h-4 bg-gray-300 mx-0.5" />

                        {/* Paragraph Styles */}
                        <div className="relative">
                            <button
                                onClick={() => setShowParagraphMenu(!showParagraphMenu)}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                                aria-label="Paragraph styles"
                            >
                                <Type className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showParagraphMenu && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
                                    {[1, 2, 3, 4].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()
                                                setShowParagraphMenu(false)
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
                                        >
                                            Heading {level}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Font Size */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFontMenu(!showFontMenu)}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                                aria-label="Font size"
                            >
                                <span className="text-xs">{fontSize}px</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showFontMenu && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
                                    {[12, 14, 16, 18, 20, 24].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setFontSize(size)
                                                setShowFontMenu(false)
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
                                        >
                                            {size}px
                                        </button>
                                    ))}
                                </div>
                            )}
            </div>

                        {/* Insert Options */}
                        <div className="w-px h-4 bg-gray-300 mx-0.5" />
                        <button
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert table"
                            title="Insert table"
                        >
                            <Table className="w-4 h-4" />
                        </button>
                        <button
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert equation"
                            title="Insert equation"
                        >
                            <span className="text-xs">ƒ</span>
                        </button>
                        <button
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert footnote"
                            title="Insert footnote"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert citation"
                            title="Insert citation (Phase 2)"
                        >
                            <Quote className="w-4 h-4" />
                        </button>


                        <div className="ml-auto flex items-center gap-2 text-[12px] text-[#6b6f76]">
                            <button
                                onClick={() => setShowVersionTimeline(!showVersionTimeline)}
                                className="flex items-center gap-1.5 hover:text-gray-800 transition-colors"
                            >
                                <History className="w-3.5 h-3.5" />
                                <span>
                                    AutoSave {versions.length > 0 ? versions[0].timestamp : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                        </button>
                        </div>
                    </div>

                    {/* Glassmorphic Inline Toolbar - Fixed with horizontal scroll */}
                    {editor && (
                        <BubbleMenu 
                            editor={editor} 
                            tippyOptions={{ 
                                duration: 100,
                                placement: 'top',
                                animation: 'fade',
                                interactive: true,
                                appendTo: () => editorRef.current || document.body,
                                offset: [0, 8], // 8px vertical gap above selection
                                zIndex: 100 // Above editor
                            }}
                        >
                            <div 
                                className="flex items-center gap-1 bg-white/72 backdrop-blur-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-200/50 rounded-full px-2 py-1 overflow-x-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-2"
                                style={{ 
                                    minHeight: '36px',
                                    maxWidth: '90vw',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                            >
                                {INLINE_ACTIONS.map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => requestRewrite(action)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[#6B46FF]/10 transition-colors group flex-shrink-0"
                                        style={{ fontSize: '13px' }}
                                        aria-label={action.label}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-[#6B46FF] opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <span className="font-medium text-gray-800 whitespace-nowrap">{action.label}</span>
                                    </button>
                                ))}
                    </div>
                </BubbleMenu>
            )}

            <EditorContent editor={editor} />
                </div>
            </div>

            {/* Version Timeline Popup */}
            {showVersionTimeline && (
                <div className="fixed right-4 top-20 w-80 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-800">Version Timeline</h3>
                        <button
                            onClick={() => setShowVersionTimeline(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {versions.length === 0 ? (
                            <p className="text-xs text-[#6b6f76]">No versions yet</p>
                        ) : (
                            versions.map(version => (
                                <div key={version.id} className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-gray-800">{version.action}</span>
                                        <span className="text-[#6b6f76]">{version.timestamp}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Diff Preview Bubble - P0 Spec */}
            {preview && (
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
                                        {preview.suggestion.split(' ').map((word, i) => (
                                            <span
                                                key={i}
                                                className={preview.changedTokens?.some(t => t.from <= i && t.to >= i) ? 'bg-[#FDE68A]' : ''}
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
            )}

            {/* Grammar/Tone Hover Bubble */}
            {hoveredIssue && (
                <div
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px] max-w-[300px]"
                    style={{
                        left: `${hoveredIssue.element.getBoundingClientRect().left}px`,
                        top: `${hoveredIssue.element.getBoundingClientRect().bottom + 8}px`,
                    }}
                >
                    <div className="mb-2">
                        <div className={cn(
                            "text-xs font-medium mb-1",
                            hoveredIssue.issue.type === 'grammar' && "text-red-600",
                            hoveredIssue.issue.type === 'tone' && "text-blue-600",
                            hoveredIssue.issue.type === 'ai-suggestion' && "text-[#6B46FF]"
                        )}>
                            {hoveredIssue.issue.type === 'grammar' && 'Grammar'}
                            {hoveredIssue.issue.type === 'tone' && 'Tone'}
                            {hoveredIssue.issue.type === 'ai-suggestion' && 'AI Suggestion'}
                        </div>
                        <p className="text-[13px] text-gray-700">{hoveredIssue.issue.message}</p>
                        {hoveredIssue.issue.suggestion && (
                            <p className="text-[12px] text-[#6b6f76] mt-1">
                                Suggestion: <span className="text-[#6B46FF] font-medium">{hoveredIssue.issue.suggestion}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                            onClick={() => {
                                if (hoveredIssue.issue.suggestion && editor) {
                                    // Find the issue in the document and replace
                                    const issue = grammarToneIssues.find(i => 
                                        i.type === hoveredIssue.issue.type && 
                                        i.message === hoveredIssue.issue.message
                                    )
                                    if (issue) {
                                        editor.chain()
                                            .focus()
                                            .insertContentAt({ from: issue.from, to: issue.to }, hoveredIssue.issue.suggestion)
                                            .run()
                                        // Remove the fixed issue
                                        setGrammarToneIssues(prev => prev.filter(i => i !== issue))
                                    }
                                }
                                setHoveredIssue(null)
                            }}
                            className="px-3 py-1.5 bg-[#6B46FF] text-white text-xs font-medium rounded-lg hover:bg-[#6B46FF]/90 transition-colors"
                        >
                            Fix
                        </button>
                        <button
                            onClick={() => {
                                // Show explanation (could open Copilot with explanation)
                                showToast(`Explanation: ${hoveredIssue.issue.message}`)
                                setHoveredIssue(null)
                            }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Explain
                        </button>
                        <button
                            onClick={() => {
                                // Remove issue from list (ignore)
                                const issue = grammarToneIssues.find(i => 
                                    i.type === hoveredIssue.issue.type && 
                                    i.message === hoveredIssue.issue.message
                                )
                                if (issue) {
                                    setGrammarToneIssues(prev => prev.filter(i => i !== issue))
                                }
                                setHoveredIssue(null)
                            }}
                            className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Ignore
                        </button>
                    </div>
                </div>
            )}

            {/* Toast with Undo - P0 Spec */}
            {toast && (
                <div className="fixed bottom-6 left-6 bg-gray-900 text-white text-[13px] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 z-40 animate-in fade-in slide-in-from-bottom-2">
                    <span>{toast.message}</span>
                    {toast.undo && (
                        <button
                            onClick={() => {
                                toast.undo?.()
                                setToast(null)
                            }}
                            className="text-[#6B46FF] hover:text-[#6B46FF]/80 font-medium flex items-center gap-1"
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                            Undo
                        </button>
                    )}
                </div>
            )}

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
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    // Insert into document
                                                    if (editor) {
                                                        editor.commands.insertContent(`[File: ${file.name}]`)
                                                    }
                                                    setShowUploadModal(false)
                                                }}
                                                className="px-2 py-1 text-xs text-[#6B46FF] hover:bg-[#6B46FF]/10 rounded transition-colors"
                                            >
                                                Insert
                                            </button>
                                            <button
                                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Suggestions Modal */}
            <SuggestionsModal
                isOpen={showSuggestionsModal}
                onClose={() => setShowSuggestionsModal(false)}
                suggestions={topSuggestions}
                docId="current-doc"
                onApply={async (id) => {
                    try {
                        const response = await fetch('http://localhost:8000/api/recommendations/apply', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: 'current-user',
                                docId: 'current-doc',
                                recommendationId: id
                            })
                        })
                        if (response.ok) {
                            const data = await response.json()
                            const suggestion = topSuggestions.find(s => s.id === id)
                            if (suggestion) {
                                showToast(`Applied: ${suggestion.title}. Undo`, async () => {
                                    await fetch('http://localhost:8000/api/recommendations/undo', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            userId: 'current-user',
                                            docId: 'current-doc',
                                            undoToken: data.undoToken
                                        })
                                    })
                                })
                            }
                            setTopSuggestions(prev => prev.filter(s => s.id !== id))
                        }
                    } catch (error) {
                        console.error('Apply failed:', error)
                    }
                }}
                onDismiss={async (id) => {
                    try {
                        await fetch('http://localhost:8000/api/recommendations/dismiss', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: 'current-user',
                                docId: 'current-doc',
                                recommendationId: id
                            })
                        })
                        setTopSuggestions(prev => prev.filter(s => s.id !== id))
                    } catch (error) {
                        console.error('Dismiss failed:', error)
                    }
                }}
                onPreview={(rec) => {
                    // TODO: Open preview modal with diff view
                    console.log('Preview:', rec.id)
                }}
            />
        </div>
    )
}

export default Editor
