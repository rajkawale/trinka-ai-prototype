import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle, type ForwardedRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Undo2, Redo2 } from 'lucide-react'
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
import { useInlineSuggestions } from '../hooks/useInlineSuggestions'
import { InlineSuggestionTooltip } from './InlineSuggestionTooltip'

export interface EditorRef {
    insertContent: (text: string) => void
    getEditor?: () => any
    applyImprovementFix?: (fix: string) => void
    triggerRephrase?: () => void
    triggerGrammarFixes?: () => void
}

interface EditorProps {
    setShowChat: (show: boolean) => void
    setShowHealthSidebar: (show: boolean) => void
    setCopilotQuery: (query: string) => void
    onMetricsChange?: (wordCount: number, readTime: string) => void
    onSuggestionPopupChange?: (isOpen: boolean) => void
    wordCount?: number
    readTime?: string
}

const Editor = forwardRef((props: EditorProps, ref: ForwardedRef<EditorRef>) => {
    const {
        setShowChat,
        setShowHealthSidebar,
        setCopilotQuery,
        onMetricsChange,
    } = props

    // Word count and read time are managed by parent (App.tsx) via onMetricsChange callback
    // We don't maintain local state here to avoid infinite loops
    const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
    // Mock grammar/tone issues for demonstration (in production, these would come from AI analysis)
    const [grammarToneIssues] = useState<GrammarToneIssue[]>([
        {
            from: 150,
            to: 157,
            type: 'grammar',
            message: 'Grammar error: Subject-verb agreement',
            suggestion: 'has impacted'
        },
        {
            from: 200,
            to: 210,
            type: 'tone',
            message: 'Tone improvement: Consider more formal phrasing',
            suggestion: 'presents unique challenges'
        },
        {
            from: 280,
            to: 295,
            type: 'clarity',
            message: 'Clarity: Simplify this sentence structure',
            suggestion: 'Researchers must balance assistance and automation'
        }
    ])
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

    // Inline suggestion tooltips on hover
    const { tooltip, closeTooltip } = useInlineSuggestions(editor)

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

    const triggerRephrase = useCallback(() => {
        if (!editor) return
        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to, ' ')
        
        if (!selectedText.trim()) {
            showToast('Please select text to rephrase')
            return
        }

        requestRewrite({
            id: 'rephrase',
            label: 'Rephrase',
            description: 'Rephrase selected text',
            mode: 'rewrite'
        }, selectedText)
    }, [editor, requestRewrite, showToast])

    const triggerGrammarFixes = useCallback(() => {
        if (!editor) return
        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to, ' ')
        
        if (!selectedText.trim()) {
            showToast('Please select text to check grammar')
            return
        }

        requestRewrite({
            id: 'improve',
            label: 'Improve',
            description: 'Fix grammar and improve',
            mode: 'smart'
        }, selectedText)
    }, [editor, requestRewrite, showToast])

    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            if (editor) {
                editor.chain().focus().insertContent(text).run()
            }
        },
        getEditor: () => editor,
        applyImprovementFix: handleImprovementFix,
        triggerRephrase,
        triggerGrammarFixes
    }))

    // Handle selection changes to trigger popup and cancel running operations
    // Store callbacks in refs to avoid dependency issues
    const previewRef = useRef(preview)
    useEffect(() => {
        console.log('[Editor] previewRef updated', { preview: !!preview })
        previewRef.current = preview
    }, [preview])

    // Store callback in ref - update it synchronously without useEffect to avoid loops
    const onSuggestionPopupChangeRef = useRef(props.onSuggestionPopupChange)
    // Update ref directly without triggering useEffect
    onSuggestionPopupChangeRef.current = props.onSuggestionPopupChange

    useEffect(() => {
        console.log('[Editor] useEffect for selection handler triggered', { hasEditor: !!editor })
        if (!editor) {
            console.log('[Editor] No editor for selection handler, returning early')
            return
        }

        let debounceTimer: NodeJS.Timeout
        let currentRequestId: string | null = null

        const handleSelection = ({ editor }: { editor: any }) => {
            console.log('[Editor] handleSelection called')
            clearTimeout(debounceTimer)

            // Cancel any running AI generation when selection changes by closing popup
            if (previewRef.current) {
                console.log('[Editor] Selection changed - cancelling suggestion generation')
                console.debug('[TRINKA] Selection changed - cancelling suggestion generation')
                // Show brief message that operation was cancelled
                showToast('Selection changed - suggestion cancelled')
                console.log('[Editor] Setting preview to null')
                setPreview(null)
                console.log('[Editor] Setting selectionRect to null')
                setSelectionRect(null)
                onSuggestionPopupChangeRef.current?.(false)
            }

            debounceTimer = setTimeout(() => {
                console.log('[Editor] Selection debounce timer fired')
                const { selection } = editor.state
                const { empty, from, to } = selection
                const text = editor.state.doc.textBetween(from, to, ' ')

                // Only show if selection is not empty and has content
                if (!empty && text.trim().length > 0) {
                    console.log('[Editor] Selection has text, setting preview', { text: text.substring(0, 20) })
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

                    console.log('[Editor] Setting selectionRect')
                    setSelectionRect(rect)

                    currentRequestId = createRequestId()
                    console.log('[Editor] Setting preview with new requestId:', currentRequestId)
                    setPreview({
                        status: 'idle',
                        label: 'Improve',
                        original: text,
                        range: { from, to },
                        initialTab: 'improve',
                        requestId: currentRequestId
                    })
                    onSuggestionPopupChangeRef.current?.(true)
                } else {
                    console.log('[Editor] Selection is empty, clearing preview')
                    // Close popup if selection is cleared
                    setPreview(null)
                    setSelectionRect(null)
                    currentRequestId = null
                    onSuggestionPopupChangeRef.current?.(false)
                }
            }, 300) // 300ms debounce
        }

        console.log('[Editor] Setting up editor.on("selectionUpdate") listener')
        editor.on('selectionUpdate', handleSelection)

        return () => {
            console.log('[Editor] Cleaning up editor.on("selectionUpdate") listener')
            editor.off('selectionUpdate', handleSelection)
            clearTimeout(debounceTimer)
        }
    }, [editor, setPreview, createRequestId, showToast])

    useEffect(() => {
        requestRewriteRef.current = requestRewrite
    }, [requestRewrite])

    const handleSaveGoals = (newGoals: Goals) => {
        setGoals(newGoals)
        localStorage.setItem('trinka-goals', JSON.stringify(newGoals))
        setShowGoalsModal(false)
        showToast('Preferences saved')
    }

    // Store onMetricsChange in a ref - update it synchronously without useEffect to avoid loops
    const onMetricsChangeRef = useRef(onMetricsChange)
    // Update ref directly without triggering useEffect
    onMetricsChangeRef.current = onMetricsChange

    // Track previous values to avoid unnecessary updates
    const prevMetricsRef = useRef({ wordCount: 0, readTime: '' })
    
    // Flag to prevent recursive calls - critical to prevent infinite loops
    const isProcessingMetricsRef = useRef(false)
    // Debounce timer to prevent rapid-fire updates
    const metricsDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    
    // Store editor in ref to avoid dependency issues
    const editorForMetricsRef = useRef(editor)
    useEffect(() => {
        editorForMetricsRef.current = editor
    }, [editor])
    
    // Update metrics - use refs for everything to prevent recreation
    const updateMetaRef = useRef<(() => void) | null>(null)
    
    // Create a stable function that doesn't depend on changing values
    const updateMeta = useCallback(() => {
        // CRITICAL: Prevent recursive calls - if already processing, skip
        if (isProcessingMetricsRef.current) {
            console.log('[Editor] updateMeta skipped - already processing')
            return
        }
        
        const currentEditor = editorForMetricsRef.current
        console.log('[Editor] updateMeta called', { hasEditor: !!currentEditor })
        if (!currentEditor) return

        // Set processing flag IMMEDIATELY to prevent recursive calls
        isProcessingMetricsRef.current = true

        try {
            const plainText = currentEditor.state.doc.textBetween(0, currentEditor.state.doc.content.size, ' ')
            const words = countWords(plainText)
            const readingTimeMinutes = Math.ceil(words / 200)
            const readTimeStr = `${readingTimeMinutes} min`

            // Only update if values actually changed
            if (prevMetricsRef.current.wordCount === words && prevMetricsRef.current.readTime === readTimeStr) {
                console.log('[Editor] updateMeta skipped - no change in metrics')
                // CRITICAL: Clear flag before returning
                isProcessingMetricsRef.current = false
                return
            }

            // Update previous values FIRST to prevent calling callback multiple times
            prevMetricsRef.current = { wordCount: words, readTime: readTimeStr }

            // DO NOT update Editor's internal state - only notify parent via callback
            // The parent (App.tsx) will handle the state updates
            // This prevents the infinite loop caused by Editor state updates triggering re-renders
            
            // Notify parent component of metrics change using ref to avoid dependency
            // Use setTimeout with 0ms delay to defer to next event loop tick
            // This breaks any potential synchronous loops
            if (onMetricsChangeRef.current) {
                console.log('[Editor] updateMeta calling onMetricsChangeRef.current', { words, readTimeStr })
                // Use setTimeout to defer callback to next event loop tick
                setTimeout(() => {
                    if (onMetricsChangeRef.current) {
                        onMetricsChangeRef.current(words, readTimeStr)
                    }
                    // Clear processing flag AFTER callback completes
                    isProcessingMetricsRef.current = false
                }, 0)
            } else {
                // Clear flag if no callback
                isProcessingMetricsRef.current = false
            }
        } catch (error) {
            console.error('[Editor] updateMeta error', error)
            // Clear flag on error
            isProcessingMetricsRef.current = false
        }
    }, []) // Empty deps - use refs for editor and callback
    
    // Store in ref
    updateMetaRef.current = updateMeta

    useEffect(() => {
        console.log('[Editor] useEffect for editor.on("update") triggered', { hasEditor: !!editor })
        if (!editor) {
            console.log('[Editor] No editor, returning early')
            return
        }
        
        // Create a stable wrapper function that calls the ref
        // This function is created once per effect run and doesn't change
        const handleUpdate = () => {
            if (updateMetaRef.current && !isProcessingMetricsRef.current) {
                updateMetaRef.current()
            }
        }
        
        console.log('[Editor] Setting up editor.on("update") listener')
        editor.on('update', handleUpdate)
        
        // DO NOT call updateMeta on mount - let it be called naturally when content changes
        // Calling it immediately can cause loops during initial render
        
        return () => {
            console.log('[Editor] Cleaning up editor.on("update") listener')
            // Clear debounce timer on cleanup
            if (metricsDebounceTimerRef.current) {
                clearTimeout(metricsDebounceTimerRef.current)
                metricsDebounceTimerRef.current = null
            }
            // Reset processing flag on cleanup
            isProcessingMetricsRef.current = false
            editor.off('update', handleUpdate)
        }
    }, [editor]) // Only depend on editor - handleUpdate is stable within this effect

    return (
        <div className="relative flex flex-col h-full bg-white">
            {/* Minimal toolbar - formatting via slash commands */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => editor?.chain().focus().undo().run()} 
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" 
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => editor?.chain().focus().redo().run()} 
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" 
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                        {editor ? (() => {
                            const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
                            const words = countWords(plainText)
                            const readingTimeMinutes = Math.ceil(words / 200)
                            return `${words} words • ${readingTimeMinutes} min read`
                        })() : '0 words • 0 min read'}
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
                        onClose={() => {
                            setPreview(null)
                            props.onSuggestionPopupChange?.(false)
                        }}
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
                                props.onSuggestionPopupChange?.(false)
                                showToast('Suggestion applied', () => {
                                    editor.chain().focus().undo().run()
                                })
                            }
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

            {/* Inline Suggestion Tooltip */}
            {tooltip.visible && tooltip.suggestion && (
                <InlineSuggestionTooltip
                    message={tooltip.suggestion.message}
                    suggestion={tooltip.suggestion.suggestion}
                    issueType={tooltip.suggestion.type}
                    position={tooltip.position}
                    onApply={async () => {
                        if (!editor || !tooltip.suggestion) return
                        
                        // Apply the suggestion
                        const { from, to } = tooltip.suggestion
                        const replacementText = tooltip.suggestion.suggestion || tooltip.suggestion.message
                        
                        editor
                            .chain()
                            .focus()
                            .setTextSelection({ from, to })
                            .insertContent(replacementText)
                            .run()
                        
                        showToast('Suggestion applied')
                        closeTooltip()
                    }}
                    onDismiss={closeTooltip}
                />
            )}
        </div>
    )
})

Editor.displayName = 'Editor'

export default Editor
