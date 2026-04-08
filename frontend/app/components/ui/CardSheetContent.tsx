import { AppColors } from '@/app/components/AppColors';
import ProfileView from '@/app/components/profile/ProfileView';
import AppInput from '@/app/components/ui/AppInput';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import Tag from '@/app/components/ui/Tag';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  Home,
  Link,
  MapPin,
  MessageSquare,
  Plus,
  Star,
  User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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
  onSubmit,
  onDismissAndSkip,
}: {
  card: DailyCard;
  onDismiss: () => void;
  onSubmit?: () => void;
  onDismissAndSkip?: () => void;
}) {
  const submit = onSubmit ?? onDismiss;
  if (card.type === 'tutorial') {
    if (card.step === 'act')
      return (
        <TutorialActSheetContent
          onDismissAndSkip={onDismissAndSkip ?? onDismiss}
        />
      );
    onDismiss();
    return null;
  }
  if (card.type === 'match')
    return <MatchSheetContent card={card} onDismiss={onDismiss} onSubmit={submit} />;
  if (card.type === 'preference')
    return <PreferenceSheetContent card={card} onDismiss={onDismiss} onSubmit={submit} />;
  if (card.type === 'weekly_prompt')
    return <WeeklyPromptSheetContent card={card} onDismiss={onDismiss} onSubmit={submit} />;
  return <ProfileActionSheetContent card={card} onDismiss={onDismiss} onSubmit={submit} />;
}

// ─── Tutorial: Act ───────────────────────────────────────────────────────────

function TutorialActSheetContent({
  onDismissAndSkip,
}: {
  onDismissAndSkip: () => void;
}) {
  const [value, setValue] = useState('');
  return (
    <View style={styles.body}>
      <AppText variant="body" color="dimmer" style={{ marginBottom: 12 }}>
        This is what an action sheet looks like. Type something below and press
        Submit — then the card will move on.
      </AppText>
      <AppInput
        placeholder="Type anything you want..."
        value={value}
        onChangeText={setValue}
        multiline
        numberOfLines={3}
        maxLength={120}
        style={{ height: 84, borderRadius: 16 }}
        returnKeyType="done"
      />
      <View style={styles.actions}>
        <Button
          title="Submit"
          onPress={onDismissAndSkip}
          variant="primary"
          fullWidth
          disabled={!value.trim()}
        />
        {/* <Button title="Next" onPress={onDismissAndSkip} variant="secondary" fullWidth /> */}
      </View>
    </View>
  );
}

// ─── Match ────────────────────────────────────────────────────────────────────

function MatchSheetContent({
  card,
  onDismiss,
  onSubmit,
}: {
  card: Extract<DailyCard, { type: 'match' }>;
  onDismiss: () => void;
  onSubmit: () => void;
}) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <View style={styles.body}>
      {/* Round profile picture */}
      <View style={styles.matchAvatarWrap}>
        {card.matchImage ? (
          <Image source={{ uri: card.matchImage }} style={styles.matchAvatar} />
        ) : (
          <View
            style={[
              styles.matchAvatar,
              { backgroundColor: AppColors.backgroundDimmest },
            ]}
          >
            <User size={48} color={AppColors.foregroundDimmer} />
          </View>
        )}
      </View>

      {/* Name & age */}
      <AppText variant="title" style={styles.matchName}>
        {card.matchName}
        {card.matchAge ? `, ${card.matchAge}` : ''}
      </AppText>

      {/* Year · Major */}
      {(card.matchYear || card.matchMajor) && (
        <AppText variant="body" color="dimmer" style={styles.matchMeta}>
          {[card.matchYear, card.matchMajor].filter(Boolean).join(' · ')}
        </AppText>
      )}

      <View style={styles.actions}>
        {card.matchProfile && (
          <Button
            title="View full profile"
            onPress={() => { setShowProfile(true); onSubmit(); }}
            variant="primary"
            fullWidth
          />
        )}
        <Button
          title="Not now"
          onPress={onDismiss}
          variant="secondary"
          fullWidth
        />
      </View>

      {/* Full-screen profile modal */}
      {card.matchProfile && (
        <Modal visible={showProfile} animationType="slide" statusBarTranslucent>
          <SafeAreaView style={styles.profileModal}>
            <View style={styles.profileModalHeader}>
              <TouchableOpacity
                onPress={() => setShowProfile(false)}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={22} color={AppColors.foregroundDefault} />
                <AppText variant="body">Back</AppText>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ProfileView profile={card.matchProfile} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

// ─── Preference ───────────────────────────────────────────────────────────────

function PreferenceSheetContent({
  card,
  onDismiss,
  onSubmit,
}: {
  card: Extract<DailyCard, { type: 'preference' }>;
  onDismiss: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.body}>
      <AppText variant="body" color="dimmer" style={{ marginBottom: 20 }}>
        Your answer helps us find better matches for you.
      </AppText>
      {card.replyType === 'options' && (
        <OptionsReply options={card.options ?? []} onDismiss={onDismiss} onSubmit={onSubmit} />
      )}
      {card.replyType === 'text' && <TextReply onDismiss={onDismiss} onSubmit={onSubmit} />}
      {card.replyType === 'ranking' && (
        <RankingReply options={card.options ?? []} onDismiss={onDismiss} onSubmit={onSubmit} />
      )}
      {card.replyType === 'scale' && (
        <ScaleReply
          min={card.scaleMin ?? ''}
          max={card.scaleMax ?? ''}
          onDismiss={onDismiss}
          onSubmit={onSubmit}
        />
      )}
    </View>
  );
}

function OptionsReply({
  options,
  onDismiss,
  onSubmit,
}: {
  options: string[];
  onDismiss: () => void;
  onSubmit: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <View style={styles.optionsList}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionPill, selected === opt && styles.optionPillSelected]}
            onPress={() => setSelected(opt)}
            activeOpacity={0.75}
          >
            <AppText
              variant="subtitle"
              style={{ color: selected === opt ? AppColors.backgroundDefault : AppColors.foregroundDefault }}
            >
              {opt}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="Save answer" onPress={onSubmit} variant="primary" fullWidth disabled={!selected} />
        <Button title="Skip for now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </>
  );
}

