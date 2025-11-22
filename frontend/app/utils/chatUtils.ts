import bannedTermsData from './bannedTerms.json';

// Create a map for speed
const bannedTermsSet = new Set(
  bannedTermsData.terms.map(term => term.replace(/[*;]/g, '').toLowerCase())
);

/**
 * Checks if a message contains any banned terms
 * @param message - The message text to check
 * @returns true if message is valid (no banned words), false if it contains banned words
 */
export function isMessageValid(message: string): boolean {
  if (!message || message.trim().length === 0) {
    return false;
  }

  const normalizedMessage = message.toLowerCase().replace(/[^\w\s]/g, '');

  return !Array.from(bannedTermsSet).some(term => normalizedMessage.includes(term));
}
