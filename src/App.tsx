import { useState, useEffect, useRef } from 'react'
import Editor, { type EditorRef } from './components/Editor'
import Copilot from './components/Copilot'
import { Menu, History, RotateCcw, Eye, X, User as UserIcon, Settings, MessageSquare, HelpCircle } from 'lucide-react'
import { cn, trinkaApi } from './lib/utils'


function App() {
  const [isCopilotCompact, setIsCopilotCompact] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [hasSelection] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistory, setVersionHistory] = useState<any[]>([])
  const [showChat, setShowChat] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [copilotInitialMessage, setCopilotInitialMessage] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState(() => {
    return localStorage.getItem('trinka-document-title') || 'Untitled document'
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorRef>(null)

  const handleInsertText = (text: string) => {
    editorRef.current?.insertContent(text)
  }

  useEffect(() => {
    localStorage.setItem('trinka-document-title', documentTitle)
    document.title = `${documentTitle} - Trinka AI`
  }, [documentTitle])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      // Auto-collapse on tablet
      if (window.innerWidth < 1200 && window.innerWidth >= 900) {
        setIsCopilotCompact(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    if (showMenu || showUserMenu || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu, showUserMenu, showProfileMenu])

  const MOCK_VERSION_HISTORY = [
    {
      id: 'v1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
      action: 'AI Rewrite',
      summary: 'Rewrote introduction for clarity',
      word_count: 450,
      author: 'Trinka AI'
    },
    {
      id: 'v2',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      action: 'Manual Edit',
      summary: 'Updated methodology section',
      word_count: 420,
      author: 'You'
    },
    {
      id: 'v3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      action: 'Paste',
      summary: 'Pasted content from source',
      word_count: 380,
      author: 'You'
    }
  ]

  const fetchVersionHistory = async () => {
    try {
      const response = await fetch(trinkaApi('/versions?limit=5'))
      if (!response.ok) throw new Error('API unavailable')
      const data = await response.json()
      setVersionHistory(data.snapshots || [])
    } catch (error) {
      console.log('Using mock version history')
      setVersionHistory(MOCK_VERSION_HISTORY)
    }
  }

  const handleRestoreVersion = async (snapshotId: string) => {
    try {
      const response = await fetch(trinkaApi(`/versions/${snapshotId}/restore`))
      const data = await response.json()
      if (data.delta) {
        // In production, restore the version in the editor
        console.log('Restoring version:', snapshotId)
        setShowVersionHistory(false)
      }
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const isMobile = windowWidth < 900

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3" style={{ gap: '12px' }}>
            {/* Trinka Logo - Before Menu */}
            <a
              href="/"
              className="flex items-center gap-2"
              aria-label="Trinka home"
              id="brand-logo"
            >
              <img
                src="/assets/branding/trinka-logo.svg"
                alt="Trinka AI"
                className="h-8"
              />
            </a>



            {/* Hamburger Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                aria-label="Open menu"
                id="menu-button"
              >
                <Menu className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600 font-medium">Menu</span>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-[10px] shadow-[0_6px_14px_rgba(0,0,0,0.06)] py-1.5 z-50">
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    My Documents
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Upload File
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowVersionHistory(true)
                      fetchVersionHistory()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    Version History
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span>Export</span>
                    <span className="text-xs text-gray-400">Ctrl+E</span>
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                  >
                    Citation Check
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                  >
                    Plagiarism Check
                  </button>
                </div>
              )}
            </div>

            {/* Document Title (editable) */}
            <div className="text-sm font-medium text-gray-700">
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                maxLength={120}
                className="bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 focus:ring-0 rounded px-2 py-1 text-sm text-gray-800 min-w-[180px] max-w-[260px] truncate outline-none transition-colors"
                aria-label="Document title"
                placeholder="Untitled document"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="w-2 h-2 bg-[#35C28B] rounded-full inline-block mr-2" />
              All changes saved
            </div>
            {/* Chat Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-4 py-1.5 bg-[#6C2BD9] text-white text-sm font-medium rounded-lg hover:bg-[#6C2BD9]/90 transition-colors shadow-sm"
              id="chat-button"
            >
              Chat
            </button>
            {/* Profile Icon */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-[#6C2BD9] text-white flex items-center justify-center hover:bg-[#6C2BD9]/90 transition-colors border-2 border-[#6C2BD9]"
                aria-label="Profile menu"
                id="user-profile-button"
              >
                <UserIcon className="w-4 h-4" />
              </button>
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-[10px] shadow-[0_6px_14px_rgba(0,0,0,0.06)] py-1.5 z-50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    My Conversations
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Give Feedback
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Editor Container with Chat */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor - Adjusts width when chat is open */}
          <div className={cn(
            "overflow-y-auto p-8 transition-all duration-300",
            showChat ? "flex-1" : "w-full"
          )}>
            <Editor
              ref={editorRef}
              onTriggerCopilot={(message?: string) => {
                setShowChat(true)
                if (message) {
                  setCopilotInitialMessage(message)
                }
              }}
            />
          </div>

          {/* Chat Window - Right Side Below Header */}
          {!isMobile && showChat && (
            <aside className="w-[400px] border-l border-gray-200 bg-white flex-shrink-0 flex flex-col">
              <Copilot
                isCompact={isCopilotCompact}
                onToggleCompact={() => setIsCopilotCompact(!isCopilotCompact)}
                hasSelection={hasSelection}
                onClose={() => setShowChat(false)}
                docId="current-doc"
                defaultShowRecommendations={true}
                initialMessage={copilotInitialMessage}
                onMessageHandled={() => setCopilotInitialMessage(null)}
                onInsertText={handleInsertText}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Mobile: Copilot as Bottom Sheet */}
      {isMobile && (
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
      )}

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
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  hour12: true
                                })}
                              </span>
                              <span>•</span>
                              <span>{snapshot.word_count} words</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRestoreVersion(snapshot.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#6C2BD9] hover:bg-[#6C2BD9]/90 rounded-lg transition-colors shadow-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore this version
                          </button>
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
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
