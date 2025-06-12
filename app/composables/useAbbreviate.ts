export function useAbbreviate(number: number): string {
    if (typeof number !== 'number' || isNaN(number)) {
        throw new Error('Input must be a valid number')
    }

    if (number < 1e3) {
        return `${ number }`
    } else if (number < 1e6) {
        return `${ (number / 1e3).toFixed(1) }K`
    } else if (number < 1e9) {
        return `${ (number / 1e6).toFixed(1) }M`
    } else if (number < 1e12) {
        return `${ (number / 1e9).toFixed(1) }B`
    } else {
        return `${ (number / 1e12).toFixed(1) }T`
    }
}