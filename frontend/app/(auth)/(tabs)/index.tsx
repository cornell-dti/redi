// Main Matches/Home Screen
import { sendNudge } from '@/app/api/nudgesApi';
import {
  getActivePrompt,
  getBatchMatchData,
  getMatchHistory,
  getPromptAnswer,
  submitPromptAnswer,
} from '@/app/api/promptsApi';
import { AppColors } from '@/app/components/AppColors';
import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import CountdownTimer from '@/app/components/ui/CountdownTimer';
import EmptyState from '@/app/components/ui/EmptyState';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import Sheet from '@/app/components/ui/Sheet';
import WeeklyMatchCard from '@/app/components/ui/WeeklyMatchCard';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import { useDebouncedCallback } from '@/app/hooks/useDebounce';
import {
  getNextFridayMidnight,
  isCountdownPeriod,
} from '@/app/utils/dateUtils';
import { cacheMatchData, getCachedMatchData } from '@/app/utils/matchCache';
import {
  getProfileAge,
  NudgeStatusResponse,
  ProfileResponse,
  WeeklyMatchResponse,
  WeeklyPromptAnswerResponse,
  WeeklyPromptResponse,
} from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Check, Eye, Heart, Pencil } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface MatchWithProfile {
  netid: string;
  profile: ProfileResponse | null;
  revealed: boolean;
  nudgeStatus?: NudgeStatusResponse;
  promptId: string; // Store promptId with each match for nudging
}

