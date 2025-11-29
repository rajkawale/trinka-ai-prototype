import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle, type ForwardedRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Undo2 } from 'lucide-react'
import SuggestionPopup from '../editor/components/SuggestionPopup'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { GrammarToneExtension } from '../extensions/GrammarToneExtension'
import type { GrammarToneIssue } from '../extensions/GrammarToneExtension'
import GoalsModal, { type Goals } from './GoalsModal'
import { usePopover } from './PopoverManager'
import { countWords } from '../editor/utils/countWords'
import { useAI } from '../editor/hooks/useAI'
import { configureSlashCommands } from '../editor/components/SlashCommands'
import { createRequestId } from '../editor/utils/editorUtils'

export interface EditorRef {
    insertContent: (text: string) => void
    getEditor?: () => any
    applyImprovementFix?: (fix: string) => void
}

interface EditorProps {
    setShowChat: (show: boolean) => void
    setShowHealthSidebar: (show: boolean) => void
    setCopilotQuery: (query: string) => void
    onMetricsChange?: (wordCount: number, readTime: string) => void
}

const Editor = forwardRef((props: EditorProps, ref: ForwardedRef<EditorRef>) => {
    const {
        setShowChat,
        setShowHealthSidebar,
        setCopilotQuery,
        onMetricsChange,
    } = props

    const [wordCount, setWordCount] = useState(0)
    const [readTime, setReadTime] = useState('0 min')
    const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
    const [grammarToneIssues] = useState<GrammarToneIssue[]>([])
    const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)

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
    const { openPopover: _openPopover, closePopover: _closePopover } = usePopover()
    const requestRewriteRef = useRef<any>(null)

    const showToast = useCallback((message: string, undo?: () => void) => {
        setToast({ message, undo })
        setTimeout(() => setToast(null), 3000)
    }, [])

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
    })

    const {
        preview,
        setPreview,
        requestRewrite,
    } = useAI({
        editor,
        setRevisionCount: () => { }, // Mock setRevisionCount
        setVersions: () => { }, // Mock setVersions
        showToast,
        createRequestId
    })

    const handleImprovementFix = useCallback((fix: string) => {
        if (!editor) return

        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to, ' ')

        // Map fix actions to editor commands
        switch (fix) {
            case 'Review Goals settings':
                setShowGoalsModal(true)
                break
            case 'Simplify complex sentences':
            case 'Remove filler words':
            case 'Add transitional phrases':
            case 'Strengthen weak verbs':
                // For text-based fixes, trigger AI rewrite
                if (selectedText.trim()) {
                    requestRewrite({
                        id: 'improve',
                        label: fix,
                        description: fix,
                        mode: 'smart',
                    }, selectedText)
                } else {
                    showToast('Please select text to improve')
                }
                break
            default:
                showToast(`"${fix}" - Feature coming soon!`)
        }
    }, [editor, showToast, requestRewrite, setShowGoalsModal])

    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            if (editor) {
                editor.chain().focus().insertContent(text).run()
            }
        },
        getEditor: () => editor,
        applyImprovementFix: handleImprovementFix
    }))

    // Handle selection changes to trigger popup and cancel running operations
    useEffect(() => {
        if (!editor) return

        let debounceTimer: NodeJS.Timeout
        let currentRequestId: string | null = null

        const handleSelection = ({ editor }: { editor: any }) => {
            clearTimeout(debounceTimer)

            // Cancel any running AI generation when selection changes by closing popup
            if (preview) {
                console.debug('[TRINKA] Selection changed - cancelling suggestion generation')
                // Show brief message that operation was cancelled
                showToast('Selection changed - suggestion cancelled')
                setPreview(null)
                setSelectionRect(null)
            }

            debounceTimer = setTimeout(() => {
                const { selection } = editor.state
                const { empty, from, to } = selection
                const text = editor.state.doc.textBetween(from, to, ' ')

                // Only show if selection is not empty and has content
                if (!empty && text.trim().length > 0) {
                    // Calculate selection rect
                    const { view } = editor
                    const start = view.coordsAtPos(from)
                    const end = view.coordsAtPos(to)
                    const rect = {
                        left: start.left,
                        top: start.top,
                        bottom: end.bottom,
                        right: end.right,
                        width: end.right - start.left,
                        height: end.bottom - start.top,
                        x: start.left,
                        y: start.top,
                        toJSON: () => { }
                    } as DOMRect

                    setSelectionRect(rect)

                    currentRequestId = createRequestId()
                    setPreview({
                        status: 'idle',
                        label: 'Improve',
                        original: text,
                        range: { from, to },
                        initialTab: 'improve',
                        requestId: currentRequestId
                    })
                } else {
                    // Close popup if selection is cleared
                    setPreview(null)
                    setSelectionRect(null)
                    currentRequestId = null
                }
            }, 300) // 300ms debounce
        }

        editor.on('selectionUpdate', handleSelection)

        return () => {
            editor.off('selectionUpdate', handleSelection)
            clearTimeout(debounceTimer)
        }
    }, [editor, setPreview, preview, createRequestId])

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

        setWordCount(words)
        const readingTimeMinutes = Math.ceil(words / 200)
        const readTimeStr = `${readingTimeMinutes} min`
        setReadTime(readTimeStr)

        // Notify parent component of metrics change
        onMetricsChange?.(words, readTimeStr)

    }, [editor, onMetricsChange])

    useEffect(() => {
        if (!editor) return
        editor.on('update', updateMeta)
        updateMeta() // Initial check
        return () => {
            editor.off('update', updateMeta)
        }
    }, [editor, updateMeta])

    return (
        <div className="relative flex flex-col h-full bg-white">
            {/* Minimal toolbar - formatting via slash commands */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => editor?.chain().focus().undo().run()} 
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" 
                        title="Undo"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                        {wordCount} words • {readTime} read
                    </div>
                    <div className="h-4 w-px bg-gray-200" />
                    <button
                        onClick={() => setShowGoalsModal(true)}
                        className="text-xs font-medium text-gray-600 hover:text-[#6C2BD9] transition-colors"
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
                        isOpen={!!preview}
                        originalText={preview.original}
                        selectionRect={selectionRect}
                        onClose={() => setPreview(null)}
                        onAccept={(text) => {
                            if (editor && preview.range) {
                                // Use atomic replacement with proper undo handling
                                editor
                                    .chain()
                                    .focus()
                                    .setTextSelection(preview.range)
                                    .insertContent(text)
                                    .run()

                                // Place caret after inserted content
                                const newCaretPos = preview.range.from + text.length
                                setTimeout(() => {
                                    editor.chain().setTextSelection(newCaretPos).run()
                                }, 0)

                                setPreview(null)
                                showToast('Suggestion applied', () => {
                                    editor.chain().focus().undo().run()
                                })
                            }
                        }}
                        onSendToCopilot={(query) => {
                            setCopilotQuery(query)
                            setShowChat(true)
                            setPreview(null)
                        }}
                    />
                )}
            </div>

            {/* Modals */}
            {showGoalsModal && (
                <GoalsModal
                    isOpen={showGoalsModal}
                    onClose={() => setShowGoalsModal(false)}
                    initialGoals={goals}
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
