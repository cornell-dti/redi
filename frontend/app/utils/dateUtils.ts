/**
 * Determine if the current time is in the countdown period (Monday 12:00 AM - Thursday 11:59 PM)
 */
export function isCountdownPeriod(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Monday (1) through Thursday (4)
  return dayOfWeek >= 1 && dayOfWeek <= 4;
}

/**
 * Get the next Friday at 12:00 AM
 * Used for countdown timer target
 */
export function getNextFridayMidnight(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Calculate days until Friday (5)
  let daysUntilFriday = 5 - dayOfWeek;

  // If today is Friday, Saturday, or Sunday, we want the next Friday
  if (daysUntilFriday <= 0) {
    daysUntilFriday += 7;
  }

  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  nextFriday.setHours(0, 0, 0, 0);

  return nextFriday;
}

/**
 * Determine if it's the weekend period (Friday 12:00 AM - Sunday 11:59 PM)
 */
export function isWeekendPeriod(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

  // Friday (5), Saturday (6), or Sunday (0)
  return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
}