function TextReply({ onDismiss, onSubmit }: { onDismiss: () => void; onSubmit: () => void }) {
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
        <Button title="Save answer" onPress={onSubmit} variant="primary" fullWidth disabled={!value.trim()} />
        <Button title="Skip for now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </>
  );
}

function RankingReply({
  options: initial,
  onDismiss,
  onSubmit,
}: {
  options: string[];
  onDismiss: () => void;
  onSubmit: () => void;
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
              <AppText variant="bodySmall" color="inverse" style={{ fontWeight: '700' }}>{i + 1}</AppText>
            </View>
            <AppText variant="body" style={{ flex: 1 }}>{item}</AppText>
            <View style={styles.rankArrows}>
              <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0} hitSlop={{ top: 8, bottom: 4, left: 8, right: 8 }}>
                <ChevronUp size={20} color={i === 0 ? AppColors.foregroundDimmer : AppColors.foregroundDefault} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => move(i, 1)} disabled={i === ranked.length - 1} hitSlop={{ top: 4, bottom: 8, left: 8, right: 8 }}>
                <ChevronDown size={20} color={i === ranked.length - 1 ? AppColors.foregroundDimmer : AppColors.foregroundDefault} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="Save ranking" onPress={onSubmit} variant="primary" fullWidth />
        <Button title="Skip for now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </>
  );
}

const SCALE_STEPS = 5;

function ScaleReply({
  min,
  max,
  onDismiss,
  onSubmit,
}: {
  min: string;
  max: string;
  onDismiss: () => void;
  onSubmit: () => void;
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
        <AppText variant="bodySmall" color="dimmer" style={{ flex: 1 }}>{min}</AppText>
        <AppText variant="bodySmall" color="dimmer" style={{ flex: 1, textAlign: 'right' }}>{max}</AppText>
      </View>
      <View style={styles.actions}>
        <Button title="Save answer" onPress={onSubmit} variant="primary" fullWidth disabled={value === null} />
        <Button title="Skip for now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </>
  );
}

// ─── Profile Action ───────────────────────────────────────────────────────────

function ProfileActionSheetContent({
  card,
  onDismiss,
  onSubmit,
}: {
  card: Extract<DailyCard, { type: 'profile_action' }>;
  onDismiss: () => void;
  onSubmit: () => void;
}) {
  switch (card.id) {
    case 'profile-photo':
      return <PhotoActionContent onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-hometown':
      return <SimpleTextActionContent placeholder="e.g., New York, NY" onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-location':
      return <SimpleTextActionContent placeholder="e.g., Collegetown, Duffield Hall" onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-social':
      return <InstagramActionContent onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-interests':
      return <InterestsActionContent onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-prompt':
      return <PromptActionContent onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-major':
      return <SimpleTextActionContent placeholder="e.g., Computer Science" onDismiss={onDismiss} onSubmit={onSubmit} />;
    case 'profile-year':
      return <YearActionContent onDismiss={onDismiss} onSubmit={onSubmit} />;
    default:
      return <GenericProfileActionContent card={card} onDismiss={onDismiss} onSubmit={onSubmit} />;
  }
}

