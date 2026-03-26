// Main Home Screen — Card-based daily engagement
import { getConversations } from '@/app/api/chatApi';
import { getCurrentUser } from '@/app/api/authService';
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
import { DailyCard } from '@/app/components/ui/cardTypes';
import IconButton from '@/app/components/ui/IconButton';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import { useThemeAware } from '@/app/contexts/ThemeContext';
import {
  MOCK_MATCH_CARDS,
  PREFERENCE_CARDS,
  PROFILE_ACTION_CARDS,
  WEEKLY_PROMPT_CARDS,
} from '@/app/data/mockCards';
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
import {
  Check,
  Heart,
  HelpCircle,
  LayoutGrid,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

const FILTER_OPTIONS = [
  {
    value: 'all' as const,
    label: 'All cards',
    color: null,
    icon: LayoutGrid,
    iconColor: AppColors.foregroundDimmer,
  },
  {
    value: 'profile_action' as const,
    label: 'Profile building',
    color: '#DBEAFE',
    icon: User,
    iconColor: '#2563EB',
  },
  {
    value: 'preference' as const,
    label: 'Preferences',
    color: '#EDE9FE',
    icon: HelpCircle,
    iconColor: '#7C3AED',
  },
  {
    value: 'weekly_prompt' as const,
    label: 'Weekly prompts',
    color: '#D1FAE5',
    icon: Sparkles,
    iconColor: '#059669',
  },
  {
    value: 'match' as const,
    label: 'Matches',
    color: '#FCE7F3',
    icon: Heart,
    iconColor: '#EC4899',
  },
];

interface MatchWithProfile {
  netid: string;
  profile: ProfileResponse | null;
  revealed: boolean;
  nudgeStatus?: NudgeStatusResponse;
  promptId: string;
}

export default function HomeScreen() {
  useThemeAware();

  const [activePrompt, setActivePrompt] = useState<WeeklyPromptResponse | null>(
    null
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentMatches, setCurrentMatches] = useState<MatchWithProfile[]>([]);
  // ── TEMPORARY PLACEHOLDER ────────────────────────────────────────────────────
  // Seeds match cards from existing chat conversations so the card stack isn't
  // empty during development. Remove once the real match pipeline is wired up.
  const [chatMatchCards, setChatMatchCards] = useState<DailyCard[]>([]);
  // ─────────────────────────────────────────────────────────────────────────────
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'profile_action' | 'preference' | 'weekly_prompt' | 'match'
  >('all');
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
          const answer: WeeklyPromptAnswerResponse = await getPromptAnswer(
            prompt.promptId
          );
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
                batchData = await getBatchMatchData(
                  matchRecord.promptId,
                  matchRecord.matches
                );
                await cacheMatchData(matchRecord.promptId, batchData);
              }
            } else {
              batchData = await getBatchMatchData(
                matchRecord.promptId,
                matchRecord.matches
              );
            }

            const matchesWithProfiles: MatchWithProfile[] =
              matchRecord.matches.map((netid: string, index: number) => {
                const profile =
                  batchData.profiles.find((p) => p.netid === netid) || null;
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
          setCurrentMatches([]);
        }
      } catch {
        setCurrentMatches([]);
      }

      // ── TEMPORARY PLACEHOLDER ───────────────────────────────────────────────
      // Builds match cards from existing chat conversations for dev/testing.
      // Remove this block once the real weekly-match pipeline populates the feed.
      try {
        const convos = await getConversations();
        const currentUid = getCurrentUser()?.uid;
        const cards: DailyCard[] = convos
          .filter((c) => c.lastMessage)
          .flatMap((c) => {
            const otherUid = c.participantIds.find((id) => id !== currentUid);
            if (!otherUid) return [];
            const other = c.participants[otherUid];
            if (!other || other.deleted) return [];
            return [{
              id: `chat-match-${c.id}`,
              type: 'match' as const,
              matchName: other.name,
              matchImage: other.image ?? undefined,
            }];
          });
        setChatMatchCards(cards);
      } catch {
        // Non-critical — silently ignore
      }
      // ────────────────────────────────────────────────────────────────────────

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
          matchProfile: p,
        };
      });
    // Fallback chain: real API matches → chat contacts (temp) → static mocks
    const matchCards: DailyCard[] =
      apiMatchCards.length > 0 ? apiMatchCards :
      chatMatchCards.length > 0 ? chatMatchCards :
      MOCK_MATCH_CARDS;

    const profileCards = PROFILE_ACTION_CARDS.filter((c) => !c.completed);
    const result: DailyCard[] = [];
    const maxLen = Math.max(
      profileCards.length,
      PREFERENCE_CARDS.length,
      matchCards.length,
      WEEKLY_PROMPT_CARDS.length
    );
    for (let i = 0; i < maxLen; i++) {
      if (i < profileCards.length) result.push(profileCards[i]);
      if (i < PREFERENCE_CARDS.length) result.push(PREFERENCE_CARDS[i]);
      if (i < matchCards.length) result.push(matchCards[i]);
      if (i < WEEKLY_PROMPT_CARDS.length) result.push(WEEKLY_PROMPT_CARDS[i]);
    }

    const all =
      result.length === 0
        ? [...PROFILE_ACTION_CARDS, ...PREFERENCE_CARDS]
        : result;
    if (activeFilter === 'all') return all;
    return all.filter((c) => c.type === activeFilter);
  }, [currentMatches, chatMatchCards, activeFilter]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="title">Home</AppText>
          <View style={styles.headerRight}>
            <AppText variant="body" color="dimmer">
              {dailyCards.length} left
            </AppText>
            <IconButton
              icon={SlidersHorizontal}
              onPress={() => setShowFilterSheet(true)}
              variant={'secondary'}
            />
          </View>
        </View>
        <View style={styles.headerRow}>
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
        <CardStack key={activeFilter} cards={dailyCards} />
      </View>

      {/* Filter Sheet */}
      <Sheet
        visible={showFilterSheet}
        onDismiss={() => setShowFilterSheet(false)}
        title="Filter cards"
        height="auto"
      >
        <ListItemWrapper>
          {FILTER_OPTIONS.map((opt) => (
            <ListItem
              key={opt.value}
              title={opt.label}
              selected={activeFilter === opt.value}
              left={
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: opt.color ?? AppColors.backgroundDimmer,
                    },
                  ]}
                >
                  <opt.icon size={14} color={opt.iconColor} />
                </View>
              }
              right={
                activeFilter === opt.value ? (
                  <Check size={18} color={AppColors.accentDefault} />
                ) : null
              }
              onPress={() => {
                setActiveFilter(opt.value);
                setShowFilterSheet(false);
              }}
            />
          ))}
        </ListItemWrapper>
      </Sheet>

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
