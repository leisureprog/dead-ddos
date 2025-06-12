import { formatDistanceToNow, format, isValid, parseISO } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'

type DateInput = Date | string | number | null | undefined
type DateFormatOptions = {
  formatString?: string
  addSuffix?: boolean
  locale?: 'ru' | 'en'
  fallback?: string
}

/**
 * Универсальная функция форматирования даты
 *
 * @param date - Дата для форматирования (Date, строка ISO, timestamp)
 * @param options - Настройки форматирования
 * @returns Отформатированная строка с датой или fallback
 */
export function useFormatDate(date: DateInput, options: DateFormatOptions = {}): string {
  const { formatString = 'yyyy-MM-dd HH:mm', addSuffix = false, locale = 'ru', fallback = '' } = options

  if (!date) return fallback

  try {
    let dateObj: Date

    if (typeof date === 'string') {
      dateObj = parseISO(date)
    } else if (typeof date === 'number') {
      dateObj = new Date(date)
    } else {
      dateObj = date
    }

    if (!isValid(dateObj)) {
      console.warn('Invalid date:', date)
      return fallback
    }

    if (addSuffix) {
      return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: locale === 'ru' ? ru : enUS,
      })
    }

    return format(dateObj, formatString, {
      locale: locale === 'ru' ? ru : enUS,
    })
  } catch (error) {
    console.error('Date formatting error:', error)
    return fallback
  }
}
