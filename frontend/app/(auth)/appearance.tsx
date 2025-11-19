import AppText from '@/app/components/ui/AppText';
import Pressable from '@/app/components/ui/Pressable';
import Toggle from '@/app/components/ui/Toggle';
import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../components/AppColors';
import EditingHeader from '../components/ui/EditingHeader';
import ListItemWrapper from '../components/ui/ListItemWrapper';
import { useHaptics } from '../contexts/HapticsContext';
import { useMotion } from '../contexts/MotionContext';
import {
  ThemeName,
  themes,
  useTheme,
  useThemeAware,
} from '../contexts/ThemeContext';

type ThemeOption = { name: ThemeName; label: string };

const themeOptions: ThemeOption[] = [
  { name: 'default', label: 'Default' },
  { name: 'pink', label: 'Pink' },
  { name: 'blue', label: 'Blue' },
  { name: 'green', label: 'Green' },
  { name: 'purple', label: 'Purple' },
  { name: 'orange', label: 'Orange' },
];

export default function AppearanceScreen() {
  useThemeAware(); // Force re-render when theme changes
  const { currentTheme, setTheme } = useTheme();
  const { animationEnabled, setAnimationEnabled } = useMotion();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();

  // 🔹 Chunk helper for readability
  const chunk = <T,>(arr: T[], size: number): T[][] =>
    arr.reduce<T[][]>((rows, _, i) => {
      if (i % size === 0) rows.push(arr.slice(i, i + size));
      return rows;
    }, []);

  const themeRows = chunk(themeOptions, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <EditingHeader showSave={false} title="Appearance" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          rowGap: 24,
        }}
      >
        <View style={styles.section}>
          <AppText variant="subtitle" indented>
            Accent color
          </AppText>

          <View style={styles.colorGridAll}>
            {themeRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.colorGridRow}>
                {row.map((theme, index) => {
                  const isFirstRow = rowIndex === 0;
                  const isLastRow = rowIndex === themeRows.length - 1;
                  const isFirstItem = index === 0;
                  const isLastItem = index === row.length - 1;

                  const isSelected = currentTheme.name === theme.name;

                  return (
                    <Pressable
                      key={theme.name}
                      onPress={() => setTheme(theme.name)}
                      style={({ pressed }) => [
                        styles.colorOption,
                        isSelected && {
                          backgroundColor: AppColors.accentAlpha,
                        },
                        pressed && !isSelected && styles.pressed,
                        isFirstRow &&
                          isFirstItem && { borderTopLeftRadius: 24 },
                        isFirstRow &&
                          isLastItem && { borderTopRightRadius: 24 },
                        isLastRow &&
                          isFirstItem && { borderBottomLeftRadius: 24 },
                        isLastRow &&
                          isLastItem && { borderBottomRightRadius: 24 },
                      ]}
                    >
                      <View
                        style={[
                          styles.colorPreview,
                          {
                            backgroundColor: themes[theme.name].accentDefault,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Check color={AppColors.backgroundDefault} />
                        )}
                      </View>
                      <AppText
                        variant="body"
                        color={isSelected ? 'accent' : 'default'}
                      >
                        {theme.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle" indented>
            Accessibility
          </AppText>

          <ListItemWrapper>
            <View style={styles.optionContainer}>
              <View style={styles.optionLabel}>
                <AppText variant="body">Animation</AppText>
                <AppText color="dimmer">Enable motion effects</AppText>
              </View>
              <Toggle
                value={animationEnabled}
                onValueChange={setAnimationEnabled}
              />
            </View>

            <View style={styles.optionContainer}>
              <View style={styles.optionLabel}>
                <AppText variant="body">Haptics</AppText>
                <AppText color="dimmer">Enable vibration feedback</AppText>
              </View>
              <Toggle
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
              />
            </View>
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
    padding: 16,
  },
  subtitle: {
    marginLeft: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  colorGridAll: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  colorGridRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOption: {
    flex: 1,
    width: 130,
    minHeight: 100,
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDimmer,
    gap: 8,
    borderRadius: 4,
  },
  pressed: {
    backgroundColor: AppColors.backgroundDimmest,
  },
  optionContainer: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    flex: 1,
    gap: 4,
  },
});
