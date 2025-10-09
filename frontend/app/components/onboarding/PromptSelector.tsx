import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AVAILABLE_PROMPTS, PromptData } from '../../types/onboarding';
import { AppColors } from '../AppColors';
import AppInput from '../ui/AppInput';
import AppText from '../ui/AppText';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import ListItem from '../ui/ListItem';
import ListItemWrapper from '../ui/ListItemWrapper';
import Sheet from '../ui/Sheet';

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
        <AppText variant="body" style={styles.promptQuestion}>
          {prompt.question || 'No prompt selected'}
        </AppText>
        {canRemove && (
          <IconButton
            icon={X}
            onPress={onRemove}
            variant="secondary"
            size="small"
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
      />

      <Button
        title={prompt.question ? 'Change prompt' : 'Select a prompt'}
        onPress={() => setShowPromptSheet(true)}
        variant="secondary"
        fullWidth
      />

      <Sheet
        visible={showPromptSheet}
        onDismiss={() => setShowPromptSheet(false)}
        title="Select a prompt"
        height={500}
      >
        <ListItemWrapper>
          {AVAILABLE_PROMPTS.map((promptOption, index) => (
            <ListItem
              key={index}
              title={promptOption}
              onPress={() => handlePromptSelect(promptOption)}
              selected={prompt.question === promptOption}
            />
          ))}
        </ListItemWrapper>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  promptQuestion: {
    flex: 1,
    fontWeight: '600',
  },
});
