import React from 'react';
import { StyleSheet, View } from 'react-native';

const FooterSpacer: React.FC<{ height?: number }> = ({ height = 128 }) => {
  return <View style={[styles.spacer, { height }]} />;
};

export default FooterSpacer;

const styles = StyleSheet.create({
  spacer: {
    width: '100%',
  },
});
