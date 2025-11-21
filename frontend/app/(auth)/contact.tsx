import { Mail } from 'lucide-react-native';
import React from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useThemeAware } from '../contexts/ThemeContext';

export default function ContactPage() {
  useThemeAware(); // Force re-render when theme changes
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: AppColors.backgroundDefault }]}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Contact the team" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <ListItemWrapper>
            <View style={styles.textWrapper}>
              <AppText>
                Please contact us at redicornell@gmail.com for any inquiries.
              </AppText>
            </View>
            <Button
              onPress={() => Linking.openURL('mailto:redicornell@gmail.com')}
              title="Email us"
              iconLeft={Mail}
              variant="secondary"
              noRound
            />
          </ListItemWrapper>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  textWrapper: {
    padding: 16,
    backgroundColor: AppColors.backgroundDimmer,
  },
});
