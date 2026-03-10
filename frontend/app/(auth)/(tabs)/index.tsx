// Main Home Screen — Card-based daily engagement
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
import CardStack from '@/app/components/ui/CardStack';
import Sheet from '@/app/components/ui/Sheet';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import { cacheMatchData, getCachedMatchData } from '@/app/utils/matchCache';
import {
  getProfileAge,
  NudgeStatusResponse,
  ProfileResponse,
  WeeklyMatchResponse,
  WeeklyPromptAnswerResponse,
  WeeklyPromptResponse,
} from '@/types';
import { MOCK_MATCH_CARDS, PREFERENCE_CARDS, PROFILE_ACTION_CARDS, WEEKLY_PROMPT_CARDS } from '@/app/data/mockCards';
import { DailyCard } from '@/app/components/ui/cardTypes';
import { useFocusEffect } from '@react-navigation/native';
import { Check, Pencil } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

interface MatchWithProfile {
  netid: string;
  profile: ProfileResponse | null;
  revealed: boolean;
  nudgeStatus?: NudgeStatusResponse;
  promptId: string;
}


export default function HomeScreen() {
  useThemeAware();

const [activePrompt, setActivePrompt] = useState<WeeklyPromptResponse | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentMatches, setCurrentMatches] = useState<MatchWithProfile[]>([]);
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [tempAnswer, setTempAnswer] = useState('');
  const lastLoadTime = useRef<number>(0);

  const loadData = useCallback(async () => {
    const now = Date.now();
    if (now - lastLoadTime.current < 1000) return;
    lastLoadTime.current = now;

    try {
      let prompt: WeeklyPromptResponse | null = null;

      try {
        prompt = await getActivePrompt();
        setActivePrompt(prompt);
      } catch {
        setActivePrompt(null);
      }

      if (prompt) {
        try {
          const answer: WeeklyPromptAnswerResponse = await getPromptAnswer(prompt.promptId);
          setUserAnswer(answer.answer);
        } catch {
          setUserAnswer('');
        }
      }

      try {
        const history: WeeklyMatchResponse[] = await getMatchHistory(10);

        if (history.length > 0) {
          const allMatchesData: MatchWithProfile[] = [];

          for (const matchRecord of history) {
            if (matchRecord.matches.length === 0) continue;

            let batchData;
            if (matchRecord === history[0]) {
              const cachedData = await getCachedMatchData(matchRecord.promptId);
              if (cachedData) {
                batchData = cachedData;
              } else {
                batchData = await getBatchMatchData(matchRecord.promptId, matchRecord.matches);
                await cacheMatchData(matchRecord.promptId, batchData);
              }
            } else {
              batchData = await getBatchMatchData(matchRecord.promptId, matchRecord.matches);
            }

            const matchesWithProfiles: MatchWithProfile[] = matchRecord.matches.map(
              (netid: string, index: number) => {
                const profile = batchData.profiles.find((p) => p.netid === netid) || null;
                const nudgeStatus =
                  matchRecord === history[0]
                    ? batchData.nudgeStatuses[index] || { sent: false, received: false, mutual: false }
                    : undefined;
                return { netid, profile, revealed: matchRecord.revealed[index], nudgeStatus, promptId: matchRecord.promptId };
              }
            );

            allMatchesData.push(...matchesWithProfiles);
          }

          setCurrentMatches(allMatchesData);
        } else {
          setCurrentMatches([]);
        }
      } catch {
        setCurrentMatches([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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

  // Build the daily card list: interleave mock cards with real match cards
  const dailyCards = useMemo((): DailyCard[] => {
    const apiMatchCards: DailyCard[] = currentMatches
      .filter((m) => m.profile)
      .map((m) => {
        const p = m.profile!;
        return {
          id: `match-${m.netid}-${m.promptId}`,
          type: 'match' as const,
          matchName: p.firstName,
          matchAge: getProfileAge(p),
          matchYear: p.year,
          matchMajor: p.major.join(', '),
          matchImage: p.pictures[0] || undefined,
        };
      });
    // Fall back to mock match cards when no API data (dev / offline mode)
    const matchCards: DailyCard[] = apiMatchCards.length > 0 ? apiMatchCards : MOCK_MATCH_CARDS;

    const profileCards = PROFILE_ACTION_CARDS.filter((c) => !c.completed);
    const result: DailyCard[] = [];
    const maxLen = Math.max(profileCards.length, PREFERENCE_CARDS.length, matchCards.length, WEEKLY_PROMPT_CARDS.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < profileCards.length) result.push(profileCards[i]);
      if (i < PREFERENCE_CARDS.length) result.push(PREFERENCE_CARDS[i]);
      if (i < matchCards.length) result.push(matchCards[i]);
      if (i < WEEKLY_PROMPT_CARDS.length) result.push(WEEKLY_PROMPT_CARDS[i]);
    }

    return result.length === 0 ? [...PROFILE_ACTION_CARDS, ...PREFERENCE_CARDS] : result;
  }, [currentMatches]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <AppText variant="title">For You</AppText>
        <View style={styles.headerRow}>
          <AppText variant="body" color="dimmer" style={styles.headerSub}>
            {activePrompt ? 'Your daily cards' : 'Complete tasks to improve your matches'}
          </AppText>
          {activePrompt && (
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
          )}
        </View>
      </View>

      {/* Card stack — flex:1 so it fills remaining space */}
      <View style={styles.stackContainer}>
        <CardStack cards={dailyCards} />
      </View>

      {/* Weekly Prompt Sheet */}
      <Sheet
        visible={showPromptSheet}
        onDismiss={() => setShowPromptSheet(false)}
        title={activePrompt?.question || 'Weekly Prompt'}
        bottomRound={false}
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
              returnKeyType="done"
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
    paddingTop: 64,
    backgroundColor: AppColors.backgroundDefault,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerSub: {
    flex: 1,
  },
  stackContainer: {
    flex: 1,
    paddingBottom: 32,
  },
});
