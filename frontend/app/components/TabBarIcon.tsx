import React from 'react';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

type IconLibrary = 'MaterialIcons' | 'Ionicons';

interface TabBarIconProps {
  name: string;
  size: number;
  color: string;
  library?: IconLibrary;
}

export default function TabBarIcon({
  name,
  size,
  color,
  library = 'MaterialIcons',
}: TabBarIconProps) {
  if (library === 'Ionicons') {
    return <Ionicons name={name as any} size={size} color={color} />;
  }

  return <MaterialIcons name={name as any} size={size} color={color} />;
}
