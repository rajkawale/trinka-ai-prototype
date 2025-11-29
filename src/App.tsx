import { useState, useEffect, useRef, useCallback, startTransition } from 'react'
import Editor, { type EditorRef } from './components/Editor'
import Copilot from './components/Copilot'
import { Menu, History, RotateCcw, Eye, X, User as UserIcon, Copy } from 'lucide-react'
import { cn } from './lib/utils'
import ScorePill from './components/ScorePill'
import CopilotFab from './components/CopilotFab'
import WritingQualityPanel from './components/WritingQualityPanel'
import ProfileMenu from './components/ProfileMenu'
import GoalsModal from './components/GoalsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePanelState } from './hooks/usePanelState'
import { useDebounceClick } from './hooks/useDebounceClick'

function App() {
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  // Mock version history for display
  const [versionHistory] = useState<unknown[]>([])

  // Unified panel state management
  const panelState = usePanelState()
  const showChat = panelState.isOpen('sidebar')
  const showProfileMenu = panelState.isOpen('profile')
  const showQualityPanel = panelState.isOpen('score')
  const showGoalsModal = panelState.isOpen('goals')

  // Store panelState functions in refs to avoid recreating callbacks
  // The object reference changes on every render, but we use a ref to access the latest without causing re-renders
  const panelStateRef = useRef(panelState)
  // Update ref on every render (this doesn't cause re-renders since refs don't trigger effects)
  panelStateRef.current = panelState

  const scorePillRef = useRef<HTMLButtonElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)

  const [_showHealthSidebar, setShowHealthSidebar] = useState(false)
  const [_copilotQuery, setCopilotQuery] = useState('')
  const [windowWidth] = useState(window.innerWidth)
  const [documentTitle, setDocumentTitle] = useState(() => {
    return localStorage.getItem('trinka-document-title') || 'Untitled document'
  })

  // Mock writing metrics - in production, these would come from editor state
  const [writingScore] = useState(92)
  const [wordCount, setWordCount] = useState(0)
  const [readTime, setReadTime] = useState('0 min')

  const editorRef = useRef<EditorRef>(null)

  const handleInsertText = useCallback((text: string) => {
    editorRef.current?.insertContent(text)
  }, [])

  // Stable callbacks for Editor - defined at component level to prevent recreation
  const handleMetricsChange = useCallback((wc: number, rt: string) => {
    console.log('[App] onMetricsChange called', { wordCount: wc, readTime: rt })

    // Batch both updates together in a single startTransition
    // This prevents multiple re-renders and cascading effects
    startTransition(() => {
      // Use functional updates to check and update in one go
      setWordCount(prev => prev === wc ? prev : wc)
      setReadTime(prev => prev === rt ? prev : rt)
    })
  }, [])

  const handleSuggestionPopupChange = useCallback((isOpen: boolean) => {
    console.log('[App] onSuggestionPopupChange called', { isOpen })
    const currentPanelState = panelStateRef.current
    if (isOpen) {
      // Close other panels when suggestion popup opens
      currentPanelState.closeAllPanelsExcept('suggestion')
      currentPanelState.openPanel('suggestion')
    } else {
      currentPanelState.closePanel('suggestion')
    }
  }, [])

  // Stable callback for Editor setShowChat - defined at component level
  const handleSetShowChat = useCallback((show: boolean) => {
    if (show) {
      panelStateRef.current.closeAllPanelsExcept('sidebar')
      panelStateRef.current.openPanel('sidebar')
    } else {
      panelStateRef.current.closePanel('sidebar')
    }
  }, [])

  // Stable callbacks for Copilot - defined at component level
  const handleCopilotClose = useCallback(() => {
    panelStateRef.current.closePanel('sidebar')
  }, [])

  const handleProfileClose = useCallback(() => {
    panelStateRef.current.closePanel('profile')
  }, [])

  const handleProfileOpenGoals = useCallback(() => {
    panelStateRef.current.closePanel('profile')
    panelStateRef.current.openPanel('goals')
  }, [])

  const handleQualityPanelClose = useCallback(() => {
    panelStateRef.current.closePanel('score')
  }, [])

  const handleOpenScoreSubPopup = useCallback(() => {
    panelStateRef.current.openScoreSubPopup()
  }, [])

  const handleCloseScoreSubPopup = useCallback(() => {
    panelStateRef.current.closeScoreSubPopup()
  }, [])

  const handleGoalsClose = useCallback(() => {
    panelStateRef.current.closePanel('goals')
  }, [])

  const handleGoalsSave = useCallback((goals: any) => {
    console.log('Goals saved:', goals)
    panelStateRef.current.closePanel('goals')
  }, [])

  // Debounced click handlers to prevent double-click issues
  const handleScoreClick = useDebounceClick(() => {
    if (showQualityPanel) {
      panelState.closePanel('score')
    } else {
      panelState.closeAllPanelsExcept('score')
      panelState.openPanel('score')
    }
  }, 200)

  const handleProfileClick = useDebounceClick(() => {
    if (showProfileMenu) {
      panelState.closePanel('profile')
    } else {
      panelState.closeAllPanelsExcept('profile')
      panelState.openPanel('profile')
    }
  }, 200)

  const handleCopilotClick = useDebounceClick(() => {
    if (showChat) {
      panelState.closePanel('sidebar')
    } else {
      panelState.closeAllPanelsExcept('sidebar')
      panelState.openPanel('sidebar')
    }
  }, 200)

  // Global Keyboard Shortcuts using custom hook
  useKeyboardShortcuts({
    onOpenCopilot: () => {
      panelState.closeAllPanelsExcept('sidebar')
      panelState.openPanel('sidebar')
    },
    onRephrase: () => editorRef.current?.triggerRephrase?.(),
    onGrammarFixes: () => editorRef.current?.triggerGrammarFixes?.(),
    onClosePopup: () => {
      panelState.closeAllPanels()
    },
    enabled: true
  })

  // Close all panels when clicking outside (handled by individual components)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panelStateRef.current.closeAllPanels()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, []) // Empty deps - we use ref to access current panelState

  const handleRestoreVersion = (id: string) => {
    console.log('Restore version:', id)
  }

  const isMobile = windowWidth < 900

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3" style={{ gap: '12px' }}>
            {/* Menu & Logo */}
            <div className="flex items-center gap-4">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none active:ring-0"
                onMouseDown={(e) => {
                  // Prevent default focus behavior on mousedown
                  e.preventDefault()
                }}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {/* Official Logo Placeholder - User to replace src if needed */}
                <img
                  src="https://www.trinka.ai/static/img/trinka-logo.svg"
                  alt="Trinka AI"
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                {/* Fallback Logo */}
                <div className="hidden flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C2BD9] rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <span className="font-semibold text-gray-800 text-lg tracking-tight">Trinka AI</span>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <input
              value={documentTitle}
              onChange={(e) => {
                setDocumentTitle(e.target.value)
                localStorage.setItem('trinka-document-title', e.target.value)
              }}
              className="text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#6C2BD9]/20 rounded px-2 py-1 transition-all outline-none w-64 truncate"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="w-2 h-2 bg-[#35C28B] rounded-full inline-block mr-2" />
              All changes saved
            </div>

            <div className="h-6 w-px bg-gray-200" />


            {/* Profile */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Immediately blur ALL focused elements to prevent any highlighting
                  const activeElement = document.activeElement as HTMLElement
                  if (activeElement && activeElement.blur) {
                    activeElement.blur()
                  }
                  // Blur any other potentially focused elements
                  const allButtons = document.querySelectorAll('button, a, input, textarea, select')
                  allButtons.forEach(btn => {
                    if (btn instanceof HTMLElement && document.activeElement === btn) {
                      btn.blur()
                    }
                  })
                  // Remove focus from body if somehow it got focused
                  if (document.body) {
                    document.body.blur()
                  }
                  // Open menu after ensuring no elements are focused
                  handleProfileClick()
                }}
                onMouseDown={(e) => {
                  // Prevent default focus behavior on mousedown - this is critical
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onFocus={(e) => {
                  // Immediately blur on focus to prevent visual highlighting
                  setTimeout(() => {
                    e.currentTarget.blur()
                  }, 0)
                }}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none active:ring-0 focus-within:outline-none"
                aria-label="Profile menu"
                tabIndex={0}
              >
                <UserIcon className="w-4 h-4 text-gray-600" />
              </button>

              {/* Profile Menu Dropdown */}
              <ProfileMenu
                isOpen={showProfileMenu}
                onClose={handleProfileClose}
                anchorElement={profileButtonRef.current}
                onOpenWritingGoals={handleProfileOpenGoals}
              />
            </div>
          </div>
        </header>

        {/* Editor Container with Chat */}
        <div className="flex-1 overflow-hidden flex relative">
          {/* Editor - Auto-adjusts width when Copilot is open */}
          <div className={cn(
            "overflow-y-auto p-8 transition-all duration-300 ease-out",
            showChat ? "flex-1 min-w-0" : "w-full flex justify-center"
          )}>
            <div className={cn(
              "transition-all duration-300 ease-out",
              showChat ? "w-full max-w-none" : "w-full max-w-5xl"
            )}>
              <Editor
                ref={editorRef}
                setShowChat={handleSetShowChat}
                setShowHealthSidebar={setShowHealthSidebar}
                setCopilotQuery={setCopilotQuery}
                onMetricsChange={handleMetricsChange}
                onSuggestionPopupChange={handleSuggestionPopupChange}
              />
            </div>
          </div>

          {/* Chat Window - Right Side - Side by side with editor (no overlay) */}
          {!isMobile && (
            <aside className={cn(
              "flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden transition-all duration-300 ease-out",
              showChat
                ? "w-[400px] opacity-100"
                : "w-0 opacity-0 pointer-events-none overflow-hidden"
            )}>
              <Copilot
                isCompact={false}
                onToggleCompact={handleCopilotClose}
                onClose={handleCopilotClose}
                docId="current-doc"
                defaultShowRecommendations={true}
                onInsertText={handleInsertText}
              />
            </aside>
          )}
        </div>

        {/* Copilot FAB - Only visible when chat is closed */}
        {!showChat && !isMobile && (
          <div className="fixed bottom-8 right-8 z-50 animate-in fade-in zoom-in duration-300">
            <CopilotFab
              isOpen={showChat}
              onClick={handleCopilotClick}
            />
          </div>
        )}

        {/* Writing Score Button - Left Side Bottom Positioned */}
        <div className={cn(
          "fixed z-40 transition-all duration-300",
          "left-4 bottom-6" // Bottom-left position like image 2
        )}>
          <ScorePill
            ref={scorePillRef}
            score={writingScore}
            isOpen={showQualityPanel}
            onClick={handleScoreClick}
          />
        </div>

        {/* Writing Quality Panel - Opens floating from score button on left */}
        <WritingQualityPanel
          isOpen={showQualityPanel}
          onClose={() => panelState.closePanel('score')}
          score={writingScore}
          wordCount={wordCount}
          readTime={readTime}
          position="floating"
          anchorElement={scorePillRef.current}
          isScoreSubPopupOpen={panelState.isScoreSubPopupOpen}
          onOpenSubPopup={() => panelState.openScoreSubPopup()}
          onCloseSubPopup={() => panelState.closeScoreSubPopup()}
          onApplyFix={(fix) => {
            if (editorRef.current?.applyImprovementFix) {
              editorRef.current.applyImprovementFix(fix)
            }
          }}
        />

        {/* Goals Modal */}
        {showGoalsModal && (
          <GoalsModal
            isOpen={showGoalsModal}
            onClose={() => panelState.closePanel('goals')}
            initialGoals={{
              audience: 'expert',
              formality: 'formal',
              domain: 'academic',
              intent: 'inform'
            }}
            onSave={(goals) => {
              console.log('Goals saved:', goals)
              panelState.closePanel('goals')
            }}
          />
        )}
      </main>

      {/* Mobile: Copilot as Bottom Sheet */}
      {
        isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl z-50 max-h-[60vh]">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Trinka Copilot</h3>
                <button
                  onClick={() => {/* Toggle mobile copilot */ }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <span className="text-xs text-gray-600">Close</span>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(60vh-60px)]">
              <Copilot
                onInsertText={handleInsertText}
              />
            </div>
          </div>
        )
      }

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowVersionHistory(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Version History</h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {versionHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No version history available</p>
                  <p className="text-sm text-gray-400 mt-1">Edits will appear here automatically</p>
                </div>
              ) : (
                <div className="relative pl-4 border-l border-gray-200 space-y-8">
                  {versionHistory.map((snapshot: any, index) => (
                    <div key={snapshot.id} className="relative">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                        index === 0 ? "bg-[#6C2BD9]" : "bg-gray-300"
                      )} />

                      <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors border border-gray-100 group">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 text-sm">
                                {snapshot.summary || snapshot.action}
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-[#6C2BD9]/10 text-[#6C2BD9] text-[10px] font-bold uppercase tracking-wider rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {snapshot.author || 'Trinka AI'}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(snapshot.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleRestoreVersion(snapshot.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#6C2BD9] hover:bg-[#6C2BD9]/10 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Diff
                          </button>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy to new page
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
