import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { SlashCommandList } from '../components/SlashCommandList'
import {
    MessageSquare, Sparkles, Brain, BookOpen, Gauge, Settings,
    Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus,
    Table, Code, Sigma, Image as ImageIcon, FileText, StickyNote,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react'

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: { editor: any, range: any, props: any }) => {
                    props.command({ editor, range })
                },
            },
            callbacks: {} // { openCopilot, openSidebar, openPreferences, ... }
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})

export const getSuggestionItems = ({ query, callbacks }: { query: string, callbacks: any }) => {
    return [
        // AI ACTIONS
        {
            title: 'Chat with Trinka',
            description: 'Ask anything or get help',
            searchTerms: ['ask', 'chat', 'ai', 'help'],
            icon: MessageSquare,
            category: 'AI Actions',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                callbacks.openCopilot?.(query) // Pass query if needed
            },
        },
        {
            title: 'Smart Edit',
            description: 'Improve selected text or paragraph',
            searchTerms: ['edit', 'improve', 'fix'],
            icon: Sparkles,
            category: 'AI Actions',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                // Trigger smart edit logic
                callbacks.triggerSmartEdit?.()
            },
        },
        {
            title: 'Brainstorm ideas',
            description: 'Generate ideas for this section',
            searchTerms: ['idea', 'generate', 'brainstorm'],
            icon: Brain,
            category: 'AI Actions',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                callbacks.openCopilot?.('Brainstorm ideas for: ')
            },
        },
        {
            title: 'Fact Check',
            description: 'Verify facts in this section',
            searchTerms: ['fact', 'check', 'verify'],
            icon: BookOpen,
            category: 'AI Actions',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                callbacks.openCopilot?.('Fact check this: ')
            },
        },
        {
            title: 'Writing Analysis',
            description: 'Open analysis sidebar',
            searchTerms: ['analysis', 'score', 'stats'],
            icon: Gauge,
            category: 'AI Actions',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                callbacks.openAnalysis?.()
            },
        },
        {
            title: 'Writing Preferences',
            description: 'Change tone and style settings',
            searchTerms: ['settings', 'preferences', 'goals'],
            icon: Settings,
            category: 'AI Actions',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                callbacks.openPreferences?.()
            },
        },

        // FORMATTING
        {
            title: 'Heading 1',
            description: 'Big section heading',
            searchTerms: ['h1', 'heading', 'title'],
            icon: Heading1,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
            },
        },
        {
            title: 'Heading 2',
            description: 'Medium section heading',
            searchTerms: ['h2', 'heading', 'subtitle'],
            icon: Heading2,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
            },
        },
        {
            title: 'Heading 3',
            description: 'Small section heading',
            searchTerms: ['h3', 'heading', 'subsubtitle'],
            icon: Heading3,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
            },
        },
        {
            title: 'Bullet List',
            description: 'Create a simple bullet list',
            searchTerms: ['list', 'bullet', 'unordered'],
            icon: List,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
            },
        },
        {
            title: 'Numbered List',
            description: 'Create a numbered list',
            searchTerms: ['list', 'numbered', 'ordered'],
            icon: ListOrdered,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
            },
        },
        {
            title: 'Quote',
            description: 'Capture a quote',
            searchTerms: ['quote', 'blockquote'],
            icon: Quote,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run()
            },
        },
        {
            title: 'Divider',
            description: 'Visually separate sections',
            searchTerms: ['divider', 'hr', 'line'],
            icon: Minus,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run()
            },
        },

        {
            title: 'Bold',
            description: 'Make text bold',
            searchTerms: ['bold', 'strong'],
            icon: Bold,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleBold().run()
            },
        },
        {
            title: 'Italic',
            description: 'Make text italic',
            searchTerms: ['italic', 'emphasis'],
            icon: Italic,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleItalic().run()
            },
        },
        {
            title: 'Align Left',
            description: 'Align text to left',
            searchTerms: ['align', 'left'],
            icon: AlignLeft,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setTextAlign('left').run()
            },
        },
        {
            title: 'Align Center',
            description: 'Center align text',
            searchTerms: ['align', 'center'],
            icon: AlignCenter,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setTextAlign('center').run()
            },
        },
        {
            title: 'Align Right',
            description: 'Align text to right',
            searchTerms: ['align', 'right'],
            icon: AlignRight,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setTextAlign('right').run()
            },
        },
        {
            title: 'Justify',
            description: 'Justify text',
            searchTerms: ['align', 'justify'],
            icon: AlignJustify,
            category: 'Formatting',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setTextAlign('justify').run()
            },
        },

        // INSERT
        {
            title: 'Table',
            description: 'Insert a simple table',
            searchTerms: ['table', 'grid'],
            icon: Table,
            category: 'Insert',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).insertContent('<table><tr><td></td><td></td></tr></table>').run()
            },
        },
        {
            title: 'Code Block',
            description: 'Insert a code snippet',
            searchTerms: ['code', 'snippet', 'block'],
            icon: Code,
            category: 'Insert',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
            },
        },
        {
            title: 'Equation',
            description: 'Insert a mathematical equation',
            searchTerms: ['math', 'equation', 'latex'],
            icon: Sigma,
            category: 'Insert',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).insertContent('$E=mc^2$').run()
            },
        },
        {
            title: 'Image',
            description: 'Upload or insert an image',
            searchTerms: ['image', 'photo', 'picture'],
            icon: ImageIcon,
            category: 'Insert',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run()
                // Trigger image upload
                const url = window.prompt('Enter image URL')
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run()
                }
            },
        },

        // SMART BLOCKS
        {
            title: 'Academic Abstract',
            description: 'Generate an abstract block',
            searchTerms: ['abstract', 'academic', 'summary'],
            icon: FileText,
            category: 'Smart Blocks',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).insertContent('<h1>Abstract</h1><p>[Abstract content will be generated here...]</p>').run()
            },
        },
        {
            title: 'Research Paragraph',
            description: 'Structured research paragraph',
            searchTerms: ['research', 'paragraph'],
            icon: StickyNote,
            category: 'Smart Blocks',
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).insertContent('<p><strong>Topic sentence:</strong> ...</p><p><strong>Evidence:</strong> ...</p><p><strong>Analysis:</strong> ...</p>').run()
            },
        },
    ].filter(item => {
        if (typeof query === 'string' && query.length > 0) {
            const search = query.toLowerCase()
            return (
                item.title.toLowerCase().includes(search) ||
                item.description?.toLowerCase().includes(search) ||
                (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
            )
        }
        return true
    })
}

export const renderItems = () => {
    let component: ReactRenderer | null = null
    let popup: any | null = null

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
            })

            if (!props.clientRect) {
                return
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            })
        },

        onUpdate: (props: any) => {
            component?.updateProps(props)

            if (!props.clientRect) {
                return
            }

            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            })
        },

        onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
            }
            return (component?.ref as any)?.onKeyDown(props)
        },

        onExit: () => {
            popup[0].destroy()
            component?.destroy()
        },
    }
}
