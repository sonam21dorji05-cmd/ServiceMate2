import { CURRENCY } from '../constants/services';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMoney(amount: number): string {
  const fixed = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${CURRENCY} ${fixed}`;
}