import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { GrammarToneExtension } from '../extensions/GrammarToneExtension'
import type { GrammarToneIssue } from '../extensions/GrammarToneExtension'
import { cn, trinkaApi } from '../lib/utils'
import { DEMO_SCENARIOS, type DemoScenario } from '../lib/demoScenarios'
import GoalsModal, { type Goals } from './GoalsModal'
import DocumentHealthTopSuggestionRow from './DocumentHealthTopSuggestionRow'
import SuggestionsModal from './SuggestionsModal'
import { usePopover } from './PopoverManager'
import RecommendationDetailPopover from './RecommendationDetailPopover'
import RecommendationListPopover from './RecommendationListPopover'
import type { Recommendation, ActionType } from './RecommendationCard'
import { useClickOutside } from '../hooks/useClickOutside'
import { useDebounce } from '../hooks/useDebounce'
import ImprovementSuggestionsModal from './ImprovementSuggestionsModal'
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
    Upload,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Sigma,
    Target
} from 'lucide-react'

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
    const [selectedFactorForImprovement, setSelectedFactorForImprovement] = useState<string | null>(null)
    const [writingScore, setWritingScore] = useState(100)

    const showToast = useCallback((message: string, undo?: () => void) => {
        setToast({ message, undo })
        setTimeout(() => setToast(null), 3000)
    }, [])

    // Toolbar states
    // Toolbar states
    const [showFontMenu, setShowFontMenu] = useState(false)
    const [showParagraphMenu, setShowParagraphMenu] = useState(false)
    const [showDemoMenu, setShowDemoMenu] = useState(false)
    const [fontSize, setFontSize] = useState(16)

    const fontMenuRef = useRef<HTMLDivElement>(null)
    const paragraphMenuRef = useRef<HTMLDivElement>(null)
    const demoMenuRef = useRef<HTMLDivElement>(null)
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useClickOutside(fontMenuRef, () => setShowFontMenu(false))
    useClickOutside(paragraphMenuRef, () => setShowParagraphMenu(false))
    useClickOutside(demoMenuRef, () => setShowDemoMenu(false))

    // Goals & Document Health
    const [showGoalsModal, setShowGoalsModal] = useState(false)
    const [goals, setGoals] = useState<Goals>(() => {
        const saved = localStorage.getItem('trinka-goals')
        return saved ? JSON.parse(saved) : {
            audience: 'expert',
            formality: 'formal',
            domain: 'academic'
        }
    })

    const [grammarToneIssues, setGrammarToneIssues] = useState<GrammarToneIssue[]>([])
    const editorRef = useRef<HTMLDivElement>(null)
    const { openPopover, closePopover } = usePopover()

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

    const handleSaveGoals = (newGoals: Goals) => {
        setGoals(newGoals)
        localStorage.setItem('trinka-goals', JSON.stringify(newGoals))
        setShowGoalsModal(false)
        showToast('Preferences saved')
    }

    // Update metrics based on goals
    const updateMeta = useCallback(() => {
        if (!editor) return

        const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
        const words = plainText.trim().split(/\s+/).filter(Boolean).length
        console.debug('trinka:wordcount', words)

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

        // Calculate metrics based on Goals
        let toneStatus = 'Stable'
        let clarityStatus = 'Crisp'
        let readabilityStatus = 'Good'

        // Formality Logic
        if (goals.formality === 'formal') {
            toneStatus = words % 5 === 0 ? 'Formal' : 'Needs Polish'
        } else if (goals.formality === 'casual') {
            toneStatus = words % 5 === 0 ? 'Casual' : 'Too Stiff'
        }

        // Audience Logic
        if (goals.audience === 'expert') {
            readabilityStatus = words > 150 ? 'Complex (Good)' : 'Too Simple'
        } else if (goals.audience === 'student') {
            readabilityStatus = words > 100 ? 'Hard' : 'Good'
        }

        // Domain Logic
        const integrityStatus = goals.domain === 'academic' ? (words % 7 ? 'Safe' : 'Review Required') : 'N/A'

        const coherenceStatus = words > 200 ? (words % 2 ? 'High' : 'Medium') : 'High'

        setWordCount(words)
        const readingTimeMinutes = Math.ceil(words / 200)
        setReadTime(`${readingTimeMinutes} min`)

        const signals: QualitySignal[] = [
            { label: 'Correctness', value: 'Good', status: 'success' },
            { label: 'Clarity', value: clarityStatus, status: 'success' },
            { label: 'Tone', value: toneStatus, status: toneStatus.includes('Needs') || toneStatus.includes('Too') ? 'warning' : 'success' },
            { label: 'Engagement', value: 'High', status: 'success' },
            { label: 'Structure', value: `${nodes.length || 1} headings`, status: 'info' },
        ]

        setQualitySignals(signals)

        // Calculate Weighted Score
        const weights: Record<string, number> = {
            'Correctness': 0.35,
            'Clarity': 0.30,
            'Tone': 0.15,
            'Engagement': 0.10,
            'Structure': 0.10
        }

        const scoreMap: Record<string, number> = {
            'success': 100,
            'warning': 60,
            'info': 80,
            'error': 40
        }

        const totalScore = signals.reduce((acc, signal) => {
            const weight = weights[signal.label] || 0
            const score = scoreMap[signal.status] || 0
            return acc + (score * weight)
        }, 0)

        setWritingScore(Math.round(totalScore))
    }, [editor, goals])



    useEffect(() => {
        if (!editor) return

        // Initial call
        updateMeta()

        // Direct updates for responsiveness
        editor.on('create', updateMeta)
        editor.on('update', updateMeta)

        return () => {
            editor.off('create', updateMeta)
            editor.off('update', updateMeta)
        }
    }, [editor, updateMeta])

    // Update extension when issues change
    useEffect(() => {
        if (!editor) return
        const extension = editor.extensionManager.extensions.find(ext => ext.name === 'grammarTone')
        if (extension) {
            extension.options.issues = grammarToneIssues
            editor.view.dispatch(editor.state.tr)
        }
    }, [editor, grammarToneIssues])

    // Load Demo Scenario
    const loadDemoScenario = useCallback((scenarioId: string) => {
        const scenario = DEMO_SCENARIOS[scenarioId]
        if (!scenario || !editor) return

        editor.commands.setContent(scenario.content)

        const issues: GrammarToneIssue[] = []
        const recommendations: Recommendation[] = []

        scenario.issues.forEach(issue => {
            const id = `issue-${Date.now()}-${Math.random()}`
            issues.push({
                from: issue.from,
                to: issue.to,
                type: issue.type,
                message: issue.message,
                suggestion: issue.suggestion
            })
            recommendations.push({
                id,
                title: issue.message,
                summary: issue.suggestion,
                fullText: issue.suggestion,
                originalText: issue.original,
                actionType: issue.type === 'grammar' ? 'rewrite' : (issue.type === 'tone' ? 'tone' : 'paraphrase') as ActionType,
                estimatedImpact: 'medium'
            })
        })

        setGrammarToneIssues(issues)
        setTopSuggestions(recommendations)
        setShowDemoMenu(false)
        showToast(`Loaded ${scenario.title}`)
    }, [editor])

    // Simulate grammar/tone issues (helper)
    const simulateIssues = useCallback(() => {
        if (!editor) return
        const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
        const issues: GrammarToneIssue[] = []
        const recommendations: Recommendation[] = []

        const addIssue = (from: number, to: number, type: 'grammar' | 'tone' | 'ai-suggestion', message: string, suggestion: string, original: string) => {
            const id = `issue-${Date.now()}-${Math.random()}`
            issues.push({ from, to, type, message, suggestion })
            recommendations.push({
                id,
                title: message,
                summary: suggestion,
                fullText: suggestion,
                originalText: original,
                actionType: type === 'grammar' ? 'rewrite' : (type === 'tone' ? 'tone' : 'rewrite') as ActionType,
                estimatedImpact: 'medium',
                range: { from, to }
            })
        }

        // Find "has significantly"
        const grammarMatch = plainText.indexOf('has significantly')
        if (grammarMatch !== -1) {
            addIssue(grammarMatch, grammarMatch + 17, 'grammar', 'Consider using "significantly has"', 'has had a significant impact', 'has significantly')
        }
        // Find "content generation"
        const toneMatch = plainText.indexOf('content generation')
        if (toneMatch !== -1) {
            addIssue(toneMatch, toneMatch + 18, 'tone', 'Consider more formal phrasing', 'textual composition', 'content generation')
        }
        // Find "AI can enhance"
        const aiMatch = plainText.indexOf('AI can enhance')
        if (aiMatch !== -1) {
            addIssue(aiMatch, aiMatch + 14, 'ai-suggestion', 'AI can improve clarity', 'AI can improve', 'AI can enhance')
        }

        setGrammarToneIssues(issues)
        setTopSuggestions(recommendations)
    }, [editor])

    // Initial simulation on mount
    useEffect(() => {
        if (editor) {
            simulateIssues()
        }
    }, [editor, simulateIssues])

    // Handle click on grammar/tone underlines + popover lifecycle
    useEffect(() => {
        if (!editor) return

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('grammar-tone-underline')) {
                const type = target.getAttribute('data-type')
                const message = target.getAttribute('data-message') || ''
                const suggestion = target.getAttribute('data-suggestion') || ''
                const from = target.getAttribute('data-from')
                const to = target.getAttribute('data-to')

                const recommendation: Recommendation = {
                    id: `issue-${Date.now()}`,
                    title: message,
                    summary: suggestion,
                    fullText: message,
                    originalText: target.textContent || '',
                    actionType: (type === 'grammar' ? 'tighten' : 'paraphrase') as ActionType,
                    estimatedImpact: 'medium'
                }

                // Create a range for precise anchoring
                const range = document.createRange()
                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                    // Prefer actual selection if available and matches target
                    if (selection.anchorNode && target.contains(selection.anchorNode)) {
                        const selRange = selection.getRangeAt(0)
                        if (selRange.toString().trim().length > 0) {
                            range.setStart(selRange.startContainer, selRange.startOffset)
                            range.setEnd(selRange.endContainer, selRange.endOffset)
                        } else {
                            range.selectNodeContents(target)
                        }
                    } else {
                        range.selectNodeContents(target)
                    }
                } else {
                    range.selectNodeContents(target)
                }

                openPopover(range, (
                    <RecommendationDetailPopover
                        recommendation={recommendation}
                        docId="current-doc"
                        onClose={closePopover}
                        onShowToast={showToast}
                        onApply={() => {
                            if (suggestion && from && to) {
                                const fromPos = parseInt(from)
                                const toPos = parseInt(to)
                                if (!isNaN(fromPos) && !isNaN(toPos)) {
                                    editor.chain().focus().setTextSelection({ from: fromPos, to: toPos }).insertContent(suggestion).run()
                                    console.log('trinka:suggestion_accepted', { id: recommendation.id, suggestion })
                                }
                            }
                            closePopover()
                        }}
                    />
                ), {
                    placement: 'bottom',
                    offset: 8,
                    isInteractive: true
                })
                console.debug('trinka:popover-opened-click')
            }
        }

        editor.view.dom.addEventListener('click', handleClick)
        return () => editor.view.dom.removeEventListener('click', handleClick)
    }, [editor, openPopover, closePopover])

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
            await fetch(trinkaApi('/versions'), {
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

    const handleApplyQuickFix = (fix: string) => {
        showToast(`Applying fix: ${fix}...`)
        setTimeout(() => {
            showToast(`Applied: ${fix}`)
            createSnapshot('Quick Fix', fix)
        }, 1000)
    }

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
            const response = await fetch(trinkaApi('/rewrite'), {
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

        editor
            .chain()
            .focus()
            .insertContentAt({ from: preview.range.from, to: preview.range.to }, preview.suggestion)
            .run()

        console.log('trinka:suggestion_accepted', { id: preview.id, suggestion: preview.suggestion })

        // Create snapshot
        const delta = JSON.stringify({ from: preview.range.from, to: preview.range.to, text: preview.suggestion })
        createSnapshot('AI rewrite', delta)

        showToast('Suggestion applied')
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
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-[#6b6f76]">Writing Quality Score</span>
                                <span className={cn(
                                    "text-[12px] font-bold px-1.5 py-0.5 rounded",
                                    writingScore >= 90 ? "bg-[#35C28B]/10 text-[#35C28B]" :
                                        writingScore >= 70 ? "bg-blue-100 text-blue-700" :
                                            "bg-amber-100 text-amber-700"
                                )}>
                                    {writingScore}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => setShowGoalsModal(true)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors mr-1"
                                    title="Set Goals"
                                >
                                    <Target className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                                <button
                                    onClick={() => setIsHealthCollapsed(true)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Collapse (Press D)"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Score Factors Card */}
                        <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100 space-y-3">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Score Factors</p>
                            {qualitySignals.map((signal) => (
                                <button
                                    key={signal.label}
                                    onClick={() => {
                                        if (signal.status === 'success') {
                                            showToast(`${signal.label} is looking good! ✓`)
                                        } else {
                                            setSelectedFactorForImprovement(signal.label)
                                        }
                                    }}
                                    className="w-full text-left space-y-1 hover:bg-gray-100 p-1.5 -mx-1.5 rounded transition-colors group"
                                >
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-gray-600 group-hover:text-gray-900">{signal.label}</span>
                                        <span className={cn(
                                            "font-medium",
                                            signal.status === 'success' ? "text-[#35C28B]" :
                                                signal.status === 'warning' ? "text-amber-600" : "text-blue-600"
                                        )}>
                                            {signal.value}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
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

                            {/* Word Count */}
                            <div className="flex items-center justify-between text-[13px] pt-2 border-t border-gray-200">
                                <span className="text-gray-600">Word count</span>
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

                            {/* Version History */}
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <History className="w-3 h-3" />
                                    Version History
                                </span>
                                <button
                                    onClick={() => setShowVersionTimeline(true)}
                                    className="text-[12px] font-medium text-[#6C2BD9] hover:underline cursor-pointer"
                                >
                                    {revisionCount || 3} versions
                                </button>
                            </div>

                            {/* Top Suggestions - Actionable */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between text-[13px] mb-1.5">
                                    <span className="text-gray-600 font-medium">Top suggestions</span>
                                    <button
                                        onClick={() => setShowSuggestionsModal(true)}
                                        className="text-[12px] text-[#6C2BD9] hover:text-[#6C2BD9]/80 font-medium transition-colors"
                                    >
                                        See all
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
                                <BookMarked className="w-3.5 h-3.5 text-[#6C2BD9]" />
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
                        <div className="relative" ref={paragraphMenuRef}>
                            <button
                                onClick={() => setShowParagraphMenu(!showParagraphMenu)}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                                aria-label="Paragraph styles"
                            >
                                <Type className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showParagraphMenu && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 w-40">
                                    {[1, 2, 3, 4].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()
                                                setShowParagraphMenu(false)
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <span className={cn(
                                                "font-bold",
                                                level === 1 && "text-xl",
                                                level === 2 && "text-lg",
                                                level === 3 && "text-base",
                                                level === 4 && "text-sm"
                                            )}>H{level}</span>
                                            Heading {level}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            editor.chain().focus().setParagraph().run()
                                            setShowParagraphMenu(false)
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
                                    >
                                        Paragraph
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Font Size */}
                        <div className="relative" ref={fontMenuRef}>
                            <button
                                onClick={() => setShowFontMenu(!showFontMenu)}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 flex items-center gap-1"
                                aria-label="Font size"
                            >
                                <span className="text-xs">{fontSize}px</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showFontMenu && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 max-h-60 overflow-y-auto">
                                    {[12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setFontSize(size)
                                                // Mock visual update
                                                showToast(`Font size updated to ${size}px`)
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

                        <div className="w-px h-4 bg-gray-300 mx-0.5" />

                        {/* Alignment (Mocked) */}
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => showToast('Aligned Left')}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                                aria-label="Align left"
                            >
                                <AlignLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => showToast('Aligned Center')}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                                aria-label="Align center"
                            >
                                <AlignCenter className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => showToast('Aligned Right')}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                                aria-label="Align right"
                            >
                                <AlignRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => showToast('Justified')}
                                className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                                aria-label="Align justify"
                            >
                                <AlignJustify className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Insert Options */}
                        <div className="w-px h-4 bg-gray-300 mx-0.5" />
                        <button
                            onClick={() => {
                                editor.chain().focus().insertContent(`
                            <table>
                              <tbody>
                                <tr><td>Cell 1</td><td>Cell 2</td></tr>
                                <tr><td>Cell 3</td><td>Cell 4</td></tr>
                              </tbody>
                            </table>
                        `).run()
                                showToast('Inserted Table')
                            }}
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert table"
                            title="Insert table"
                        >
                            <Table className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().insertContent(' $$ ').run()}
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert equation"
                            title="Insert equation"
                        >
                            <Sigma className="w-4 h-4" />
                        </button>
                        <button
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
                            aria-label="Insert footnote"
                            title="Insert footnote"
                        >
                            <FileText className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-gray-300 mx-0.5" />

                        {/* Demo Menu */}
                        <div className="relative" ref={demoMenuRef}>
                            <button
                                onClick={() => setShowDemoMenu(!showDemoMenu)}
                                className="px-3 py-1.5 bg-purple-50 text-[#6B46FF] text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                                aria-haspopup="true"
                                aria-expanded={showDemoMenu}
                                aria-label="Demo scenarios"
                            >
                                <Sparkles className="w-3 h-3" aria-hidden="true" />
                                Demo
                            </button>
                            {showDemoMenu && (
                                <div
                                    className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 w-48"
                                    role="menu"
                                    aria-label="Select a demo scenario"
                                >
                                    {Object.values(DEMO_SCENARIOS).map(scenario => (
                                        <button
                                            key={scenario.id}
                                            onClick={() => loadDemoScenario(scenario.id)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                            role="menuitem"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-[#6B46FF]" aria-hidden="true" />
                                            {scenario.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={cn(
                                "p-1.5 rounded hover:bg-gray-200 transition-colors",
                                editor.isActive('blockquote') ? 'bg-gray-200 text-[#6B46FF]' : 'text-gray-600'
                            )}
                            aria-label="Quote"
                            title="Quote"
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

                    {/* Glassmorphic Inline Toolbar */}
                    {editor && (
                        <BubbleMenu
                            editor={editor}
                            shouldShow={({ editor, view, state, from, to }) => {
                                const { selection } = state
                                const { empty } = selection
                                const text = state.doc.textBetween(from, to, ' ')
                                if (empty || !text.trim()) {
                                    console.debug('trinka:popover-suppressed-no-selection')
                                    return false
                                }
                                return true
                            }}
                            tippyOptions={{
                                duration: 100,
                                placement: 'top',
                                animation: 'fade',
                                interactive: true,
                                appendTo: () => editorRef.current || document.body,
                                offset: [0, 8],
                                zIndex: 100
                            }}
                        >
                            <div
                                className="flex items-center gap-1 bg-white/90 backdrop-blur-lg shadow-lg border border-gray-200/50 rounded-full px-2 py-1 overflow-x-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-2"
                                style={{
                                    minHeight: '36px',
                                    maxWidth: '90vw',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                            >
                                <button
                                    onClick={() => requestRewrite({ id: 'smart', label: 'Smart Edit', description: 'Auto-improve', mode: 'smart', tone: 'academic' })}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#6B46FF]/10 hover:bg-[#6B46FF]/20 text-[#6B46FF] transition-colors group flex-shrink-0 border border-[#6B46FF]/20"
                                    style={{ fontSize: '13px' }}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="font-semibold whitespace-nowrap">Smart Edit</span>
                                </button>
                                <div className="w-px h-4 bg-gray-300 mx-1" />
                                {INLINE_ACTIONS.map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => requestRewrite(action)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0"
                                        style={{ fontSize: '13px' }}
                                        aria-label={action.label}
                                    >
                                        <span className="font-medium text-gray-700 whitespace-nowrap">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </BubbleMenu>
                    )}

                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Version Timeline Modal */}
            {showVersionTimeline && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowVersionTimeline(false)}>
                    <div className="w-[500px] max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-sm font-semibold text-gray-800">Version History</h3>
                            <button
                                onClick={() => setShowVersionTimeline(false)}
                                className="p-1.5 hover:bg-gray-200/50 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3">
                            {versions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p>No versions yet</p>
                                    <p className="text-xs opacity-60 mt-1">Edits will appear here automatically</p>
                                </div>
                            ) : (
                                versions.map(version => (
                                    <div key={version.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 group transition-all">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-900">{version.action}</span>
                                            <span className="text-xs text-gray-500">{version.timestamp}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                showToast(`Restored version from ${version.timestamp}`)
                                                setShowVersionTimeline(false)
                                                if (editor) {
                                                    editor.commands.focus()
                                                }
                                            }}
                                            className="w-full text-center text-xs text-[#6C2BD9] bg-[#6C2BD9]/5 hover:bg-[#6C2BD9]/10 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-medium"
                                        >
                                            Restore this version
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
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

            {/* Grammar/Tone Hover Bubble - anchored with viewport-aware placement */}
            {/* Grammar/Tone Hover Bubble - Replaced by PopoverManager */}

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
                    const suggestion = topSuggestions.find(s => s.id === id)
                    if (suggestion && suggestion.range && suggestion.summary) {
                        // Transactional apply
                        editor.chain()
                            .focus()
                            .setTextSelection({ from: suggestion.range.from, to: suggestion.range.to })
                            .insertContent(suggestion.summary)
                            .run()

                        console.debug('trinka:suggestion_apply', {
                            id: suggestion.id,
                            original: suggestion.originalText,
                            replacedWith: suggestion.summary
                        })

                        showToast(`Applied: ${suggestion.title}`)
                        setTopSuggestions(prev => prev.filter(s => s.id !== id))

                        // Update word count immediately
                        const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
                        const words = plainText.trim().split(/\s+/).filter(Boolean).length
                        console.debug('trinka:wordcount', words)
                    }
                }}
                onDismiss={async (id) => {
                    try {
                        await fetch(trinkaApi('/api/recommendations/dismiss'), {
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
            <GoalsModal
                isOpen={showGoalsModal}
                onClose={() => setShowGoalsModal(false)}
                initialGoals={goals}
                onSave={handleSaveGoals}
            />
            {selectedFactorForImprovement && (
                <ImprovementSuggestionsModal
                    factor={selectedFactorForImprovement}
                    onClose={() => setSelectedFactorForImprovement(null)}
                    onApplyFix={handleApplyQuickFix}
                />
            )}
        </div>
    )
}

export default Editor
