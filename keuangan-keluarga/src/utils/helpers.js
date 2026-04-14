import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '';
  try {
    return format(parseISO(date), 'dd MMM yyyy', { locale: localeId });
  } catch {
    return date;
  }
};

export const formatMonthYear = (date) => {
  try {
    return format(parseISO(date), 'MMMM yyyy', { locale: localeId });
  } catch {
    return date;
  }
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatShortDate = (date) => {
  if (!date) return '';
  try {
    return format(parseISO(date), 'dd/MM', { locale: localeId });
  } catch {
    return date;
  }
};

export const getMonthRange = (year, month) => {
  const date = new Date(year, month - 1, 1);
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
};

export const isDateInMonth = (date, year, month) => {
  if (!date) return false;
  try {
    const { start, end } = getMonthRange(year, month);
    return isWithinInterval(parseISO(date), { start: parseISO(start), end: parseISO(end) });
  } catch {
    return false;
  }
};

export const getPreviousMonth = (year, month) => {
  const date = subMonths(new Date(year, month - 1, 1), 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
};

export const getCurrentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export const formatDateInput = (date) => {
  if (!date) return format(new Date(), 'yyyy-MM-dd');
  try {
    return format(parseISO(date), 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
};
