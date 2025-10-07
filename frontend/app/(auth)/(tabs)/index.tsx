import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import IconWrapper from '@/app/components/ui/IconWrapper';
import ListItem from '@/app/components/ui/ListItem';
import ListItemWrapper from '@/app/components/ui/ListItemWrapper';
import Sheet from '@/app/components/ui/Sheet';
import {
  AirVent,
  ArrowDownAZ,
  Check,
  ChevronRight,
  Clapperboard,
  Edit,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Square,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [sheetVisible1, setSheetVisible1] = useState(false);

  const [sheetVisible2, setSheetVisible2] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header
        title="Discover"
        right={
          <TouchableOpacity>
            <SlidersHorizontal size={24} color={AppColors.foregroundDimmer} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <AppText variant="subtitle">New Matches</AppText>
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

          <Button
            title="Load More Profiles"
            onPress={() => {}}
            iconLeft={RefreshCw}
            fullWidth
          />

          <View
            style={{
              display: 'flex',
              gap: 12,
              padding: 24,
              paddingBottom: 128,
              backgroundColor: 'white',
            }}
          >
            <Button title="Button" noRound onPress={() => {}} />

            <Button
              title="Button"
              noRound
              variant="negative"
              onPress={() => {}}
            />

            <Button title="Button" onPress={() => {}} />

            <Button title="Button" onPress={() => {}} variant="secondary" />

            <Button title="Button" onPress={() => {}} variant="negative" />
            <Button title="Button" onPress={() => {}} iconLeft={Clapperboard} />

            <Button
              title="Button"
              onPress={() => {}}
              iconLeft={Plus}
              variant="secondary"
            />

            <Button
              title="Button"
              onPress={() => {}}
              iconLeft={AirVent}
              variant="negative"
            />

            <Button title="Button" onPress={() => {}} iconRight={Plus} />

            <Button
              title="Button"
              onPress={() => {}}
              iconRight={ArrowDownAZ}
              variant="secondary"
            />

            <Button
              title="Button"
              onPress={() => {}}
              iconRight={Plus}
              variant="negative"
            />
            <AppText variant="title">Title Text</AppText>
            <AppText variant="subtitle">Subtitle Text</AppText>
            <AppText variant="body">Body Text</AppText>
            <AppText variant="bodySmall">Body Small Text</AppText>

            <Button
              title="Open Sheet 1"
              onPress={() => setSheetVisible1(true)}
              variant="secondary"
            />

            <Button
              title="Open Sheet 2"
              onPress={() => setSheetVisible2(true)}
              variant="secondary"
            />

            <AppInput onChangeText={() => {}} placeholder="Placeholder" />

            <AppInput
              onChangeText={() => {}}
              placeholder="Placeholder (no label)"
              required
            />

            <AppInput
              label="Label"
              onChangeText={() => {}}
              placeholder="Placeholder (no label)"
            />

            <AppInput
              label="Label"
              onChangeText={() => {}}
              placeholder="Placeholder"
              required
            />

            <AppInput
              label="Label"
              onChangeText={() => {}}
              placeholder="Placeholder (no label)"
              error="This is an error message"
            />

            <AppInput
              label="Label"
              onChangeText={() => {}}
              placeholder="Placeholder"
              required
              error="This is an error message"
            />

            <View style={{ marginTop: 20 }}>
              <AppText variant="subtitle">ListItem Examples</AppText>

              <ListItemWrapper>
                <ListItem title="Default item" onPress={() => {}} />

                <ListItem
                  title="With description"
                  description="This is a secondary description"
                  onPress={() => {}}
                />

                <ListItem
                  title="Left and right elements"
                  left={
                    <IconWrapper variant="white">
                      <Edit />
                    </IconWrapper>
                  }
                  right={<ChevronRight />}
                  onPress={() => {}}
                />

                <ListItem
                  title="Selected item"
                  description="Selected variant should have dimmer background"
                  selected
                  onPress={() => {}}
                  right={<Check color={AppColors.backgroundDefault} />}
                />
              </ListItemWrapper>
            </View>
          </View>
        </View>
      </ScrollView>

      <Sheet
        visible={sheetVisible1}
        onDismiss={() => setSheetVisible1(false)}
        height={500}
        title="Example sheet title"
      >
        <View style={{ display: 'flex', gap: 24 }}>
          <AppText variant="body">
            This sheet was opened from the Discover screen.
          </AppText>

          <Button variant="primary" title="Hi" onPress={() => {}} />

          <Button variant="negative" title="Hi" onPress={() => {}} />
        </View>
      </Sheet>

      <Sheet
        visible={sheetVisible2}
        onDismiss={() => setSheetVisible2(false)}
        height={500}
        title="Another sheet"
      >
        <View
          style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}
        >
          <ListItemWrapper>
            <ListItem
              title="Default item"
              right={<Square />}
              onPress={() => {}}
            />

            <ListItem
              title="Default item"
              right={<Square />}
              onPress={() => {}}
            />

            <ListItem
              title="Selected item"
              description="Selected variant should have dimmer background"
              selected
              onPress={() => {}}
              right={<Check color={AppColors.backgroundDefault} />}
            />
          </ListItemWrapper>

          <Button
            title="Select"
            iconLeft={Check}
            variant="primary"
            onPress={() => {}}
            fullWidth
          />
        </View>
      </Sheet>

      <TouchableOpacity style={styles.fab}>
        <Search size={28} color={AppColors.backgroundDefault} />
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
