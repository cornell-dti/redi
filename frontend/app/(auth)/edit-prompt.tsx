import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import AvailablePromptsSheet from '@/app/components/ui/AvailablePromptsSheet';
import Button from '@/app/components/ui/Button';
import Sheet from '@/app/components/ui/Sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { Quote, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import { getCurrentUserProfile, updateProfile } from '../api/profileApi';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useThemeAware } from '../contexts/ThemeContext';

export default function EditPromptPage() {
  useThemeAware(); // Force re-render when theme changes
  const params = useLocalSearchParams();
  const promptId = params.promptId as string;
  const initialQuestion = params.question as string | undefined;
  const initialAnswer = params.answer as string | undefined;

  const [question, setQuestion] = useState(initialQuestion || '');
  const [answer, setAnswer] = useState(initialAnswer || '');
  const [showPromptsSheet, setShowPromptsSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPrompts, setCurrentPrompts] = useState<
    { question: string; answer: string }[]
  >([]);

  const isNewPrompt = promptId?.startsWith('new-');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await getCurrentUserProfile();

      if (profileData) {
        setCurrentPrompts(profileData.prompts || []);
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!question.trim()) {
      Alert.alert('Required', 'Please select a prompt question');
      return;
    }

    if (!answer.trim()) {
      Alert.alert('Required', 'Please enter an answer');
      return;
    }

    setSaving(true);
    try {
      let updatedPrompts: { question: string; answer: string }[];

      if (isNewPrompt) {
        // Add new prompt
        updatedPrompts = [
          ...currentPrompts,
          { question: question.trim(), answer: answer.trim() },
        ];
      } else {
        // Update existing prompt - find by matching the original question
        updatedPrompts = currentPrompts.map((p) =>
          p.question === initialQuestion && p.answer === initialAnswer
            ? { question: question.trim(), answer: answer.trim() }
            : p
        );
      }

      await updateProfile({
        prompts: updatedPrompts,
      });

      Alert.alert('Success', 'Prompt saved successfully');
      router.back();
    } catch (error) {
      console.error('Failed to save prompt:', error);
      Alert.alert('Error', 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setQuestion(selectedPrompt);
    setShowPromptsSheet(false);
  };

  const handleConfirmDelete = async () => {
    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      // Remove the prompt by filtering it out
      const updatedPrompts = currentPrompts.filter(
        (p) => !(p.question === initialQuestion && p.answer === initialAnswer)
      );

      await updateProfile({
        prompts: updatedPrompts,
      });

      Alert.alert('Success', 'Prompt deleted successfully');
      setShowDeleteSheet(false);
      router.back();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      Alert.alert('Error', 'Failed to delete prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader
        onBack={() => router.back()}
        onSave={handleSave}
        title={isNewPrompt ? 'Add prompt' : 'Edit prompt'}
        isSaving={saving}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.part}>
            <AppText color="dimmer" style={styles.subtitle}>
              Prompt question
            </AppText>
            {question ? (
              <ListItemWrapper>
                <View style={styles.section}>
                  <AppText variant="subtitle">{question}</AppText>
                </View>

                <Button
                  title="Change prompt"
                  onPress={() => setShowPromptsSheet(true)}
                  variant="secondary"
                  fullWidth
                  iconLeft={Quote}
                  noRound
                />
              </ListItemWrapper>
            ) : (
              <Button
                title="Choose prompt"
                onPress={() => setShowPromptsSheet(true)}
                variant="secondary"
                fullWidth
                iconLeft={Quote}
              />
            )}
          </View>

          <View style={styles.part}>
            <AppText color="dimmer" style={styles.subtitle}>
              Your answer
            </AppText>

            <AppInput
              placeholder="Be creative, go crazy..."
              value={answer}
              onChangeText={setAnswer}
              multiline
              numberOfLines={4}
              maxLength={120}
              style={{ height: 100 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!isNewPrompt && (
        <View style={styles.buttonWrapper}>
          <Button
            iconLeft={Trash2}
            title="Delete prompt"
            onPress={() => setShowDeleteSheet(true)}
            variant="negative"
          />
        </View>
      )}

      {/* Delete Confirmation Sheet */}
      <Sheet
        visible={showDeleteSheet}
        onDismiss={() => setShowDeleteSheet(false)}
        title="Delete prompt"
      >
        <View style={styles.sheetContent}>
          <AppText>
            Are you sure you want to delete this prompt? You&apos;ll lose your
            answer.
          </AppText>

          <View style={styles.buttonRow}>
            <Button
              title="Delete Prompt"
              onPress={handleConfirmDelete}
              variant="negative"
              iconLeft={Trash2}
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={() => setShowDeleteSheet(false)}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </Sheet>

      <AvailablePromptsSheet
        visible={showPromptsSheet}
        onDismiss={() => setShowPromptsSheet(false)}
        onSelectPrompt={handleSelectPrompt}
        selectedPrompt={question}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    backgroundColor: AppColors.backgroundDimmer,
    padding: 16,
  },
  buttonWrapper: {
    padding: 16,
  },
  subtitle: {
    marginLeft: 16,
  },
  part: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
});
