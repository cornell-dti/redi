import { AppColors } from '@/app/components/AppColors';
import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import {
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  Home,
  Link,
  MapPin,
  MessageSquare,
  Star,
  User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DailyCard, ProfileActionIcon } from './cardTypes';

const ACTION_ICONS: Record<ProfileActionIcon, React.ElementType> = {
  camera: Camera,
  mapPin: MapPin,
  home: Home,
  message: MessageSquare,
  link: Link,
  star: Star,
  user: User,
  bookOpen: BookOpen,
};

export default function SheetContent({
  card,
  onDismiss,
}: {
  card: DailyCard;
  onDismiss: () => void;
}) {
  if (card.type === 'match')
    return <MatchSheetContent card={card} onDismiss={onDismiss} />;
  if (card.type === 'preference')
    return <PreferenceSheetContent card={card} onDismiss={onDismiss} />;
  if (card.type === 'weekly_prompt')
    return <WeeklyPromptSheetContent card={card} onDismiss={onDismiss} />;
  return <ProfileActionSheetContent card={card} onDismiss={onDismiss} />;
}

// ─── Match ────────────────────────────────────────────────────────────────────

function MatchSheetContent({
  card,
  onDismiss,
}: {
  card: Extract<DailyCard, { type: 'match' }>;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.body}>
      {card.matchImage ? (
        <Image source={{ uri: card.matchImage }} style={styles.matchImage} />
      ) : (
        <View
          style={[
            styles.matchImage,
            { backgroundColor: AppColors.backgroundDimmest },
          ]}
        />
      )}
      <AppText variant="title" style={{ marginTop: 16 }}>
        {card.matchName}, {card.matchAge}
      </AppText>
      {(card.matchYear || card.matchMajor) && (
        <AppText variant="body" color="dimmer" style={{ marginTop: 4 }}>
          {[card.matchYear, card.matchMajor].filter(Boolean).join(' · ')}
        </AppText>
      )}
      <View style={styles.actions}>
        <Button
          title="View full profile"
          onPress={onDismiss}
          variant="primary"
          fullWidth
        />
        <Button
          title="Not now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </View>
  );
}

// ─── Preference ───────────────────────────────────────────────────────────────

function PreferenceSheetContent({
  card,
  onDismiss,
}: {
  card: Extract<DailyCard, { type: 'preference' }>;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.body}>
      <AppText variant="body" color="dimmer" style={{ marginBottom: 20 }}>
        Your answer helps us find better matches for you.
      </AppText>
      {card.replyType === 'options' && (
        <OptionsReply options={card.options ?? []} onDismiss={onDismiss} />
      )}
      {card.replyType === 'text' && <TextReply onDismiss={onDismiss} />}
      {card.replyType === 'ranking' && (
        <RankingReply options={card.options ?? []} onDismiss={onDismiss} />
      )}
      {card.replyType === 'scale' && (
        <ScaleReply
          min={card.scaleMin ?? ''}
          max={card.scaleMax ?? ''}
          onDismiss={onDismiss}
        />
      )}
    </View>
  );
}

function OptionsReply({
  options,
  onDismiss,
}: {
  options: string[];
  onDismiss: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <View style={styles.optionsList}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.optionPill,
              selected === opt && styles.optionPillSelected,
            ]}
            onPress={() => setSelected(opt)}
            activeOpacity={0.75}
          >
            <AppText
              variant="subtitle"
              style={{
                color:
                  selected === opt
                    ? AppColors.backgroundDefault
                    : AppColors.foregroundDefault,
              }}
            >
              {opt}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          title="Save answer"
          onPress={onDismiss}
          variant="primary"
          fullWidth
          disabled={!selected}
        />
        <Button
          title="Skip for now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </>
  );
}

function TextReply({ onDismiss }: { onDismiss: () => void }) {
  const [value, setValue] = useState('');
  return (
    <>
      <AppInput
        placeholder="Type your answer..."
        value={value}
        onChangeText={setValue}
        multiline
        numberOfLines={4}
        maxLength={200}
        style={{ height: 100, borderRadius: 16 }}
      />
      <AppText variant="bodySmall" color="dimmer" style={{ marginTop: 4 }}>
        {value.length}/200
      </AppText>
      <View style={styles.actions}>
        <Button
          title="Save answer"
          onPress={onDismiss}
          variant="primary"
          fullWidth
          disabled={!value.trim()}
        />
        <Button
          title="Skip for now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </>
  );
}

