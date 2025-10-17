import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import AvailablePromptsSheet from '@/app/components/ui/AvailablePromptsSheet';
import Button from '@/app/components/ui/Button';
import { router, useLocalSearchParams } from 'expo-router';
import { Quote, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const handleSave = () => {
    // Navigate back with the updated prompt data
    // Note: You'll need to implement a way to pass this data back
    router.back();
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setQuestion(selectedPrompt);
    setShowPromptsSheet(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader onBack={() => router.back()} title="Edit prompt" />

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
          </View>

          <View style={styles.part}>
            <AppText color="dimmer" style={styles.subtitle}>
              Your answer
            </AppText>

            <AppInput
              placeholder="Your answer..."
              value={answer}
              onChangeText={setAnswer}
              multiline
              numberOfLines={4}
              maxLength={150}
              style={{ height: 100 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.buttonWrapper}>
        <Button
          iconLeft={Trash2}
          title="Delete prompt"
          onPress={() => {}}
          variant="negative"
        />
      </View>

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
    gap: 8,
  },
});
