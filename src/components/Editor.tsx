import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle, type ForwardedRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import {
    X,
    Undo2,
    Upload,
    FileText,
    Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import SuggestionPopup from '../editor/components/SuggestionPopup'
import WritingScorePill from '../editor/components/WritingScorePill'
import SlashCommands from '../editor/components/SlashCommands'
import DiffView from '../editor/components/DiffView'
import DiffPreviewBubble from '../editor/components/DiffPreviewBubble'
import { Suggestion } from '@tiptap/suggestion'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { GrammarToneExtension } from '../extensions/GrammarToneExtension'
import type { GrammarToneIssue } from '../extensions/GrammarToneExtension'
import GoalsModal, { type Goals } from './GoalsModal'
import SuggestionsModal from './SuggestionsModal'
import { usePopover } from './PopoverManager'
import RecommendationDetailPopover from './RecommendationDetailPopover'
import { Portal } from './Portal'
import type { Recommendation, ActionType } from './RecommendationCard'
import { countWords } from '../editor/utils/countWords'
import { useAI } from '../editor/hooks/useAI'
import { configureSlashCommands } from '../editor/components/SlashCommands'
import { createRequestId } from '../editor/utils/editorUtils'
import type { QualitySignal } from '../editor/types'
import ImprovementSuggestionsModal from './ImprovementSuggestionsModal'

type VersionSnapshot = {
    id: string
    timestamp: string
    action: string
    delta: string
}

export interface EditorRef {
    insertContent: (text: string) => void
}

interface EditorProps {
    showChat: boolean
    setShowChat: (show: boolean) => void
    isPrivacyMode: boolean
    showHealthSidebar: boolean
    setShowHealthSidebar: (show: boolean) => void
    setCopilotQuery: (query: string) => void
    onTriggerCopilot?: (initialMessage?: string) => void
}

const Editor = forwardRef((props: EditorProps, ref: ForwardedRef<EditorRef>) => {
    const {
        showChat,
        setShowChat,
        isPrivacyMode: _isPrivacyMode,
        showHealthSidebar,
        setShowHealthSidebar,
        setCopilotQuery,
        onTriggerCopilot
    } = props

    const docId = 'current-doc'
    const [qualitySignals, setQualitySignals] = useState<QualitySignal[]>([
        { label: 'Tone', value: 'Stable', status: 'success' },
        { label: 'Clarity', value: 'Crisp', status: 'success' },
        { label: 'Structure', value: '2 headings', status: 'info' },
        { label: 'Coherence Score', value: 'High', status: 'success' },
        { label: 'Readability', value: 'Good', status: 'success' },
        { label: 'Academic Integrity', value: 'Safe', status: 'success' },
    ])
    const [wordCount, setWordCount] = useState(0)
    const [readTime, setReadTime] = useState('0 min')
    const [revisionCount, setRevisionCount] = useState(0)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
    const [topSuggestions, setTopSuggestions] = useState<Recommendation[]>([])
    const [versions, setVersions] = useState<VersionSnapshot[]>([])
    const [showVersionTimeline, setShowVersionTimeline] = useState(false)
    const [selectedFactorForImprovement, setSelectedFactorForImprovement] = useState<string | null>(null)
    const [writingScore, setWritingScore] = useState(100)
    const [grammarToneIssues, setGrammarToneIssues] = useState<GrammarToneIssue[]>([])

    // State from ux-fixes
    const [dictionary, setDictionary] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('trinka-dictionary')
        return saved ? new Set(JSON.parse(saved)) : new Set()
    })
    const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set())

    const showToast = useCallback((message: string, undo?: () => void) => {
        setToast({ message, undo })
        setTimeout(() => setToast(null), 3000)
    }, [])

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

    const editorRef = useRef<HTMLDivElement>(null)
    const { openPopover, closePopover } = usePopover()
    const requestRewriteRef = useRef<any>(null)

    const slashCommandExtension = React.useMemo(() => {
        return configureSlashCommands({
            setCopilotQuery,
            setShowChat,
            setShowHealthSidebar,
            setShowGoalsModal,
            requestRewriteRef
        })
    }, [setCopilotQuery, setShowChat, setShowHealthSidebar, setShowGoalsModal])

    const editor = useEditor({
        extensions: [
            StarterKit,
            BubbleMenuExtension,
            GrammarToneExtension.configure({
                issues: grammarToneIssues,
            }),
            slashCommandExtension
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

    const {
        preview,
        setPreview,
        requestRewrite,
        applySuggestion,
        discardSuggestion,
        createSnapshot
    } = useAI({
        editor,
        setRevisionCount,
        setVersions,
        showToast,
        createRequestId
    })

    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            if (editor) {
                editor.chain().focus().insertContent(text).run()
            }
        }
    }))

    // Handle selection changes to trigger popup
    useEffect(() => {
        if (!editor) return

        let debounceTimer: NodeJS.Timeout

        const handleSelection = ({ editor }: { editor: any }) => {
            clearTimeout(debounceTimer)

            debounceTimer = setTimeout(() => {
                const { selection } = editor.state
                const { empty, from, to } = selection
                const text = editor.state.doc.textBetween(from, to, ' ')

                // Only show if selection is not empty and has content
                if (!empty && text.trim().length > 0) {
                    setPreview({
                        status: 'idle',
                        label: 'Improve',
                        original: text,
                        range: { from, to },
                        initialTab: 'improve'
                    })
                } else {
                    // Close popup if selection is cleared
                    setPreview(null)
                }
            }, 300) // 300ms debounce
        }

        editor.on('selectionUpdate', handleSelection)

        return () => {
            editor.off('selectionUpdate', handleSelection)
            clearTimeout(debounceTimer)
        }
    }, [editor, setPreview])

    useEffect(() => {
        requestRewriteRef.current = requestRewrite
    }, [requestRewrite])

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
        const words = countWords(plainText)
        console.debug('trinka:wordcount', words)

        let headingCount = 0
        editor.state.doc.descendants((node) => {
            if (node.type.name === 'heading') {
                headingCount++
            }
        })

        // Calculate metrics based on Goals
        let toneStatus = 'Stable'
        let clarityStatus = 'Crisp'

        // Formality Logic
        if (goals.formality === 'formal') {
            toneStatus = words % 5 === 0 ? 'Formal' : 'Needs Polish'
        } else if (goals.formality === 'casual') {
            toneStatus = words % 5 === 0 ? 'Casual' : 'Too Stiff'
        }

        setWordCount(words)
        const readingTimeMinutes = Math.ceil(words / 200)
        setReadTime(`${readingTimeMinutes} min`)

        const signals: QualitySignal[] = [
            { label: 'Correctness', value: 'Good', status: 'success' },
            { label: 'Clarity', value: clarityStatus, status: 'success' },
            { label: 'Tone', value: toneStatus, status: toneStatus.includes('Needs') || toneStatus.includes('Too') ? 'warning' : 'success' },
            { label: 'Engagement', value: 'High', status: 'success' },
            { label: 'Structure', value: `${headingCount || 1} heading${(headingCount || 1) !== 1 ? 's' : ''}`, status: 'info' },
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

        let score = 100
        if (toneStatus.includes('Needs') || toneStatus.includes('Too')) score -= 15
        if (clarityStatus.includes('Needs')) score -= 15

        setWritingScore(Math.max(0, score))

    }, [editor, goals])

    useEffect(() => {
        if (!editor) return
        editor.on('update', updateMeta)
        updateMeta() // Initial check
        return () => {
            editor.off('update', updateMeta)
        }
    }, [editor, updateMeta])

    const handleApplyQuickFix = (fix: string) => {
        if (!editor) return
        editor.chain().focus().insertContent(fix).run()
        showToast('Fix applied', () => editor.chain().focus().undo().run())
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadedFiles(Array.from(e.target.files))
            showToast(`${e.target.files.length} files uploaded`)
        }
    }

    return (
        <div className="relative flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-1">
                    <button onClick={() => editor?.chain().focus().undo().run()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Undo">
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    {/* Basic Formatting */}
                    <button onClick={() => editor?.chain().focus().toggleBold().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor?.isActive('bold') && "bg-gray-100 text-purple-600")} title="Bold">
                        <span className="font-bold text-sm">B</span>
                    </button>
                    <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor?.isActive('italic') && "bg-gray-100 text-purple-600")} title="Italic">
                        <span className="italic text-sm font-serif">I</span>
                    </button>
                    <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor?.isActive('underline') && "bg-gray-100 text-purple-600")} title="Underline">
                        <span className="underline text-sm">U</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                        {wordCount} words • {readTime} read
                    </div>
                    <div className="h-4 w-px bg-gray-200" />
                    <button
                        onClick={() => setShowGoalsModal(true)}
                        className="text-xs font-medium text-gray-600 hover:text-purple-600 transition-colors"
                    >
                        {goals.audience} • {goals.formality}
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto relative" ref={editorRef}>
                <EditorContent editor={editor} className="h-full" />

                {/* Floating Suggestions */}
                {preview && (
                    <SuggestionPopup
                        preview={preview}
                        onClose={() => setPreview(null)}
                        onApply={(text) => {
                            if (editor) {
                                editor.chain().focus()
                                    .setTextSelection(preview.range)
                                    .insertContent(text)
                                    .run()
                                setPreview(null)
                                showToast('Suggestion applied', () => editor.chain().focus().undo().run())
                            }
                        }}
                        onDiscard={() => setPreview(null)}
                        onRequestRewrite={requestRewrite}
                    />
                )}
            </div>

            {/* Modals */}
            {showGoalsModal && (
                <GoalsModal
                    isOpen={showGoalsModal}
                    onClose={() => setShowGoalsModal(false)}
                    goals={goals}
                    onSave={handleSaveGoals}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <span className="text-sm font-medium">{toast.message}</span>
                    {toast.undo && (
                        <button
                            onClick={() => {
                                toast.undo?.()
                                setToast(null)
                            }}
                            className="text-xs text-gray-300 hover:text-white underline"
                        >
                            Undo
                        </button>
                    )}
                </div>
            )}
        </div>
    )
})

Editor.displayName = 'Editor'

export default Editor
