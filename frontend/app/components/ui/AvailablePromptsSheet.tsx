import { AVAILABLE_PROMPTS } from '@/types';
import React from 'react';
import ListItem from './ListItem';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';

interface AvailablePromptsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectPrompt: (prompt: string) => void;
  selectedPrompt?: string;
}

export default function AvailablePromptsSheet({
  visible,
  onDismiss,
  onSelectPrompt,
  selectedPrompt,
}: AvailablePromptsSheetProps) {
  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title="Select a prompt"
      height={500}
    >
      <ListItemWrapper>
        {AVAILABLE_PROMPTS.map((promptOption, index) => (
          <ListItem
            key={index}
            title={promptOption}
            onPress={() => onSelectPrompt(promptOption)}
            selected={selectedPrompt === promptOption}
          />
        ))}
      </ListItemWrapper>
    </Sheet>
  );
}
