export function isEmptyObject(obj: any) {
    // Проверяем, является ли obj null или undefined
    if (obj === null || obj === undefined) return true

    // Проверяем, является ли объект пустым
    if (typeof obj !== 'object' || Object.keys(obj).length === 0) return true

    // Проверяем, есть ли в объекте непустые массивы
    for (const key in obj) {
        if (Array.isArray(obj[key]) && obj[key].length > 0) {
            return false
        }
    }
    return true
}