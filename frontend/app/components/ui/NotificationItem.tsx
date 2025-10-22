import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { AppColors } from '../AppColors';
import IconWrapper from './IconWrapper';
import ListItem from './ListItem';

interface NotificationItemProps {
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image?: string | null;
  icon: LucideIcon;
  onPress?: () => void;
}

export default function NotificationItem({
  type,
  title,
  message,
  timestamp,
  read,
  image,
  icon,
  onPress,
}: NotificationItemProps) {
  const iconColor = AppColors.accentDefault;

  return (
    <ListItem
      onPress={onPress}
      left={
        <IconWrapper badge={!read}>
          {React.createElement(icon, { size: 16, color: iconColor })}
        </IconWrapper>
      }
      title={message}
      description={timestamp}
    />
  );
}
