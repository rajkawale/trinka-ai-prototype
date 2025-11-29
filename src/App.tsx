import { useState, useEffect, useRef } from 'react'
import Editor, { type EditorRef } from './components/Editor'
import Copilot from './components/Copilot'
import { Menu, History, RotateCcw, Eye, X, User as UserIcon, Copy } from 'lucide-react'
import { cn } from './lib/utils'
import ScorePill from './components/ScorePill'
import CopilotFab from './components/CopilotFab'
import WritingQualityPanel from './components/WritingQualityPanel'

function App() {
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  // Mock version history for display
  const [versionHistory] = useState<unknown[]>([])
  const [showChat, setShowChat] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showQualityPanel, setShowQualityPanel] = useState(false)

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

  const handleInsertText = (text: string) => {
    editorRef.current?.insertContent(text)
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + T: Toggle Copilot
      if (e.ctrlKey && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault()
        setShowChat(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
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

            {/* Score Pill - Toggles Writing Quality Panel */}
            <ScorePill
              score={writingScore}
              onClick={() => setShowQualityPanel(prev => !prev)}
            />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:ring-2 hover:ring-[#6C2BD9]/20 transition-all"
              >
                <UserIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Editor Container with Chat */}
        <div className="flex-1 overflow-hidden flex relative">
          {/* Editor - Adjusts width when chat is open */}
          <div className={cn(
            "overflow-y-auto p-8 transition-all duration-300",
            showChat ? "flex-1" : "w-full flex justify-center"
          )}>
            <div className={cn("transition-all duration-300", showChat ? "w-full" : "w-full max-w-5xl")}>
              <Editor
                ref={editorRef}
                setShowChat={setShowChat}
                setShowHealthSidebar={setShowHealthSidebar}
                setCopilotQuery={setCopilotQuery}
                onMetricsChange={(wc, rt) => {
                  setWordCount(wc)
                  setReadTime(rt)
                }}
              />
            </div>
          </div>

          {/* Chat Window - Right Side Below Header */}
          {!isMobile && (
            <aside className={cn(
              "border-l border-gray-200 bg-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
              showChat ? "w-[400px] translate-x-0" : "w-0 translate-x-full opacity-0"
            )}>
              <Copilot
                onClose={() => setShowChat(false)}
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
              onClick={() => setShowChat(true)}
            />
          </div>
        )}

        {/* Writing Quality Panel */}
        <WritingQualityPanel
          isOpen={showQualityPanel}
          onClose={() => setShowQualityPanel(false)}
          score={writingScore}
          wordCount={wordCount}
          readTime={readTime}
          onApplyFix={(fix) => {
            if (editorRef.current?.applyImprovementFix) {
              editorRef.current.applyImprovementFix(fix)
            }
          }}
        />
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
