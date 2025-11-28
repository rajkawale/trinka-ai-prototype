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
                    }
                }
            }),
            render: renderItems,
        },
    })
}
