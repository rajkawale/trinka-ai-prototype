export type OutlineItem = {
    id: string
    label: string
    level: number
    position: number
}

export type QualitySignal = {
    label: string
    value: string
    status: 'success' | 'warning' | 'info'
}
