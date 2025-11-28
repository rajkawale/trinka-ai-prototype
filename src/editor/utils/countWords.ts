export function countWords(s = '') {
    return s.trim() === '' ? 0 : s.trim().split(/\s+/).filter(Boolean).length;
}
