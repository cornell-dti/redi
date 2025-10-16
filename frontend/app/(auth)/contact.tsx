import { Mail } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import EditingHeader from '../components/ui/EditingHeader';
import ListItemWrapper from '../components/ui/ListItemWrapper';

export default function ContactPage() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <AppText variant="title">Contact the team</AppText>

          <ListItemWrapper>
            <View style={styles.textWrapper}>
              <AppText>Please contact us at [EMAIL] for any inquiries.</AppText>
            </View>
            <Button
              onPress={() => {}}
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
    backgroundColor: AppColors.backgroundDefault,
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
