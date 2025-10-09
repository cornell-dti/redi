import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../AppColors';

interface LegalFooterTextProps {
  text: string; // Text with {terms} and {privacy} placeholders
}

export default function LegalFooterText({ text }: LegalFooterTextProps) {
  const handleTermsPress = () => {
    Linking.openURL('https://redi.love/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://redi.love/privacy');
  };

  // Split text by placeholders and create touchable links
  const renderText = () => {
    const parts = text.split(/(\{terms\}|\{privacy\})/g);

    return parts.map((part, index) => {
      if (part === '{terms}') {
        return (
          <Text
            key={index}
            style={styles.link}
            onPress={handleTermsPress}
          >
            Terms
          </Text>
        );
      } else if (part === '{privacy}') {
        return (
          <Text
            key={index}
            style={styles.link}
            onPress={handlePrivacyPress}
          >
            Privacy Policy
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{renderText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.foregroundDimmer,
    textAlign: 'center',
  },
  link: {
    color: AppColors.accentDefault,
    textDecorationLine: 'underline',
  },
});
