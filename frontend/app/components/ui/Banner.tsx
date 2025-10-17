import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';

interface BannerProps {
  text: string;
}

const Banner: React.FC<BannerProps> = ({ text }) => {
  return (
    <View style={styles.banner}>
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
    backgroundColor: AppColors.accentAlpha,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.accentDefault,
  },
});

export default Banner;
