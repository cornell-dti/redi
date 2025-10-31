// Main Matches/Home Screen
import { sendNudge } from '@/app/api/nudgesApi';
import {
  getActivePrompt,
  getBatchMatchData,
  getMatchHistory,
  getPromptAnswer,
  getPromptMatches,
  submitPromptAnswer,
} from '@/app/api/promptsApi';
import { AppColors } from '@/app/components/AppColors';
import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import CountdownTimer from '@/app/components/ui/CountdownTimer';
import EmptyState from '@/app/components/ui/EmptyState';
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
import { Eye, Heart } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface MatchWithProfile {
  netid: string;
  profile: ProfileResponse | null;
  revealed: boolean;
  nudgeStatus?: NudgeStatusResponse;
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
  const [previousMatches, setPreviousMatches] = useState<MatchWithProfile[]>(
    []
  );
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

      // Get active prompt
      try {
        prompt = await getActivePrompt();
        setActivePrompt(prompt);
      } catch (promptError) {
        console.error('Error fetching active prompt:', promptError);
        setActivePrompt(null);
        setLoading(false);
        return;
      }

      if (!prompt) {
        setLoading(false);
        return;
      }

      // Get user's answer to the prompt
      try {
        const answer: WeeklyPromptAnswerResponse = await getPromptAnswer(
          prompt.promptId
        );
        setUserAnswer(answer.answer);
      } catch {
        // No answer yet
        setUserAnswer('');
      }

      // Get current week's matches using batch endpoint with caching
      try {
        const matches: WeeklyMatchResponse = await getPromptMatches(
          prompt.promptId
        );

        if (matches.matches.length > 0) {
          // Try to get cached data first
          const cachedData = await getCachedMatchData(prompt.promptId);

          let batchData;
          if (cachedData) {
            // Use cached data
            batchData = cachedData;
            console.log('✅ Using cached match data');
          } else {
            // Fetch fresh data and cache it
            batchData = await getBatchMatchData(
              prompt.promptId,
              matches.matches
            );
            await cacheMatchData(prompt.promptId, batchData);
            console.log('✅ Fetched and cached fresh match data');
          }

          // Map the batch data back to the expected format
          const matchesWithProfiles: MatchWithProfile[] = matches.matches.map(
            (netid: string, index: number) => {
              // Find matching profile from batch response
              const profile =
                batchData.profiles.find((p) => p.netid === netid) || null;

              // Get nudge status from batch response
              const nudgeStatus = batchData.nudgeStatuses[index] || {
                sent: false,
                received: false,
                mutual: false,
              };

              return {
                netid,
                profile,
                revealed: matches.revealed[index],
                nudgeStatus,
              };
            }
          );

          setCurrentMatches(matchesWithProfiles);
        } else {
          setCurrentMatches([]);
        }
      } catch (error) {
        console.error('Error loading current matches:', error);
        // No matches yet
        setCurrentMatches([]);
      }

      // Get previous matches
      // TODO: Idk if we want to reset previous matches every week or keep them displayed to users
      // maybe if neither nudges after a week they go away?
      try {
        const history: WeeklyMatchResponse[] = await getMatchHistory(10);
        // Filter out current week's matches
        const oldMatches = history.filter(
          (m: WeeklyMatchResponse) => m.promptId !== prompt.promptId
        );

        if (oldMatches.length > 0) {
          // Collect all netids from previous matches
          const allPreviousNetids: string[] = [];

          oldMatches.forEach((matchRecord: WeeklyMatchResponse) => {
            matchRecord.matches.forEach((netid: string) => {
              allPreviousNetids.push(netid);
            });
          });

          // Fetch all profiles at once (we don't need nudge statuses for previous matches)
          // We'll use the batch endpoint with the oldest promptId
          if (allPreviousNetids.length > 0) {
            const oldestPromptId = oldMatches[0]?.promptId || prompt.promptId;
            const batchData = await getBatchMatchData(
              oldestPromptId,
              allPreviousNetids
            );

            // Map profiles back
            const previousMatchesWithProfiles: MatchWithProfile[] =
              allPreviousNetids.map((netid: string) => {
                const profile =
                  batchData.profiles.find((p) => p.netid === netid) || null;

                return {
                  netid,
                  profile,
                  revealed: true, // Previous matches are always revealed
                };
              });

            setPreviousMatches(previousMatchesWithProfiles);
          } else {
            setPreviousMatches([]);
          }
        } else {
          setPreviousMatches([]);
        }
      } catch (error) {
        console.error('Error loading previous matches:', error);
        setPreviousMatches([]);
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
    </>
  );

  const renderWeekendPeriod = () => (
    <>
      {currentMatches.length > 0 && (
        <View style={[styles.section, styles.sectionPadding]}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            This Week&apos;s Matches
          </AppText>
        </View>
      )}
    </>
  );

  const renderCurrentMatch = () => {
    if (currentMatches.length === 0) {
      return (
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
      );
    }

    return (
      <View style={styles.matchContainer}>
        <ScrollView
          horizontal
          decelerationRate="fast"
          snapToInterval={width - 60}
          showsHorizontalScrollIndicator={false}
          // contentContainerStyle={{ paddingHorizontal: 16 }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (width - 60)
            );
            setCurrentMatchIndex(index);
          }}
          style={{ paddingLeft: 16 }}
        >
          {currentMatches.map((m, index) => {
            if (!m.profile || !activePrompt) return null;
            const matchProfile = m.profile;
            const matchAge = getProfileAge(matchProfile);

            const handleNudge = async () => {
              if (!activePrompt) return;
              await sendNudge(matchProfile.netid, activePrompt.promptId);
              // Reload matches to update nudge status (debounced)
              loadDataDebounced();
            };

            return (
              <>
                {/* TEMPORARY FOR NOW JUST TO TEST CAROUSEL */}
                {[0, 1, 2].map((cardIndex) => (
                  <View
                    key={`${index}-${cardIndex}`}
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
                          `/view-profile?netid=${matchProfile.netid}` as any
                        )
                      }
                      nudgeSent={m.nudgeStatus?.sent || false}
                      nudgeDisabled={m.nudgeStatus?.mutual || false}
                    />
                  </View>
                ))}
              </>
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

  const renderPreviousMatches = () => {
    if (previousMatches.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.divider} />
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Previous Matches
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.previousMatchesGrid}>
            {previousMatches.slice(0, 6).map((match, index) => {
              if (!match.profile) return null;
              const profile = match.profile;

              return (
                <TouchableOpacity
                  key={match.netid + index}
                  style={styles.previousMatchCard}
                  onPress={() =>
                    router.push(`/view-profile?netid=${profile.netid}` as any)
                  }
                >
                  <View style={styles.previousMatchImage}>
                    <AppText variant="title">{profile.firstName[0]}</AppText>
                  </View>
                  <AppText variant="bodySmall" numberOfLines={1}>
                    {profile.firstName}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
          <ActivityIndicator size="large" color={AppColors.accentDefault} />
          <AppText variant="body" color="dimmer" style={{ marginTop: 16 }}>
            Loading matches...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no active prompt
  if (!activePrompt) {
    return (
      <SafeAreaView style={styles.container}>
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
            <View style={styles.emptyState}>
              <AppText variant="title" style={{ marginBottom: 12 }}>
                Unable to load matches
              </AppText>
              <Button
                title="Retry"
                onPress={loadData}
                variant="primary"
                style={{ marginTop: 24 }}
              />
            </View>
          </View>
        </ScrollView>
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
          {/* {showCountdown ? renderCountdownPeriod() : renderWeekendPeriod()} */}
          {renderCountdownPeriod()}
          {renderWeekendPeriod()}
          {renderCurrentMatch()}
          {renderPreviousMatches()}
        </View>
      </ScrollView>

      {/* Weekly Prompt Sheet */}
      <Sheet
        visible={showPromptSheet}
        onDismiss={() => setShowPromptSheet(false)}
        title={activePrompt.question}
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
              style={{ height: 84 }}
            />

            <AppText variant="bodySmall" color="dimmer">
              {tempAnswer.length}/120 characters
            </AppText>

            <Button
              title={userAnswer ? 'Update answer' : 'Submit answer'}
              onPress={handleSubmitAnswer}
              variant="primary"
              fullWidth
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
    gap: 12,
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
    lineHeight: 22,
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
  divider: {
    height: 1,
    backgroundColor: AppColors.backgroundDimmest,
    marginVertical: 24,
  },
  emptyState: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    margin: 16,
  },
  previousMatchesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  previousMatchCard: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  previousMatchImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
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
});
