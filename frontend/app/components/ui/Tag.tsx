import { LucideIcon, X as XIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppColors } from '../AppColors';
import IconButton from './IconButton';

interface TagProps {
  label: string;
  icon?: LucideIcon;
  variant?: 'gray' | 'white' | 'accent';
  dismissible?: boolean;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export default function Tag({
  label,
  icon: IconComp,
  variant = 'gray',
  dismissible = false,
  onDismiss,
  style,
}: TagProps) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  // Handle dismiss
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  // Variant colors
  const backgroundColor =
    variant === 'white'
      ? AppColors.backgroundDefault
      : variant === 'accent'
        ? AppColors.accentDefault
        : AppColors.backgroundDimmer;

  const textColor =
    variant === 'accent'
      ? AppColors.backgroundDefault
      : AppColors.foregroundDefault;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={[styles.left, { paddingRight: dismissible ? 0 : 16 }]}>
        {IconComp && (
          <>
            {React.createElement(IconComp, {
              size: 16,
              color: textColor,
            })}
          </>
        )}

        <Text numberOfLines={1} style={{ color: textColor }}>
          {label}
        </Text>
      </View>

      {dismissible && (
        <IconButton
          onPress={handleDismiss}
          icon={XIcon}
          noRound
          size={40}
          variant={variant === 'gray' ? 'secondary' : 'transparent'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 128,
    height: 40,
    overflow: 'hidden',
  },
  left: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
