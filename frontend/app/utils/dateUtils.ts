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

/**
 * Determine if we should show countdown based on current time vs match date
 * @param matchDate - ISO string of the match date (e.g., Friday at 12:01 AM ET)
 * @returns boolean indicating if countdown should be shown
 */
export function shouldShowCountdown(matchDate: string): boolean {
  const now = new Date();
  const match = new Date(matchDate);

  // Show countdown if match date is in the future
  return now < match;
}

/**
 * Get a human-readable description of when matches drop
 * @param matchDate - ISO string of the match date
 * @returns string like "Dropping Friday at 12:01 AM"
 */
export function getMatchDropDescription(matchDate: string): string {
  const match = new Date(matchDate);
  const dayName = match.toLocaleDateString('en-US', { weekday: 'long' });
  const time = match.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `Dropping ${dayName} at ${time}`;
}