export default function MatchesScreen() {
  useThemeAware();

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showCountdown, setShowCountdown] = useState(isCountdownPeriod());
  const [activePrompt, setActivePrompt] = useState<WeeklyPromptResponse | null>(
    null
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentMatches, setCurrentMatches] = useState<MatchWithProfile[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [tempAnswer, setTempAnswer] = useState('');
  const lastLoadTime = useRef<number>(0);

  // Debounced data loading to prevent excessive API calls
  const loadDataDebounced = useDebouncedCallback(() => {
    loadData();
  }, 500); // 500ms debounce

  useEffect(() => {
    loadData();

    // Update countdown state every minute
    const interval = setInterval(() => {
      setShowCountdown(isCountdownPeriod());
    }, 60000);

    return () => clearInterval(interval);
  }, []); // Only run on mount

  const loadData = useCallback(async () => {
    // Prevent rapid successive calls (rate limiting on client side)
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTime.current;

    if (timeSinceLastLoad < 1000) {
      // Minimum 1 second between loads
      console.log('⚠️  Skipping load - too soon since last load');
      return;
    }

    lastLoadTime.current = now;

    try {
      setLoading(true);
      let prompt: WeeklyPromptResponse | null = null;

      // Get active prompt (optional - matches can exist without an active prompt)
      try {
        prompt = await getActivePrompt();
        setActivePrompt(prompt);
      } catch (promptError) {
        console.error('Error fetching active prompt:', promptError);
        setActivePrompt(null);
        // Don't return early - continue loading matches even without an active prompt
      }

      // Get user's answer to the prompt (if there's an active prompt)
      if (prompt) {
        try {
          const answer: WeeklyPromptAnswerResponse = await getPromptAnswer(
            prompt.promptId
          );
          setUserAnswer(answer.answer);
        } catch {
          // No answer yet
          setUserAnswer('');
        }
      }

      // Get all match history - backend filters by expiration date automatically
      try {
        const history: WeeklyMatchResponse[] = await getMatchHistory(10);

        if (history.length > 0) {
          // Collect all matches from all active match records
          const allMatchesData: MatchWithProfile[] = [];

          for (const matchRecord of history) {
            if (matchRecord.matches.length === 0) continue;

            // Try to get cached data first for the most recent match
            let batchData;
            if (matchRecord === history[0]) {
              const cachedData = await getCachedMatchData(matchRecord.promptId);
              if (cachedData) {
                batchData = cachedData;
                console.log('✅ Using cached match data');
              } else {
                batchData = await getBatchMatchData(
                  matchRecord.promptId,
                  matchRecord.matches
                );
                await cacheMatchData(matchRecord.promptId, batchData);
                console.log('✅ Fetched and cached fresh match data');
              }
            } else {
              // For older matches, just fetch the data
              batchData = await getBatchMatchData(
                matchRecord.promptId,
                matchRecord.matches
              );
            }

            // Map the batch data to matches with profiles
            const matchesWithProfiles: MatchWithProfile[] =
              matchRecord.matches.map((netid: string, index: number) => {
                const profile =
                  batchData.profiles.find((p) => p.netid === netid) || null;

                // Only get nudge status for the most recent matches
                const nudgeStatus =
                  matchRecord === history[0]
                    ? batchData.nudgeStatuses[index] || {
                        sent: false,
                        received: false,
                        mutual: false,
                      }
                    : undefined;

                return {
                  netid,
                  profile,
                  revealed: matchRecord.revealed[index],
                  nudgeStatus,
                  promptId: matchRecord.promptId,
                };
              });

            allMatchesData.push(...matchesWithProfiles);
          }

          setCurrentMatches(allMatchesData);
        } else {
          // No match history at all
          setCurrentMatches([]);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        setCurrentMatches([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we use refs for state that shouldn't trigger re-renders

  const handleSubmitAnswer = async () => {
    if (!activePrompt || !tempAnswer.trim()) return;

    try {
      await submitPromptAnswer(activePrompt.promptId, tempAnswer);
      setUserAnswer(tempAnswer);
      setShowPromptSheet(false);
      setTempAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Trigger animation every time screen is focused
  useFocusEffect(
    useCallback(() => {
      setAnimationTrigger((prev) => prev + 1);
    }, [])
  );

  const renderCountdownPeriod = () => (
    <>
      <CountdownTimer targetDate={getNextFridayMidnight()} />
      {activePrompt && (
        <ListItemWrapper style={styles.promptSection}>
          <View style={styles.promptQuestion}>
            <AppText color="dimmer"> Weekly Prompt: </AppText>

            <AppText variant="subtitle">{activePrompt.question}</AppText>
          </View>
          <Button
            title={userAnswer ? 'Edit answer' : 'Answer prompt'}
            onPress={() => {
              setTempAnswer(userAnswer);
              setShowPromptSheet(true);
            }}
            variant="secondary"
            iconLeft={Pencil}
            noRound
          />
        </ListItemWrapper>
      )}
    </>
  );

  const renderWeekendPeriod = () => (
    <>
      {currentMatches.length > 0 && (
        <View style={[styles.section, styles.sectionPadding]}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Your Matches
          </AppText>
        </View>
      )}
    </>
  );

  const renderCurrentMatch = () => {
    if (currentMatches.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            icon={Heart}
            label="No matches available yet. Check back after submitting your answer!"
            triggerAnimation={animationTrigger}
          >
            {activePrompt && (
              <Button
                title="Show this week's prompt"
                onPress={() => {
                  setTempAnswer(userAnswer);
                  setShowPromptSheet(true);
                }}
                variant="secondary"
                iconLeft={Eye}
              />
            )}
          </EmptyState>
        </View>
      );
    }

    return (
      <View style={styles.matchContainer}>
        <ScrollView
          horizontal
          decelerationRate="fast"
          snapToInterval={width - 60}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (width - 60)
            );
            setCurrentMatchIndex(index);
          }}
          style={{ paddingLeft: 16 }}
        >
          {currentMatches.map((m, matchIndex) => {
            if (!m.profile) return null;
            const matchProfile = m.profile;
            const matchAge = getProfileAge(matchProfile);

            const handleNudge = async () => {
              await sendNudge(matchProfile.netid, m.promptId);
              loadDataDebounced(); // refresh after nudge
            };

            return (
              <View
                key={`${matchProfile.netid}-${m.promptId ?? matchIndex}`}
                style={{
                  width: width - 60,
                  marginRight: 12,
                }}
              >
                <WeeklyMatchCard
                  name={matchProfile.firstName}
                  age={matchAge}
                  year={matchProfile.year}
                  major={matchProfile.major.join(', ')}
                  image={
                    matchProfile.pictures[0] ||
                    'https://via.placeholder.com/400'
                  }
                  onNudge={handleNudge}
                  onViewProfile={() =>
                    router.push(
                      `/view-profile?netid=${matchProfile.netid}&promptId=${m.promptId}` as any
                    )
                  }
                  nudgeSent={m.nudgeStatus?.sent || false}
                  nudgeDisabled={m.nudgeStatus?.mutual || false}
                />
              </View>
            );
          })}
        </ScrollView>

        {currentMatches.length > 1 && (
          <View style={styles.pagination}>
            {currentMatches.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentMatchIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerContainer}>
          <AppText variant="title">Matches</AppText>
          <AppText variant="subtitle" color="dimmer">
            Dropping Friday at 12:00 AM
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <AppText variant="body" color="dimmer" style={{ marginTop: 16 }}>
            Loading matches...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerContainer}>
        <AppText variant="title">Matches</AppText>
        <AppText variant="subtitle" color="dimmer">
          Dropping Friday at 12:00 AM
        </AppText>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {showCountdown ? renderCountdownPeriod() : renderWeekendPeriod()}
          {renderCurrentMatch()}
        </View>
      </ScrollView>

      {/* Weekly Prompt Sheet */}
      <Sheet
        visible={showPromptSheet}
        onDismiss={() => setShowPromptSheet(false)}
        title={activePrompt?.question || 'Weekly Prompt'}
      >
        {activePrompt && (
          <View style={{ gap: 16, flex: 1 }}>
            <AppInput
              placeholder="Your answer..."
              value={tempAnswer}
              onChangeText={setTempAnswer}
              multiline
              numberOfLines={3}
              maxLength={120}
              style={{ height: 84, borderRadius: 24 }}
            />

            <AppText variant="bodySmall" color="dimmer">
              {tempAnswer.length}/120 characters
            </AppText>

            <Button
              title={userAnswer ? 'Update answer' : 'Submit answer'}
              onPress={handleSubmitAnswer}
              variant="primary"
              fullWidth
              iconLeft={Check}
              disabled={!tempAnswer.trim()}
            />
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    paddingTop: 64,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownSection: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 8,
  },
  promptSection: {
    gap: 4,
    marginBottom: 24,
    padding: 16,
  },
  promptLabel: {
    marginLeft: 4,
  },
  promptCard: {
    backgroundColor: AppColors.accentAlpha,
    borderColor: AppColors.accentDefault,
    borderWidth: 1,
    borderRadius: 4,
    gap: 4,
    padding: 16,
    marginTop: 24,
  },
  promptQuestion: {
    padding: 16,
    gap: 8,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmer,
  },
  answerCard: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 4,
    padding: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionPadding: {
    paddingLeft: 16,
  },
  matchContainer: {
    marginBottom: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.backgroundDimmest,
  },
  paginationDotActive: {
    backgroundColor: AppColors.accentDefault,
    width: 24,
  },
  emptyState: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    margin: 16,
  },
  headerContainer: {
    padding: 16,
  },
  skeletonWrapper: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 175,
  },
});
