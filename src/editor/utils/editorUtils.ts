export const createRequestId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `${Date.now()}`
}

// Note: showToast usually requires state, so it might be better passed as a prop or context.
// But we can have a helper to format the toast object if needed.
export const formatToast = (message: string, undo?: () => void) => ({ message, undo })
