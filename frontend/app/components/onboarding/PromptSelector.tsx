import { PromptData } from '@/types';
import { Quote, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppInput from '../ui/AppInput';
import AppText from '../ui/AppText';
import AvailablePromptsSheet from '../ui/AvailablePromptsSheet';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';

interface PromptSelectorProps {
  prompt: PromptData;
  onUpdate: (prompt: PromptData) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function PromptSelector({
  prompt,
  onUpdate,
  onRemove,
  canRemove,
}: PromptSelectorProps) {
  const [showPromptSheet, setShowPromptSheet] = useState(false);

  const handlePromptSelect = (selectedPrompt: string) => {
    onUpdate({
      ...prompt,
      question: selectedPrompt,
    });
    setShowPromptSheet(false);
  };

  const handleAnswerChange = (answer: string) => {
    onUpdate({
      ...prompt,
      answer,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.promptHeader}>
        <View style={styles.promptTop}>
          <AppText variant="subtitle" style={styles.promptQuestion}>
            {prompt.question || 'No prompt selected'}
          </AppText>
          {canRemove && (
            <IconButton
              icon={X}
              onPress={onRemove}
              variant="secondary"
              size="small"
              style={styles.promptRemoveBtn}
            />
          )}
        </View>

        <AppInput
          placeholder="Your answer..."
          value={prompt.answer}
          onChangeText={handleAnswerChange}
          multiline
          numberOfLines={3}
          maxLength={150}
          noRound
        />
      </View>

      <Button
        title={prompt.question ? 'Change prompt' : 'Select a prompt'}
        onPress={() => setShowPromptSheet(true)}
        variant="secondary"
        fullWidth
        noRound
        iconLeft={Quote}
      />

      <AvailablePromptsSheet
        visible={showPromptSheet}
        onDismiss={() => setShowPromptSheet(false)}
        onSelectPrompt={handlePromptSelect}
        selectedPrompt={prompt.question}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflow: 'hidden',
  },
  promptHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderRadius: 4,
  },
  promptTop: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
  },
  promptRemoveBtn: {
    borderRadius: 4,
    minWidth: 56,
    flex: 1,
  },
  promptQuestion: {
    flex: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: AppColors.backgroundDimmer,
  },
});
