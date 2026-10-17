const gel = new Intl.NumberFormat('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat('ka-GE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tbilisi',
});

/** "39,90 ₾" */
export const formatGel = (amount: number) => `${gel.format(amount)} ₾`;

/** Tbilisi time, wherever the admin is. */
export const formatDateTime = (date: Date) => dateTime.format(date);
