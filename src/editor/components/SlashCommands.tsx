import { SlashCommand, getSuggestionItems, renderItems } from '../../extensions/SlashCommand'
import { Sparkles } from 'lucide-react'

interface SlashCommandConfigProps {
    setCopilotQuery?: (query: string) => void
    setShowChat: (show: boolean) => void
    setShowHealthSidebar?: (show: boolean) => void
    setShowGoalsModal: (show: boolean) => void
    requestRewriteRef: React.MutableRefObject<any>
}

export const configureSlashCommands = ({
    setCopilotQuery,
    setShowChat,
    setShowHealthSidebar,
    setShowGoalsModal,
    requestRewriteRef
}: SlashCommandConfigProps) => {
    return SlashCommand.configure({
        suggestion: {
            items: ({ query }: { query: string }) => getSuggestionItems({
                query,
                callbacks: {
                    openCopilot: (initialQuery?: string) => {
                        if (initialQuery && setCopilotQuery) {
                            setCopilotQuery(initialQuery)
                        }
                        setShowChat(true)
                    },
                    openAnalysis: () => setShowHealthSidebar?.(true),
                    openPreferences: () => setShowGoalsModal(true),
                    triggerSmartEdit: () => {
                        requestRewriteRef.current?.({
                            id: 'smart',
                            label: 'Smart Edit',
                            description: 'Auto-improve',
                            mode: 'smart',
                            icon: Sparkles
                        })
                    },
                    openGenerativeDraft: () => {
                        console.log('Open Generative Draft')
                        // TODO: Implement Generative Draft Modal
                    },
                    fixTopIssues: () => {
                        requestRewriteRef.current?.({
                            id: 'smart',
                            label: 'Smart Edit',
                            description: 'Auto-improve',
                            mode: 'smart',
                            icon: Sparkles
                        })
                    },
                    summarize: () => {
                        requestRewriteRef.current?.({
                            id: 'shorten',
                            label: 'Shorten',
                            description: 'Make it concise',
                            mode: 'shorten',
                            icon: Sparkles
                        })
                    },
                    expand: () => {
                        requestRewriteRef.current?.({
                            id: 'expand',
                            label: 'Expand',
                            description: 'Add more detail',
                            mode: 'rewrite', // Maps to Rephrase tab
                            icon: Sparkles
                        })
                    },
                    insertCitation: () => {
                        console.log('Insert Citation')
                        // TODO: Implement Insert Citation
                    }
                }
            }),
            render: renderItems,
        },
    })
}
