import {
  getActivePrompt,
  getPromptAnswer,
  submitPromptAnswer,
} from '@/app/api/promptsApi';
import { AppColors } from '@/app/components/AppColors';
import ProfileView from '@/app/components/profile/ProfileView';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import {
  WeeklyPromptAnswerResponse,
  WeeklyPromptResponse,
} from '@/types';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../components/ui/AppInput';
import Sheet from '../components/ui/Sheet';
import { useProfile } from '../contexts/ProfileContext';

/**
 * Profile Preview Page
 * Shows how your profile appears to other users
 */
export default function ProfilePreviewScreen() {
  const { profile } = useProfile();
  const [activePrompt, setActivePrompt] = useState<WeeklyPromptResponse | null>(
    null
  );
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [tempAnswer, setTempAnswer] = useState('');

  useEffect(() => {
    fetchWeeklyPrompt();
  }, []);

  const fetchWeeklyPrompt = async () => {
    try {
      const prompt = await getActivePrompt();
      setActivePrompt(prompt);

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
    } catch (error) {
      console.error('Error fetching weekly prompt:', error);
      setActivePrompt(null);
    }
  };

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

  // Main content
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Header with back button */}
        <Button
          title="Exit preview"
          iconLeft={ArrowLeft}
          onPress={() => router.back()}
          variant="secondary"
          fullWidth={false}
        />
      </View>

      {/* Profile view */}
      {profile && (
        <ProfileView
          profile={profile}
          weeklyPrompt={activePrompt}
          weeklyPromptAnswer={userAnswer}
          onEditWeeklyPrompt={() => {
            setTempAnswer(userAnswer);
            setShowPromptSheet(true);
          }}
          isOwnProfile={true}
        />
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40, // Same as back button to center the title
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.negativeDefault,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
});
