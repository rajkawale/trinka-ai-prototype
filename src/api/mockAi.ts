// Mock delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockAi = {
    correct: async (_text: string) => {
        await delay(600)
        // Mock logic: Find "is" and suggest "are" if plural (very basic mock)
        // In reality, this would return a list of issues
        return [
            {
                id: '1',
                type: 'grammar',
                message: 'Consider using active voice',
                range: { from: 0, to: 10 },
                suggestion: 'Researchers must navigate'
            }
        ]
    },

    tone: async (text: string, tone: string) => {
        await delay(800)
        return `[${tone.toUpperCase()}] ${text} (Tone improved)`
    },

    shorten: async (text: string) => {
        await delay(500)
        return text.split(' ').slice(0, Math.ceil(text.split(' ').length * 0.7)).join(' ') + '.'
    },

    rewrite: async (text: string) => {
        await delay(700)
        return `Rephrased: ${text}`
    },

    expand: async (text: string) => {
        await delay(900)
        return `${text} This is an elaboration on the topic, adding more depth and context to the original statement.`
    },

    generate: async (prompt: string) => {
        await delay(1000)
        return `Here is a generated draft based on "${prompt}". It includes several sentences to demonstrate the generative capability.`
    }
}
