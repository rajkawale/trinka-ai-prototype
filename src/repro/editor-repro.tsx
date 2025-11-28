import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Undo2 } from 'lucide-react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { FontSize } from '../extensions/FontSize'
import { usePopover } from './PopoverManager'

// Modular components and hooks
import { useEditorState } from '../editor/hooks/useEditorState'
import { useAI } from '../editor/hooks/useAI'
import { configureSlashCommands } from '../editor/components/SlashCommands'
import { FloatingToolbar, PRIMARY_ACTIONS, SECONDARY_ACTIONS } from '../editor/components/FloatingToolbar'
import { WritingAnalysisSidebar } from './editor/WritingAnalysisSidebar'
import { DiffPreviewBubble } from './editor/DiffPreviewBubble'
import { UploadModal } from './editor/UploadModal'
import { createRequestId } from '../editor/utils/editorUtils'

interface EditorProps {
    showChat: boolean
    setShowChat: (show: boolean) => void
    isPrivacyMode: boolean
    initialContent?: string
    showHealthSidebar?: boolean
    setShowHealthSidebar?: (show: boolean) => void
    setCopilotQuery?: (query: string) => void
}

const Editor: React.FC<EditorProps> = ({ showChat, setShowChat, isPrivacyMode, initialContent = '', showHealthSidebar = false, setShowHealthSidebar, setCopilotQuery }) => {
    // State Management
    const {
        isHealthCollapsed, setIsHealthCollapsed,
        writingScore, setWritingScore,
        wordCount, setWordCount,
        readTime, setReadTime,
        isCalculating, setIsCalculating,
        showGoalsModal, setShowGoalsModal,
        selectedFactorForImprovement, setSelectedFactorForImprovement,
        versions, setVersions,
        revisionCount, setRevisionCount,
        preview, setPreview,
        toast, setToast,
        showUploadModal, setShowUploadModal,
        uploadedFiles, setUploadedFiles,
        isMoreMenuOpen, setIsMoreMenuOpen
    } = useEditorState()

    const editorRef = useRef<HTMLDivElement>(null)
    const { openPopover, closePopover } = usePopover()

    // AI Logic
    const {
        preview: aiPreview, // Use local preview from useAI if needed, but we are syncing with state
        setPreview: setAiPreview,
        requestRewrite,
        requestRewriteRef,
        applySuggestion,
        discardSuggestion,
        createSnapshot
    } = useAI({
        editor: null, // Will be set after editor init, but circular dependency here. 
        // Actually useAI needs the editor instance. We need to initialize editor first.
        setRevisionCount,
        setVersions,
        showToast: (msg, undo) => {
            setToast({ message: msg, undo })
            setTimeout(() => setToast(null), 3000)
        },
        createRequestId
    })

    // Sync AI preview state with component state if necessary, or just use AI hook's state
    useEffect(() => {
        if (aiPreview) setPreview(aiPreview)
    }, [aiPreview, setPreview])


    // Editor Configuration
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            Placeholder.configure({ placeholder: 'Start writing or type / for commands...', emptyEditorClass: 'is-editor-empty' }),
            configureSlashCommands({
                setCopilotQuery,
                setShowChat,
                setShowHealthSidebar,
                setShowGoalsModal,
                requestRewriteRef
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Link.configure({ openOnClick: false }),
            Image,
            TaskList,
            TaskItem.configure({ nested: true }),
            FontSize,
        ],
        content: initialContent || `
<h1>Academic Abstract</h1>
<p>The rapid evolution of artificial intelligence (AI) has permeated various sectors, including healthcare, finance, and education. This paper explores the implications of AI integration in academic writing processes, specifically focusing on automated feedback systems.</p>
<p>Researchers must navigate the ethical considerations of using AI tools to assist in drafting and editing manuscripts. While these tools can enhance clarity and reduce grammatical errors, the potential for over-reliance remains a contentious issue.</p>
        `,
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-200px)]',
            },
        },
        onUpdate: ({ editor }) => {
            const text = editor.getText()
            const words = text.trim().split(/\s+/).length
            setWordCount(words)
            setReadTime(`${Math.ceil(words / 200)} min read`)

            // Simulate score update
            if (Math.random() > 0.7) {
                setIsCalculating(true)
                setTimeout(() => {
                    setWritingScore(prev => Math.min(100, Math.max(60, prev + (Math.random() > 0.5 ? 1 : -1))))
                    setIsCalculating(false)
                }, 1500)
            }
        },
    })

    // Update useAI with editor instance
    // This is a bit tricky with hooks. We might need to pass editor to useAI functions directly or use a ref.
    // But useAI expects editor in props.
    // Let's refactor useAI to accept editor in the returned functions or use a context/ref.
    // For now, let's re-implement the hook usage to pass the editor.
    // Actually, we can't change the hook call order or arguments dynamically.
    // We should probably pass a ref to the editor to useAI.

    // WORKAROUND: We will re-create the AI logic here using the hook but we need to pass the editor.
    // Since useEditor returns null initially, useAI needs to handle null editor.
    // We already handled `if (!editor) return` in useAI functions.
    // So we just need to pass the `editor` object from `useEditor` to `useAI`.
    // But `useAI` is called BEFORE `useEditor` in the code above (conceptually).
    // Wait, `useEditor` is a hook. `useAI` is a hook.
    // We can call `useEditor` first? No, `configureSlashCommands` needs `requestRewriteRef` which comes from `useAI`.
    // Circular dependency!

    // Solution: `requestRewriteRef` is a ref. We can create it in `Editor` and pass it to both.
    // `useAI` can use the ref passed to it, or expose it.
    // `useAI` exposes `requestRewriteRef`.
    // So `useAI` must be called first.
    // But `useAI` needs `editor`.
    // We can pass `editor` to `useAI` but it will be null on first render.
    // `useAI` should be resilient to null editor.
    // On subsequent renders, `editor` will be populated.

    // Let's fix the `useAI` call below.

    const aiLogic = useAI({
        editor, // This will be null initially, then populated
        setRevisionCount,
        setVersions,
        showToast: (msg, undo) => {
            setToast({ message: msg, undo })
            setTimeout(() => setToast(null), 3000)
        },
        createRequestId
    })

    // We need to sync the ref from aiLogic to the one used in configureSlashCommands
    // Actually configureSlashCommands uses aiLogic.requestRewriteRef directly if we pass it.

    // Re-configure extensions when dependencies change? 
    // `useEditor` extensions are usually static.
    // But `requestRewriteRef` is a ref, so it's stable.
    // The *current* value of the ref changes, but the ref object itself is stable.
    // So passing `aiLogic.requestRewriteRef` to `configureSlashCommands` is fine.

    const qualitySignals = [
        { label: 'Clarity', value: 'Good', status: 'success' },
        { label: 'Engagement', value: 'Needs Work', status: 'warning' },
        { label: 'Delivery', value: 'Strong', status: 'success' },
        { label: 'Style Guide', value: '1 Issue', status: 'error' },
    ]

    const outline = [
        { id: '1', label: 'Introduction', level: 1, position: 0 },
        { id: '2', label: 'Background', level: 2, position: 100 },
        { id: '3', label: 'Methodology', level: 2, position: 300 },
    ]

    // Mouseover effect for grammar/tone
    useEffect(() => {
        if (!editor) return

        let hoverTimeout: NodeJS.Timeout
        let currentTarget: HTMLElement | null = null

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('grammar-tone-underline')) {
                if (currentTarget === target) return
                currentTarget = target
                hoverTimeout = setTimeout(() => {
                    // Show popover logic
                }, 300)
            }
        }

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.classList.contains('grammar-tone-underline')) {
                clearTimeout(hoverTimeout)
                currentTarget = null
            }
        }

        editor.view.dom.addEventListener('mouseover', handleMouseOver)
        editor.view.dom.addEventListener('mouseout', handleMouseOut)
        return () => {
            editor.view.dom.removeEventListener('mouseover', handleMouseOver)
            editor.view.dom.removeEventListener('mouseout', handleMouseOut)
            clearTimeout(hoverTimeout)
        }
    }, [editor])

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
        <div className="w-full flex gap-4 h-full" ref={editorRef}>
            {/* Left Panel - Writing Analysis (Sidebar) */}
            {showHealthSidebar && (
                <WritingAnalysisSidebar
                    editor={editor}
                    isHealthCollapsed={isHealthCollapsed}
                    writingScore={writingScore}
                    wordCount={wordCount}
                    readTime={readTime}
                    qualitySignals={qualitySignals}
                    outline={outline}
                    setSelectedFactorForImprovement={setSelectedFactorForImprovement}
                />
            )}

            {/* Main Editor Area */}
            <div className="flex-1 min-w-0 relative h-full flex flex-col">
                <FloatingToolbar
                    editor={editor}
                    isMoreMenuOpen={isMoreMenuOpen}
                    setIsMoreMenuOpen={setIsMoreMenuOpen}
                    requestRewrite={aiLogic.requestRewrite}
                    editorRef={editorRef}
                />

                <EditorContent editor={editor} className="h-full flex-1" />
            </div>

            {/* Diff Preview Bubble */}
            <DiffPreviewBubble
                preview={aiLogic.preview}
                applySuggestion={aiLogic.applySuggestion}
                discardSuggestion={aiLogic.discardSuggestion}
            />

            {/* Toast */}
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
            <UploadModal
                showUploadModal={showUploadModal}
                setShowUploadModal={setShowUploadModal}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                handleFileUpload={handleFileUpload}
            />
        </div>
    )
}

export default Editor
