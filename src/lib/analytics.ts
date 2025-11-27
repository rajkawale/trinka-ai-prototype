type AnalyticsEvent = {
    name: string
    properties?: Record<string, any>
    timestamp: number
}

class Analytics {
    private events: AnalyticsEvent[] = []
    private debug: boolean

    constructor(debug = true) {
        this.debug = debug
        if (typeof window !== 'undefined') {
            (window as any).analytics = this
        }
    }

    track(name: string, properties?: Record<string, any>) {
        const event = {
            name,
            properties,
            timestamp: Date.now()
        }
        this.events.push(event)

        if (this.debug) {
            console.groupCollapsed(`[Analytics] ${name}`)
            console.log('Properties:', properties)
            console.log('Timestamp:', new Date(event.timestamp).toISOString())
            console.groupEnd()
        }
    }

    getEvents() {
        return this.events
    }
}

export const analytics = new Analytics(true)