function RankingReply({
  options: initial,
  onDismiss,
}: {
  options: string[];
  onDismiss: () => void;
}) {
  const [ranked, setRanked] = useState(initial);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...ranked];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRanked(next);
  };

  return (
    <>
      <View style={styles.rankingList}>
        {ranked.map((item, i) => (
          <View key={item} style={styles.rankItem}>
            <View style={styles.rankBadge}>
              <AppText
                variant="bodySmall"
                color="inverse"
                style={{ fontWeight: '700' }}
              >
                {i + 1}
              </AppText>
            </View>
            <AppText variant="body" style={{ flex: 1 }}>
              {item}
            </AppText>
            <View style={styles.rankArrows}>
              <TouchableOpacity
                onPress={() => move(i, -1)}
                disabled={i === 0}
                hitSlop={{ top: 8, bottom: 4, left: 8, right: 8 }}
              >
                <ChevronUp
                  size={20}
                  color={
                    i === 0
                      ? AppColors.foregroundDimmer
                      : AppColors.foregroundDefault
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => move(i, 1)}
                disabled={i === ranked.length - 1}
                hitSlop={{ top: 4, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronDown
                  size={20}
                  color={
                    i === ranked.length - 1
                      ? AppColors.foregroundDimmer
                      : AppColors.foregroundDefault
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          title="Save ranking"
          onPress={onDismiss}
          variant="primary"
          fullWidth
        />
        <Button
          title="Skip for now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </>
  );
}

const SCALE_STEPS = 5;

function ScaleReply({
  min,
  max,
  onDismiss,
}: {
  min: string;
  max: string;
  onDismiss: () => void;
}) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <>
      <View style={styles.scaleRow}>
        {Array.from({ length: SCALE_STEPS }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.scaleDot, value === i && styles.scaleDotActive]}
            onPress={() => setValue(i)}
            activeOpacity={0.7}
          />
        ))}
      </View>
      <View style={styles.scaleLabels}>
        <AppText variant="bodySmall" color="dimmer" style={{ flex: 1 }}>
          {min}
        </AppText>
        <AppText
          variant="bodySmall"
          color="dimmer"
          style={{ flex: 1, textAlign: 'right' }}
        >
          {max}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button
          title="Save answer"
          onPress={onDismiss}
          variant="primary"
          fullWidth
          disabled={value === null}
        />
        <Button
          title="Skip for now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </>
  );
}

// ─── Profile Action ───────────────────────────────────────────────────────────

function ProfileActionSheetContent({
  card,
  onDismiss,
}: {
  card: Extract<DailyCard, { type: 'profile_action' }>;
  onDismiss: () => void;
}) {
  const Icon = ACTION_ICONS[card.actionIconName];
  return (
    <View style={styles.body}>
      <View
        style={[styles.iconCircle, { alignSelf: 'center', marginBottom: 16 }]}
      >
        <Icon size={40} color={AppColors.accentDefault} />
      </View>
      <AppText
        variant="body"
        color="dimmer"
        style={{ marginBottom: 20, textAlign: 'center' }}
      >
        {card.actionDescription}
      </AppText>
      {['Open your profile', 'Tap the edit button', 'Save your changes'].map(
        (step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepBadge}>
              <AppText
                variant="bodySmall"
                color="inverse"
                style={{ fontWeight: '700' }}
              >
                {i + 1}
              </AppText>
            </View>
            <AppText variant="body" style={{ flex: 1 }}>
              {step}
            </AppText>
          </View>
        )
      )}
      <View style={styles.actions}>
        <Button
          title="Go to profile"
          onPress={onDismiss}
          variant="primary"
          fullWidth
        />
        <Button
          title="Remind me later"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </View>
  );
}

// ─── Weekly Prompt ────────────────────────────────────────────────────────────

function WeeklyPromptSheetContent({
  card,
  onDismiss,
}: {
  card: Extract<DailyCard, { type: 'weekly_prompt' }>;
  onDismiss: () => void;
}) {
  const [answer, setAnswer] = useState('');
  return (
    <View style={styles.body}>
      <AppText variant="body" color="dimmer" style={{ marginBottom: 20 }}>
        Your answer will be added to your profile for your matches to see.
      </AppText>
      <AppInput
        placeholder="Write your answer..."
        value={answer}
        onChangeText={setAnswer}
        multiline
        numberOfLines={4}
        maxLength={240}
        style={{ height: 110, borderRadius: 16 }}
        returnKeyType="done"
      />
      <AppText variant="bodySmall" color="dimmer" style={{ marginTop: 4 }}>
        {answer.length}/240
      </AppText>
      <View style={styles.actions}>
        <Button
          title="Add to profile"
          onPress={onDismiss}
          variant="primary"
          fullWidth
          disabled={!answer.trim()}
        />
        <Button
          title="Skip for now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  body: { gap: 8 },
  matchImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  actions: { marginTop: 16, gap: 10 },

  // Options reply
  optionsList: { gap: 12, marginBottom: 8 },
  optionPill: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppColors.backgroundDimmest,
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
  },
  optionPillSelected: {
    backgroundColor: AppColors.accentDefault,
    borderColor: AppColors.accentDefault,
  },

  // Ranking reply
  rankingList: { gap: 4 },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmest,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.accentDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankArrows: { flexDirection: 'column', alignItems: 'center' },

  // Scale reply
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  scaleDot: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.backgroundDimmer,
    borderWidth: 1.5,
    borderColor: AppColors.backgroundDimmest,
  },
  scaleDotActive: {
    backgroundColor: AppColors.accentDefault,
    borderColor: AppColors.accentDefault,
  },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },

  // Profile action
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.backgroundDimmer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmest,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.accentDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
