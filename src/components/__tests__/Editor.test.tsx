import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Editor from '../Editor'

// Mock Tiptap to avoid complex editor initialization in tests
vi.mock('@tiptap/react', () => ({
    useEditor: () => ({
        chain: () => ({ focus: () => ({ run: () => { } }) }),
        on: () => { },
        off: () => { },
        getText: () => 'Hello World',
        state: {
            doc: {
                textBetween: () => 'Hello World',
                descendants: () => { },
                content: { size: 11 }
            },
            selection: { from: 0, to: 0 }
        },
        commands: {
            setContent: () => { },
            focus: () => { }
        },
        extensionManager: { extensions: [] }
    }),
    EditorContent: () => <div>Editor Content</div>,
    BubbleMenu: () => <div>Bubble Menu</div>,
    FloatingMenu: () => <div>Floating Menu</div>
}))

vi.mock('../editor/components/FloatingToolbar', () => ({
    FloatingToolbar: () => <div>Floating Toolbar</div>
}))

vi.mock('../editor/components/SlashCommands', () => ({
    configureSlashCommands: () => ({})
}))

vi.mock('../editor/hooks/useAI', () => ({
    useAI: () => ({
        requestRewrite: vi.fn(),
        preview: null
    })
}))

vi.mock('../PopoverManager', () => ({
    usePopover: () => ({
        openPopover: vi.fn(),
        closePopover: vi.fn()
    })
}))

describe('Editor', () => {
    it('should render editor content', () => {
        render(<Editor
            showChat={false}
            setShowChat={() => { }}
            isPrivacyMode={false}
            showHealthSidebar={false}
            setShowHealthSidebar={() => { }}
            setCopilotQuery={() => { }}
        />)
        expect(screen.getByText('Editor Content')).toBeInTheDocument()
    })
})
