import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';
import { Text } from './';

interface MatchCardProps {
  name: string;
  age: number;
  school: string;
  bio: string;
  image: string;
  onPress?: () => void;
}

export default function MatchCard({
  name,
  age,
  school,
  bio,
  image,
  onPress,
}: MatchCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.header}>
          <Text variant="title" color={AppColors.foregroundDefault} style={{ fontSize: 20, fontWeight: '600' }}>
            {name}, {age}
          </Text>
          <MaterialIcons
            name="favorite"
            size={20}
            color={AppColors.accentDefault}
          />
        </View>
        <Text variant="body" color={AppColors.foregroundDimmer} style={{ marginBottom: 8 }}>{school}</Text>
        <Text variant="subtitle" color={AppColors.foregroundDefault} numberOfLines={2}>
          {bio}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  info: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
