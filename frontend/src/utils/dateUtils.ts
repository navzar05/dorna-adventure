// src/utils/dateUtils.ts
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export const formatTimeUntil = (deadline: string | Date, language: string = 'en'): string => {
  const now = dayjs();
  const target = dayjs(deadline);
  const diffInMinutes = target.diff(now, 'minute');
  const diffInHours = target.diff(now, 'hour');

  // Already expired
  if (diffInMinutes <= 0) {
    return language === 'ro' ? 'Expirat' : 'Expired';
  }

  // Less than 1 hour - show minutes
  if (diffInHours < 1) {
    const minutes = Math.max(1, diffInMinutes);
    if (language === 'ro') {
      return minutes === 1 ? 'într-un minut' : `în ${minutes} minute`;
    }
    return minutes === 1 ? 'in 1 minute' : `in ${minutes} minutes`;
  }

  // Between 1 and 48 hours - always show hours
  if (diffInHours < 48) {
    const hours = diffInHours;
    if (language === 'ro') {
      return hours === 1 ? 'într-o oră' : `în ${hours} ore`;
    }
    return hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
  }

  // 48 hours or more - show days
  const days = Math.floor(diffInHours / 24);
  if (language === 'ro') {
    return days === 1 ? 'într-o zi' : `în ${days} zile`;
  }
  return days === 1 ? 'in 1 day' : `in ${days} days`;
};