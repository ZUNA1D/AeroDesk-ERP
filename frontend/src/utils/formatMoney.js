/**
 * Format numeric amount into Bangladeshi / South Asian currency representation
 * e.g. 1500000 -> "15,00,000.00"
 */
export function formatMoney(amount, showDecimals = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showDecimals ? '0.00' : '0';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const parts = absNum.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // South Asian grouping
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = formattedOthers + ',' + lastThree;
  }

  const sign = isNegative ? '-' : '';
  return showDecimals ? `${sign}${integerPart}.${decimalPart}` : `${sign}${integerPart}`;
}
