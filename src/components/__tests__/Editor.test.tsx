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

describe('Editor', () => {
    it('should render editor content', () => {
        render(<Editor />)
        expect(screen.getByText('Editor Content')).toBeInTheDocument()
    })
})
