import { LucideIcon } from 'lucide-react-native';
import React from 'react';

interface TabBarIconProps {
  icon: LucideIcon;
  size: number;
  color: string;
}

export default function TabBarIcon({ icon, size, color }: TabBarIconProps) {
  return React.createElement(icon, { size, color });
}
