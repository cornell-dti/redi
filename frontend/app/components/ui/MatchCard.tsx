import { Coffee } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

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
          <AppText variant="title">
            {name}, {age}
          </AppText>
          <Coffee
            size={20}
            color={AppColors.accentDefault}
          />
        </View>
        <AppText variant="body" color="dimmer" style={{ marginBottom: 8 }}>
          {school}
        </AppText>
        <AppText variant="subtitle" numberOfLines={2}>
          {bio}
        </AppText>
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
