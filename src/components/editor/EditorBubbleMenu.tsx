import React from 'react'
import { BubbleMenu, Editor } from '@tiptap/react'
import { Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AiAction {
    id: string
    label: string
    description: string
    mode: string
    icon: any
}

interface EditorBubbleMenuProps {
    editor: Editor | null
    isMoreMenuOpen: boolean
    setIsMoreMenuOpen: (isOpen: boolean) => void
    requestRewrite: (action: AiAction) => void
    primaryActions: AiAction[]
    secondaryActions: AiAction[]
    editorRef: React.RefObject<HTMLDivElement>
}

export const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({
    editor,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
    requestRewrite,
    primaryActions,
    secondaryActions,
    editorRef
}) => {
    if (!editor) return null

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ state, from, to }) => {
                const { selection } = state
                const { empty } = selection
                const text = state.doc.textBetween(from, to, ' ')
                if (empty || !text.trim()) {
                    return false
                }
                return true
            }}
            tippyOptions={{
                duration: 100,
                placement: 'top',
                animation: 'fade',
                interactive: true,
                appendTo: () => editorRef.current || document.body,
                offset: [0, 8],
                zIndex: 100
            }}
        >
            <div
                className="flex items-center gap-1 bg-white/90 backdrop-blur-lg shadow-lg border border-gray-200/50 rounded-full px-2 py-1 overflow-visible animate-in fade-in slide-in-from-bottom-2 relative"
                style={{
                    minHeight: '36px',
                    whiteSpace: 'nowrap'
                }}
            >
                <button
                    onClick={() => requestRewrite({
                        id: 'smart',
                        label: 'Smart Edit',
                        description: 'Auto-improve',
                        mode: 'smart',
                        icon: Sparkles
                    })}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#6B46FF]/10 hover:bg-[#6B46FF]/20 text-[#6B46FF] transition-colors group flex-shrink-0 border border-[#6B46FF]/20"
                    style={{ fontSize: '13px' }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-semibold whitespace-nowrap">Smart Edit</span>
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />

                {primaryActions.map(action => (
                    <button
                        key={action.id}
                        onClick={() => requestRewrite(action)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0"
                        style={{ fontSize: '13px' }}
                        aria-label={action.label}
                    >
                        <action.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                        <span className="font-medium text-gray-700 whitespace-nowrap">{action.label}</span>
                    </button>
                ))}

                <div className="relative">
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0",
                            isMoreMenuOpen && "bg-gray-100"
                        )}
                        style={{ fontSize: '13px' }}
                    >
                        <span className="font-medium text-gray-700 whitespace-nowrap">More</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>

                    {isMoreMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50 flex flex-col">
                            {secondaryActions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => {
                                        requestRewrite(action)
                                        setIsMoreMenuOpen(false)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors w-full"
                                >
                                    <action.icon className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-[13px] text-gray-700">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BubbleMenu>
    )
}
