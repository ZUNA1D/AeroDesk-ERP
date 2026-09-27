/**
 * Converts a number to words using Bangladeshi Lakh & Crore numbering system.
 * e.g., 125000 -> "One Lakh Twenty Five Thousand Taka Only"
 */
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanOneThousand(n) {
  let result = '';

  if (n >= 100) {
    result += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }

  if (n >= 20) {
    result += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }

  if (n > 0) {
    result += ones[n] + ' ';
  }

  return result.trim();
}

export function numberToWords(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Zero Taka Only';
  }

  const num = Number(amount);
  if (num === 0) return 'Zero Taka Only';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  let crore = Math.floor(integerPart / 10000000);
  let remainderAfterCrore = integerPart % 10000000;

  let lakh = Math.floor(remainderAfterCrore / 100000);
  let remainderAfterLakh = remainderAfterCrore % 100000;

  let thousand = Math.floor(remainderAfterLakh / 1000);
  let remainderAfterThousand = remainderAfterLakh % 1000;

  let hundredAndBelow = remainderAfterThousand;

  let words = '';

  if (crore > 0) {
    words += convertNumberToWordsBase(crore) + ' Crore ';
  }

  if (lakh > 0) {
    words += convertLessThanOneThousand(lakh) + ' Lakh ';
  }

  if (thousand > 0) {
    words += convertLessThanOneThousand(thousand) + ' Thousand ';
  }

  if (hundredAndBelow > 0) {
    words += convertLessThanOneThousand(hundredAndBelow) + ' ';
  }

  words = words.trim() + ' Taka';

  if (decimalPart > 0) {
    const paisaWords = convertLessThanOneThousand(decimalPart);
    words += ` and ${paisaWords} Paisa`;
  }

  words += ' Only';

  return isNegative ? `Minus ${words}` : words;
}

function convertNumberToWordsBase(n) {
  if (n === 0) return 'Zero';

  let crore = Math.floor(n / 10000000);
  let remCrore = n % 10000000;
  let lakh = Math.floor(remCrore / 100000);
  let remLakh = remCrore % 100000;
  let thousand = Math.floor(remLakh / 1000);
  let remThousand = remLakh % 1000;

  let parts = [];
  if (crore > 0) parts.push(convertLessThanOneThousand(crore) + ' Crore');
  if (lakh > 0) parts.push(convertLessThanOneThousand(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertLessThanOneThousand(thousand) + ' Thousand');
  if (remThousand > 0) parts.push(convertLessThanOneThousand(remThousand));

  return parts.join(' ');
}
