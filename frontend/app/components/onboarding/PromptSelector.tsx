import { PromptData } from '@/types';
import { ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppInput from '../ui/AppInput';
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
  const [showPromptSheet, setShowPromptSheet] = useState(!prompt.question);

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
      {prompt.question ? (
        <>
          <View style={styles.promptHeader}>
            <Button
              title={prompt.question}
              onPress={() => setShowPromptSheet(true)}
              variant="secondary"
              fullWidth
              style={styles.promptButton}
              noRound
              dropdown
              textStyle={{ fontWeight: '600' }}
              iconRight={ChevronDown}
            />
            {canRemove && (
              <IconButton
                icon={X}
                onPress={onRemove}
                variant="negative"
                // size="small"
                noRound
              />
            )}
          </View>

          <AppInput
            placeholder="Your answer..."
            value={prompt.answer}
            onChangeText={handleAnswerChange}
            multiline
            numberOfLines={3}
            maxLength={120}
            noRound
            style={styles.answerInput}
          />
        </>
      ) : null}

      <AvailablePromptsSheet
        visible={showPromptSheet}
        onDismiss={() => {
          setShowPromptSheet(false);
          // If no prompt selected, remove this prompt card
          if (!prompt.question) {
            onRemove();
          }
        }}
        onSelectPrompt={handlePromptSelect}
        selectedPrompt={prompt.question}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  promptHeader: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  promptButton: {
    width: 340,
  },
  answerInput: {
    height: 60,
  },
});
