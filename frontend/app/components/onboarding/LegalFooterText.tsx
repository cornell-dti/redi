import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppText from '../ui/AppText';

interface LegalFooterTextProps {
  text: string; // Text with {terms} and {privacy} placeholders
}

export default function LegalFooterText({ text }: LegalFooterTextProps) {
  const handleTermsPress = () => {
    Linking.openURL('https://redi.love/terms'); // Replace with actual terms URL
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://redi.love/privacy'); // Replace with actual privacy URL
  };

  // Split text by placeholders and create touchable links
  const renderText = () => {
    const parts = text.split(/(\{terms\}|\{privacy\})/g);

    return parts.map((part, index) => {
      if (part === '{terms}') {
        return (
          <AppText
            variant="bodySmall"
            key={index}
            style={styles.link}
            onPress={handleTermsPress}
          >
            Terms
          </AppText>
        );
      } else if (part === '{privacy}') {
        return (
          <AppText
            variant="bodySmall"
            key={index}
            style={styles.link}
            onPress={handlePrivacyPress}
          >
            Privacy Policy
          </AppText>
        );
      }
      return <AppText key={index}>{part}</AppText>;
    });
  };

  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" style={styles.text}>
        {renderText()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  text: {
    textAlign: 'center',
  },
  link: {
    color: AppColors.accentDefault,
    textDecorationLine: 'underline',
  },
});
