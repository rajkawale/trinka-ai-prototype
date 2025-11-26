import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export type GrammarToneIssue = {
    from: number
    to: number
    type: 'grammar' | 'tone' | 'ai-suggestion'
    message: string
    suggestion?: string
}

export const GrammarToneExtension = Extension.create({
    name: 'grammarTone',

    addOptions() {
        return {
            issues: [] as GrammarToneIssue[],
        }
    },

    addProseMirrorPlugins() {
        const extension = this
        return [
            new Plugin({
                key: new PluginKey('grammarTone'),
                state: {
                    init() {
                        return DecorationSet.empty
                    },
                    apply(tr) {
                        const issues = extension.options.issues as GrammarToneIssue[]
                        if (!issues || issues.length === 0) {
                            return DecorationSet.empty
                        }

                        const decorations: Decoration[] = []
                        const doc = tr.doc

                        issues.forEach(issue => {
                            if (issue.from >= 0 && issue.to <= doc.content.size) {
                                const color = 
                                    issue.type === 'grammar' ? '#EF4444' : // red
                                    issue.type === 'tone' ? '#3B82F6' : // blue
                                    '#6B46FF' // purple for AI

                                const decoration = Decoration.inline(
                                    issue.from,
                                    issue.to,
                                    {
                                        class: 'grammar-tone-underline',
                                        style: `border-bottom: 2px solid ${color}; border-bottom-style: wavy; cursor: pointer; position: relative;`,
                                        'data-type': issue.type,
                                        'data-message': issue.message,
                                        'data-suggestion': issue.suggestion || '',
                                    }
                                )
                                decorations.push(decoration)
                            }
                        })

                        return DecorationSet.create(doc, decorations)
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state)
                    },
                },
            }),
        ]
    },
})

