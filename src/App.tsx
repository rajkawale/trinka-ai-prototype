import { useState, useEffect } from 'react'
import Editor from './components/Editor'
import Copilot from './components/Copilot'
import { RotateCcw, Eye, Copy, X, User as UserIcon, Menu } from 'lucide-react'
import { cn } from './lib/utils'
import ScorePill from './components/ScorePill'
import CopilotFab from './components/CopilotFab'


function App() {
  const [isCopilotCompact, setIsCopilotCompact] = useState(false)
  const [windowWidth] = useState(window.innerWidth)
  const [hasSelection] = useState(false)

  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistory] = useState<unknown[]>([])
  const [showChat, setShowChat] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isPrivacyMode] = useState(false)
  const [documentTitle, setDocumentTitle] = useState(() => {
    return localStorage.getItem('trinka-document-title') || 'Untitled document'
  })
  const [showHealthSidebar, setShowHealthSidebar] = useState(false)
  const [copilotQuery, setCopilotQuery] = useState('')

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

  // ... (refs)

  // ... (effects)

  // ... (fetchVersionHistory)

  // ... (handleRestoreVersion)

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

            {/* Score Pill (Placeholder score for now) */}
            <ScorePill
              score={92}
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
                showChat={showChat}
                setShowChat={setShowChat}
                isPrivacyMode={isPrivacyMode}
                showHealthSidebar={showHealthSidebar}
                setShowHealthSidebar={setShowHealthSidebar}
                setCopilotQuery={setCopilotQuery}
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
                isCompact={isCopilotCompact}
                onToggleCompact={() => setIsCopilotCompact(!isCopilotCompact)}
                hasSelection={hasSelection}
                isPrivacyMode={isPrivacyMode}
                onClose={() => setShowChat(false)}
                initialQuery={copilotQuery}
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
                hasSelection={hasSelection}
              />
            </div>
          </div>
        )
      }

      {/* Version History Modal */}
      {
        showVersionHistory && (
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
              <div className="space-y-2">
                {versionHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No versions yet</p>
                ) : (
                  versionHistory.map((snapshot: any) => {
                    const snapshotSize = snapshot.delta ? (JSON.parse(snapshot.delta).text?.split(/\s+/).length || 0) : 0
                    return (
                      <div key={snapshot.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{snapshot.summary || snapshot.action}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(snapshot.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">{snapshot.word_count} words</span>
                              {snapshotSize > 0 && (
                                <span className="text-xs text-gray-500">Snapshot: {snapshotSize} words</span>
                              )}
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
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}


export default App
