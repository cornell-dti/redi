import { AVAILABLE_PROMPTS } from '@/types';
import { Check } from 'lucide-react-native';
import React from 'react';
import { AppColors } from '../AppColors';
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
    <Sheet visible={visible} onDismiss={onDismiss} title="Select a prompt">
      <ListItemWrapper>
        {AVAILABLE_PROMPTS.map((promptOption, index) => (
          <ListItem
            key={index}
            title={promptOption}
            onPress={() => onSelectPrompt(promptOption)}
            selected={selectedPrompt === promptOption}
            right={
              selectedPrompt === promptOption ? (
                <Check size={20} color={AppColors.accentDefault} />
              ) : null
            }
          />
        ))}
      </ListItemWrapper>
    </Sheet>
  );
}
