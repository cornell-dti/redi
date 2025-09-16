import auth from '@react-native-firebase/auth';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import ProfileTester from '../components/test-components/ProfileTester';
import UserTester from '../components/test-components/UserTester';
import CustomButton from '../components/ui/CustomButton';
import SectionCard from '../components/ui/SectionCard';

const HomePage: React.FC = () => {
  const user = auth().currentUser;

  const handleSignOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <SectionCard style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome to redi {user?.email}
        </Text>
        <Text style={styles.infoText}>
          Your netid: {user?.email?.split('@')[0]}
        </Text>
      </SectionCard>

      {/* API Testing Components */}
      <UserTester />
      <ProfileTester />

      {/* Sign Out */}
      <SectionCard>
        <CustomButton
          title="Sign out"
          onPress={handleSignOut}
          variant="secondary"
          fullWidth
        />
      </SectionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomePage;