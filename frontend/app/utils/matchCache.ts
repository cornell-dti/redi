/**
 * Client-Side Match Data Caching
 * Caches match data to reduce redundant API calls when navigating between tabs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileResponse, NudgeStatusResponse } from '@/types';

const MATCH_CACHE_PREFIX = '@match_cache_';
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export interface CachedMatchData {
  profiles: ProfileResponse[];
  nudgeStatuses: NudgeStatusResponse[];
  timestamp: number;
}

/**
 * Generate cache key for a specific prompt's matches
 */
function getCacheKey(promptId: string): string {
  return `${MATCH_CACHE_PREFIX}${promptId}`;
}

/**
 * Get cached match data for a prompt
 * Returns null if cache is expired or doesn't exist
 */
export async function getCachedMatchData(
  promptId: string
): Promise<CachedMatchData | null> {
  try {
    const cacheKey = getCacheKey(promptId);
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const parsed: CachedMatchData = JSON.parse(cachedData);
    const age = Date.now() - parsed.timestamp;

    if (age < CACHE_DURATION_MS) {
      console.log(`📦 Using cached match data for ${promptId} (age: ${age}ms)`);
      return parsed;
    }

    console.log(`🗑️  Cache expired for ${promptId}, will fetch fresh data`);
    // Clean up expired cache
    await AsyncStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Error reading match cache:', error);
    return null;
  }
}

/**
 * Cache match data for a prompt
 */
export async function cacheMatchData(
  promptId: string,
  data: { profiles: ProfileResponse[]; nudgeStatuses: NudgeStatusResponse[] }
): Promise<void> {
  try {
    const cacheKey = getCacheKey(promptId);
    const cachedData: CachedMatchData = {
      ...data,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
    console.log(`💾 Cached match data for ${promptId}`);
  } catch (error) {
    console.error('Error caching match data:', error);
  }
}

/**
 * Clear all match caches
 * Useful when user logs out or data becomes stale
 */
export async function clearAllMatchCaches(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const matchCacheKeys = allKeys.filter((key) =>
      key.startsWith(MATCH_CACHE_PREFIX)
    );

    if (matchCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(matchCacheKeys);
      console.log(`🧹 Cleared ${matchCacheKeys.length} match caches`);
    }
  } catch (error) {
    console.error('Error clearing match caches:', error);
  }
}

/**
 * Clear cache for a specific prompt
 */
export async function clearMatchCache(promptId: string): Promise<void> {
  try {
    const cacheKey = getCacheKey(promptId);
    await AsyncStorage.removeItem(cacheKey);
    console.log(`🧹 Cleared cache for ${promptId}`);
  } catch (error) {
    console.error('Error clearing match cache:', error);
  }
}