function PhotoActionContent({ onDismiss, onSubmit }: { onDismiss: () => void; onSubmit: () => void }) {
  return (
    <View style={styles.body}>
      <TouchableOpacity style={styles.photoPlaceholder} activeOpacity={0.7}>
        <Camera size={48} color={AppColors.foregroundDimmer} />
        <AppText variant="body" color="dimmer" style={{ marginTop: 12 }}>Tap to choose a photo</AppText>
      </TouchableOpacity>
      <View style={styles.actions}>
        <Button title="Save photo" onPress={onSubmit} variant="primary" fullWidth disabled />
        <Button title="Not now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

function SimpleTextActionContent({
  placeholder,
  onDismiss,
  onSubmit,
}: {
  placeholder: string;
  onDismiss: () => void;
  onSubmit: () => void;
}) {
  const [value, setValue] = useState('');
  return (
    <View style={styles.body}>
      <AppInput placeholder={placeholder} value={value} onChangeText={setValue} autoCapitalize="words" returnKeyType="done" />
      <View style={styles.actions}>
        <Button title="Save" onPress={onSubmit} variant="primary" fullWidth disabled={!value.trim()} />
        <Button title="Not now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

function InstagramActionContent({ onDismiss, onSubmit }: { onDismiss: () => void; onSubmit: () => void }) {
  const [handle, setHandle] = useState('');
  return (
    <View style={styles.body}>
      <AppInput placeholder="@yourhandle" value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} returnKeyType="done" />
      <View style={styles.actions}>
        <Button title="Save" onPress={onSubmit} variant="primary" fullWidth disabled={!handle.trim()} />
        <Button title="Not now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

function InterestsActionContent({ onDismiss, onSubmit }: { onDismiss: () => void; onSubmit: () => void }) {
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');

  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest('');
    }
  };

  return (
    <View style={styles.body}>
      {interests.length > 0 && (
        <View style={styles.tagsRow}>
          {interests.map((item) => (
            <Tag key={item} label={item} variant="gray" dismissible onDismiss={() => setInterests(interests.filter((i) => i !== item))} />
          ))}
        </View>
      )}
      <View style={styles.addRow}>
        <AppInput
          placeholder="e.g., Music, Photography..."
          value={newInterest}
          onChangeText={setNewInterest}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={addInterest}
          style={{ flex: 1 }}
        />
        <Button title="Add" onPress={addInterest} variant="secondary" iconLeft={Plus} disabled={!newInterest.trim()} />
      </View>
      <View style={styles.actions}>
        <Button title="Save interests" onPress={onSubmit} variant="primary" fullWidth disabled={interests.length === 0} />
        <Button title="Not now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

function PromptActionContent({ onDismiss, onSubmit }: { onDismiss: () => void; onSubmit: () => void }) {
  const [answer, setAnswer] = useState('');
  return (
    <View style={styles.body}>
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
      <AppText variant="bodySmall" color="dimmer" style={{ marginTop: 4 }}>{answer.length}/240</AppText>
      <View style={styles.actions}>
        <Button title="Save answer" onPress={onSubmit} variant="primary" fullWidth disabled={!answer.trim()} />
        <Button title="Not now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

function YearActionContent({ onDismiss, onSubmit }: { onDismiss: () => void; onSubmit: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <View style={styles.body}>
      <View style={styles.optionsList}>
        {YEAR_OPTIONS.map((year) => (
          <TouchableOpacity
            key={year}
            style={[styles.optionPill, selected === year && styles.optionPillSelected]}
            onPress={() => setSelected(year)}
            activeOpacity={0.75}
          >
            <AppText
              variant="subtitle"
              style={{ color: selected === year ? AppColors.backgroundDefault : AppColors.foregroundDefault }}
            >
              {year}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="Save" onPress={onSubmit} variant="primary" fullWidth disabled={!selected} />
        <Button title="Not now" onPress={onDismiss} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

function GenericProfileActionContent({
  card,
  onDismiss,
  onSubmit,
}: {
  card: Extract<DailyCard, { type: 'profile_action' }>;
  onDismiss: () => void;
  onSubmit: () => void;
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
      <View style={styles.actions}>
        <Button
          title="Go to profile"
          onPress={onSubmit}
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
  onSubmit,
}: {
  card: Extract<DailyCard, { type: 'weekly_prompt' }>;
  onDismiss: () => void;
  onSubmit: () => void;
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
          onPress={onSubmit}
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

  // Match sheet
  matchAvatarWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  matchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  matchName: {
    textAlign: 'center',
    marginTop: 8,
  },
  matchMeta: {
    textAlign: 'center',
    marginTop: 2,
  },

  // Full-profile modal
  profileModal: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  profileModalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundDimmest,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Profile action inline editors
  photoPlaceholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.backgroundDimmest,
    borderRadius: 20,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDimmer,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

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
