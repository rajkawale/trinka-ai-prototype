export type DiffPart = {
    value: string
    added?: boolean
    removed?: boolean
}

export function diffWords(oldText: string, newText: string): DiffPart[] {
    const oldWords = oldText.split(/\s+/)
    const newWords = newText.split(/\s+/)

    // Simple LCS-based diff (O(NM)) - sufficient for sentence-level diffs
    const m = oldWords.length
    const n = newWords.length
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }

    let i = m, j = n
    const tempParts: DiffPart[] = []

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
            tempParts.unshift({ value: oldWords[i - 1] + ' ' })
            i--
            j--
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            tempParts.unshift({ value: newWords[j - 1] + ' ', added: true })
            j--
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            tempParts.unshift({ value: oldWords[i - 1] + ' ', removed: true })
            i--
        }
    }

    return tempParts
}
