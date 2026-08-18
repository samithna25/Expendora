import { CURRENCY_SYMBOL } from './constants';

export function formatCurrency(amount) {
  const sym = CURRENCY_SYMBOL.trim();
  // Rs-style prefix: "Rs 1,234.50" — add space after symbol
  // $-style prefix: "$1,234.50" — no space
  const space = sym.length > 1 ? ' ' : '';
  return `${sym}${space}${Math.abs(amount).toFixed(2)}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return `${month} ${day}`;
}

export function formatPercentage(value) {
  return `${value.toFixed(0)}%`;
}

export function formatCompactNumber(num) {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
