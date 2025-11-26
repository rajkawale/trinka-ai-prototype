import { useState, useEffect, useRef } from 'react'
import Editor from './components/Editor'
import Copilot from './components/Copilot'
import { Menu, History, RotateCcw, Eye, Copy, X, User as UserIcon, Settings, MessageSquare, HelpCircle } from 'lucide-react'
import { cn } from './lib/utils'

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
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

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

  const fetchVersionHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/versions?limit=5')
      const data = await response.json()
      setVersionHistory(data.snapshots || [])
    } catch (error) {
      console.error('Failed to fetch version history:', error)
    }
  }

  const handleRestoreVersion = async (snapshotId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/versions/${snapshotId}/restore`)
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
              <div className="w-8 h-8 bg-[#6B46FF] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                T
              </div>
              <h1 className="font-semibold text-gray-800 text-lg tracking-tight">Trinka AI</h1>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Prototype</span>
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
            
            {/* Document Title */}
            <div className="text-sm font-medium text-gray-700">
              Untitled Document
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
              className="px-4 py-1.5 bg-[#6B46FF] text-white text-sm font-medium rounded-lg hover:bg-[#6B46FF]/90 transition-colors shadow-sm"
              id="chat-button"
            >
              Chat
            </button>
            {/* Profile Icon */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-[#6B46FF] text-white flex items-center justify-center hover:bg-[#6B46FF]/90 transition-colors border-2 border-[#6B46FF]"
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
            <Editor />
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
                onClick={() => {/* Toggle mobile copilot */}}
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
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#6B46FF] hover:bg-[#6B46FF]/10 rounded transition-colors"
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
      )}
    </div>
  )
}

export default App
