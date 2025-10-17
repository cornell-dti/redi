import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface BannerProps {
  text: string;
  color?: 'accent' | 'default';
}

const Banner: React.FC<BannerProps> = ({ text, color = 'accent' }) => {
  const backgroundColor =
    color === 'accent' ? AppColors.accentAlpha : AppColors.backgroundDimmer;

  const borderColor =
    color === 'accent' ? AppColors.accentDefault : AppColors.backgroundDimmest;

  return (
    <View style={[styles.banner, { backgroundColor, borderColor }]}>
      <AppText color="accent" variant="body">
        {text}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
});

export default Banner;
