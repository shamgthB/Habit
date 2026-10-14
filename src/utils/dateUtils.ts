// Helper functions for consistent date management

export const formatISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (): string => {
  return formatISODate(new Date());
};

export const getDayOfWeek = (dateString: string): number => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).getDay(); // 0 = Sunday, 6 = Saturday
};

export const getDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatISODate(date);
};

export const addDays = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
};

export const formatDateDisplay = (
  dateString: string,
  format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' = 'YYYY-MM-DD'
): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  return dateString;
};

export const formatHumanDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getGreeting = (): { greeting: string; icon: string } => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good morning', icon: '🌅' };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: 'Good afternoon', icon: '☀️' };
  } else if (hour >= 17 && hour < 22) {
    return { greeting: 'Good evening', icon: '🌆' };
  } else {
    return { greeting: 'Good night', icon: '🌙' };
  }
};

export const getMonthDays = (year: number, month: number): { date: string; isCurrentMonth: boolean }[] => {
  const days: { date: string; isCurrentMonth: boolean }[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Previous month padding
  const startingDay = firstDayOfMonth.getDay(); // 0 is Sunday
  for (let i = startingDay - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    days.push({
      date: formatISODate(prevDate),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const curDate = new Date(year, month, i);
    days.push({
      date: formatISODate(curDate),
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill complete grid of 35 or 42
  const totalSlots = days.length > 35 ? 42 : 35;
  const remaining = totalSlots - days.length;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      date: formatISODate(nextDate),
      isCurrentMonth: false,
    });
  }

  return days;
};

export const getPastDaysArray = (count: number): string[] => {
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    result.push(getDaysAgo(i));
  }
  return result;
};
