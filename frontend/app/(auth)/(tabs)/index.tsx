import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import { AppColors } from '../../components/AppColors';
import Header from '../../components/ui/Header';
import MatchCard from '../../components/ui/MatchCard';

// Mock data for matches
const mockMatches = [
  {
    id: '1',
    name: 'Abrar',
    age: 210,
    school: 'College of Arts and Sciences',
    image:
      'https://media.licdn.com/dms/image/v2/D5603AQFxIrsKx3XV3g/profile-displayphoto-shrink_200_200/B56ZdXeERIHUAg-/0/1749519189434?e=2147483647&v=beta&t=MscfLHknj7AGAwDGZoRcVzT03zerW4P1jUR2mZ3QMKU',
    bio: "Love drinking matcha around Ithaca and sewing in my Grandma's sewing circle!",
  },
  {
    id: '2',
    name: 'Cleemmie',
    age: 21,
    school: 'Engineering',
    image:
      'https://media.licdn.com/dms/image/v2/D4E03AQHIyGmXArUgLQ/profile-displayphoto-shrink_200_200/B4EZSMgrNeGwAY-/0/1737524163741?e=2147483647&v=beta&t=nb1U9gqxgOz9Jzf0bAnUY5wk5R9v_nn9AsgdhYbbpbk',
    bio: 'CS major who loves board games and bubble tea',
  },
  {
    id: '3',
    name: 'Arshie Barshie',
    age: 93,
    school: 'Dyson',
    image:
      'https://media.licdn.com/dms/image/v2/D4E03AQEppsomLWUZgA/profile-displayphoto-scale_200_200/B4EZkMKRSMIUAA-/0/1756845653823?e=2147483647&v=beta&t=oANMmUogYztIXt7p1pB11qv-Qwh0IHYmFMZIdl9CFZE',
    bio: 'Business student with a passion for sustainable fashion',
  },
];

export default function MatchesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header
        title="Discover"
        right={
          <TouchableOpacity>
            <MaterialIcons
              name="tune"
              size={24}
              color={AppColors.foregroundDimmer}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>New Matches</Text>
          {mockMatches.map((match) => (
            <MatchCard
              key={match.id}
              name={match.name}
              age={match.age}
              school={match.school}
              bio={match.bio}
              image={match.image}
            />
          ))}

          <AppButton
            title="Load More Profiles"
            onPress={() => {}}
            variant="outline"
            icon="refresh"
            fullWidth
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <MaterialIcons
          name="search"
          size={28}
          color={AppColors.backgroundDefault}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDimmer,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: AppColors.foregroundDefault,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.accentDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
