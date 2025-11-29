import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { GrammarToneExtension } from '../extensions/GrammarToneExtension'
import type { GrammarToneIssue } from '../extensions/GrammarToneExtension'
import { cn, getTrinkaApi } from '../lib/utils'

import GoalsModal, { type Goals } from './GoalsModal'

import SuggestionsModal from './SuggestionsModal'
import { usePopover } from './PopoverManager'
import RecommendationDetailPopover from './RecommendationDetailPopover'
import { Portal } from './Portal'
import type { Recommendation, ActionType } from './RecommendationCard'

import { countWords } from '../editor/utils/countWords'
import { useAI } from '../editor/hooks/useAI'
import { configureSlashCommands } from '../editor/components/SlashCommands'
// import { FloatingToolbar } from '../editor/components/FloatingToolbar'
import { createRequestId } from '../editor/utils/editorUtils'
import { WritingScorePill } from '../editor/components/WritingScorePill'
import type { QualitySignal } from '../editor/types'
import ImprovementSuggestionsModal from './ImprovementSuggestionsModal'
import { SuggestionPopup } from '../editor/components/SuggestionPopup'
import {
    X,
    History,
    Undo2,
    Upload,
    FileText
} from 'lucide-react'

type VersionSnapshot = {
    id: string
    timestamp: string
    action: string
    delta: string
}

interface EditorProps {
    showChat: boolean
    setShowChat: (show: boolean) => void
    isPrivacyMode: boolean
    showHealthSidebar: boolean
    setShowHealthSidebar: (show: boolean) => void
    setCopilotQuery: (query: string) => void
}

const Editor: React.FC<EditorProps> = ({
    showChat,
    setShowChat,
    isPrivacyMode: _isPrivacyMode,
    showHealthSidebar,
    setShowHealthSidebar,
    setCopilotQuery
}) => {
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
                                    // Transactional apply
                                    editor.chain()
                                        .focus()
                                        .setTextSelection({ from: fromPos, to: toPos })
                                        .insertContent(suggestion)
                                        .run()

                                    // Update state
                                    setRevisionCount(prev => prev + 1)

                                    // Log
                                    console.debug('trinka:suggestion_apply', {
                                        id: recommendation.id,
                                        selectionHash: `${docId}-${recommendation.originalText}`,
                                        suggestion
                                    })

                                    // Update word count immediately
                                    const plainText = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
                                    const words = plainText.trim().split(/\s+/).filter(Boolean).length
                                    console.debug('trinka:wordcount', words)

                                    showToast('Suggestion applied')
                                } else {
                                    showToast('Selection lost. Select text and try again.')
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



    const handleApplyQuickFix = (fix: string) => {
        showToast(`Applying fix: ${fix}...`)
        setTimeout(() => {
            showToast(`Applied: ${fix}`)
            createSnapshot('Quick Fix', fix)
        }, 1000)
    }






    if (!editor) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Initializing editor...
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

            {/* Expanded Toolbar - REMOVED */}
            <div className="h-4" />

            {/* Glassmorphic Inline Toolbar - REMOVED per user request */}

            <EditorContent editor={editor} />

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

            {/* Suggestion Popup - Phase 3 Spec */}
            <SuggestionPopup
                isOpen={!!preview}
                onClose={discardSuggestion}
                originalText={preview?.original || ''}
                onAccept={applySuggestion}
                selectionRect={preview ? window.getSelection()?.getRangeAt(0).getBoundingClientRect() : null}
                initialTab={preview?.initialTab}
                onSendToCopilot={(query) => {
                    setCopilotQuery(query)
                    setShowChat(true)
                    discardSuggestion()
                }}
            />

            {/* Toast with Undo - P0 Spec - Moved to Portal */}
            <Portal>
                {toast && (
                    <div className="fixed bottom-6 left-6 bg-[#1F1F1F] text-white text-[13px] px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 z-[10000] animate-in fade-in slide-in-from-bottom-2 font-sans">
                        <span>{toast.message}</span>
                        {toast.undo && (
                            <button
                                onClick={() => {
                                    toast.undo?.()
                                    setToast(null)
                                }}
                                className="text-[#6F4FF0] hover:text-[#8F75FF] font-medium flex items-center gap-1"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                Undo
                            </button>
                        )}
                    </div>
                )}
            </Portal>

            {/* Upload Modal */}
            {
                showUploadModal && (
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
                )
            }

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
                    // Mock dismissal - no API call needed in dev
                    setTopSuggestions(prev => prev.filter(s => s.id !== id))
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
            {
                selectedFactorForImprovement && (
                    <ImprovementSuggestionsModal
                        factor={selectedFactorForImprovement}
                        onClose={() => setSelectedFactorForImprovement(null)}
                        onApplyFix={handleApplyQuickFix}
                    />
                )
            }
            {/* Writing Score Pill - Controlled Panel */}
            <WritingScorePill
                score={writingScore}
                signals={qualitySignals}
                wordCount={wordCount}
                readTime={readTime}
                revisionCount={revisionCount}
                onOpenGoals={() => setShowGoalsModal(true)}
                onOpenHistory={() => setShowVersionTimeline(true)}
                isOpen={showHealthSidebar && !preview && !showChat} // Auto-close if popup or Copilot is open
                onToggle={() => setShowHealthSidebar(!showHealthSidebar)}
            />
        </div >
    )
}

export default Editor
