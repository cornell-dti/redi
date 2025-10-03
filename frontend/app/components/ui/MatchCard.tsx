import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';

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
          <Text style={styles.name}>
            {name}, {age}
          </Text>
          <MaterialIcons
            name="favorite"
            size={20}
            color={AppColors.accentDefault}
          />
        </View>
        <Text style={styles.school}>{school}</Text>
        <Text style={styles.bio} numberOfLines={2}>
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
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
  },
  school: {
    fontSize: 14,
    color: AppColors.foregroundDimmer,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: AppColors.foregroundDefault,
  },
});
