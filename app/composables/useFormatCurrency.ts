// Форматирование денежных значений
export const useFormatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(value)
}
