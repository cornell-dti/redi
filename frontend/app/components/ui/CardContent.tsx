import { AppColors } from '@/app/components/AppColors';
import AppText from '@/app/components/ui/AppText';
import {
  ArrowLeftRight,
  ArrowUp,
  Heart,
  HelpCircle,
  Sliders,
  Sparkles,
  User,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DailyCard } from './cardTypes';

// ─── Per-card-type color palettes ──────────────────────────────────────────────

const TUTORIAL_STEPS: Record<
  string,
  {
    topBg: string;
    bg: string;
    tag: string;
    tagText: string;
    icon: string;
    deco: string;
    accent: string;
    Icon: React.ElementType;
    tagLabel: string;
    hint: React.ReactNode;
  }
> = {
  skip: {
    topBg: '#FEF3C7',
    bg: '#FFFBEB',
    tag: '#FDE68A',
    tagText: '#92400E',
    icon: '#D97706',
    deco: 'rgba(251,191,36,0.25)',
    accent: '#D97706',
    Icon: ArrowLeftRight,
    tagLabel: 'How to skip',
    hint: null, // rendered inline below
  },
  act: {
    topBg: '#FEF3C7',
    bg: '#FFFBEB',
    tag: '#FDE68A',
    tagText: '#92400E',
    icon: '#D97706',
    deco: 'rgba(251,191,36,0.25)',
    accent: '#D97706',
    Icon: ArrowUp,
    tagLabel: 'How to act',
    hint: null,
  },
  filter: {
    topBg: '#FEF3C7',
    bg: '#FFFBEB',
    tag: '#FDE68A',
    tagText: '#92400E',
    icon: '#D97706',
    deco: 'rgba(251,191,36,0.25)',
    accent: '#D97706',
    Icon: Sliders,
    tagLabel: 'How to filter',
    hint: null,
  },
};

const C = {
  profile: {
    topBg: '#DBEAFE',
    bg: '#EFF6FF',
    tag: '#BFDBFE',
    tagText: '#1D4ED8',
    icon: '#2563EB',
    deco: 'rgba(96,165,250,0.3)',
  },
  preference: {
    topBg: '#EDE9FE',
    bg: '#F0EEFF',
    tag: '#E8E2FF',
    tagText: '#5B21B6',
    icon: '#7C3AED',
    deco: 'rgba(167,139,250,0.25)',
    accent: '#7C3AED',
    pillBg: '#EDE9FE',
    pillBorder: '#C4B5FD',
  },
  weekly: {
    topBg: '#D1FAE5',
    bg: '#ECFDF5',
    tag: '#D1FAE5',
    tagText: '#065F46',
    icon: '#059669',
    accent: '#059669',
    timeBg: '#A7F3D0',
    timeText: '#065F46',
    deco: 'rgba(52,211,153,0.2)',
  },
  match: {
    topBg: '#FCE7F3',
    bg: '#FFF0F8',
    tag: '#FBCFE8',
    tagText: '#9D174D',
    icon: '#EC4899',
    deco: 'rgba(244,114,182,0.3)',
  },
};

// ─── Shared top section ───────────────────────────────────────────────────────
// All 4 card types share this: colored bg + decorative blobs + icon circle.

function CardTop({
  topBg,
  deco,
  icon: Icon,
  iconColor,
}: {
  topBg: string;
  deco: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <View style={[styles.cardTop, { backgroundColor: topBg }]}>
      <View
        style={[
          styles.blob,
          {
            width: 180,
            height: 180,
            top: -50,
            right: -50,
            backgroundColor: deco,
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.blob,
          {
            width: 90,
            height: 90,
            bottom: -20,
            left: -20,
            backgroundColor: deco,
          },
        ]}
        pointerEvents="none"
      />
      <View style={styles.iconCircle}>
        <Icon size={38} color={iconColor} />
      </View>
    </View>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function CardContent({ card }: { card: DailyCard }) {
  if (card.type === 'tutorial') return <TutorialCardView card={card} />;
  if (card.type === 'match') return <MatchCard card={card} />;
  if (card.type === 'preference') return <PreferenceCard card={card} />;
  if (card.type === 'weekly_prompt') return <WeeklyPromptCard card={card} />;
  return <ProfileActionCard card={card} />;
}

// ─── Match ────────────────────────────────────────────────────────────────────

function MatchCard({ card }: { card: Extract<DailyCard, { type: 'match' }> }) {
  return (
    <View style={[styles.fill, { backgroundColor: C.match.bg }]}>
      <CardTop
        topBg={C.match.topBg}
        deco={C.match.deco}
        icon={Heart}
        iconColor={C.match.icon}
      />
      <View style={styles.cardBottom}>
        <View style={[styles.tag, { backgroundColor: C.match.tag }]}>
          <AppText
            variant="bodySmall"
            style={[styles.tagText, { color: C.match.tagText }]}
          >
            New match
          </AppText>
        </View>
        <AppText variant="subtitle" style={{ fontWeight: '700', marginTop: 8 }}>
          {card.matchName ?? 'Your match'}
          {card.matchAge ? `, ${card.matchAge}` : ''}
        </AppText>
        {(card.matchYear || card.matchMajor) && (
          <AppText
            variant="body"
            color="dimmer"
            style={{ marginTop: 6, lineHeight: 22 }}
          >
            {[card.matchYear, card.matchMajor].filter(Boolean).join(' · ')}
          </AppText>
        )}
        <AppText
          variant="bodySmall"
          style={{ color: C.match.icon, marginTop: 14, fontWeight: '500' }}
        >
          Tap to view →
        </AppText>
      </View>
    </View>
  );
}

// ─── Preference ───────────────────────────────────────────────────────────────

function PreferenceCard({
  card,
}: {
  card: Extract<DailyCard, { type: 'preference' }>;
}) {
  return (
    <View style={[styles.fill, { backgroundColor: C.preference.bg }]}>
      <CardTop
        topBg={C.preference.topBg}
        deco={C.preference.deco}
        icon={HelpCircle}
        iconColor={C.preference.icon}
      />
      <View style={styles.cardBottom}>
        <View style={[styles.tag, { backgroundColor: C.preference.tag }]}>
          <AppText
            variant="bodySmall"
            style={[styles.tagText, { color: C.preference.tagText }]}
          >
            Refine matches
          </AppText>
        </View>
        <View style={styles.preferenceBody}>
          <AppText
            variant="subtitle"
            style={{ fontWeight: '700', lineHeight: 28 }}
          >
            {card.question}
          </AppText>
          <PreferencePreview card={card} />
        </View>
      </View>
    </View>
  );
}

function PreferencePreview({
  card,
}: {
  card: Extract<DailyCard, { type: 'preference' }>;
}) {
  if (card.replyType === 'options' && card.options) {
    return (
      <View style={styles.optionsRow}>
        {card.options.map((opt, i) => (
          <View
            key={opt}
            style={[
              styles.optionPill,
              {
                backgroundColor: i === 0 ? C.preference.accent : 'transparent',
                borderColor: C.preference.accent,
              },
            ]}
          >
            <AppText
              variant="body"
              style={{
                color: i === 0 ? '#FFF' : C.preference.accent,
                fontWeight: '500',
              }}
            >
              {opt}
            </AppText>
          </View>
        ))}
      </View>
    );
  }

  if (card.replyType === 'ranking' && card.options) {
    return (
      <View style={styles.rankPreview}>
        {card.options.slice(0, 3).map((opt, i) => (
          <View key={opt} style={styles.rankPreviewRow}>
            <View
              style={[styles.rankDot, { backgroundColor: C.preference.accent }]}
            >
              <AppText
                style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}
              >
                {i + 1}
              </AppText>
            </View>
            <AppText
              variant="bodySmall"
              color="dimmer"
              style={{ flex: 1 }}
              numberOfLines={1}
            >
              {opt}
            </AppText>
          </View>
        ))}
        {card.options.length > 3 && (
          <AppText
            variant="bodySmall"
            color="dimmer"
            style={{ marginLeft: 30 }}
          >
            +{card.options.length - 3} more
          </AppText>
        )}
      </View>
    );
  }

  if (card.replyType === 'scale') {
    return (
      <View style={{ gap: 8 }}>
        <View style={styles.scaleDots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.scaleSeg,
                {
                  backgroundColor:
                    i <= 1 ? C.preference.accent : C.preference.pillBg,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.scaleLabels}>
          <AppText variant="bodySmall" color="dimmer">
            {card.scaleMin}
          </AppText>
          <AppText variant="bodySmall" color="dimmer">
            {card.scaleMax}
          </AppText>
        </View>
      </View>
    );
  }

  // text
  return (
    <View style={styles.textPreview}>
      <AppText
        variant="bodySmall"
        style={{ color: C.preference.accent, fontStyle: 'italic' }}
      >
        Tap to write your answer...
      </AppText>
      <View
        style={[styles.textLine, { backgroundColor: C.preference.pillBorder }]}
      />
      <View
        style={[
          styles.textLine,
          { backgroundColor: C.preference.pillBorder, width: '60%' },
        ]}
      />
    </View>
  );
}

// ─── Profile Action ───────────────────────────────────────────────────────────

function ProfileActionCard({
  card,
}: {
  card: Extract<DailyCard, { type: 'profile_action' }>;
}) {
  return (
    <View style={[styles.fill, { backgroundColor: C.profile.bg }]}>
      <CardTop
        topBg={C.profile.topBg}
        deco={C.profile.deco}
        icon={User}
        iconColor={C.profile.icon}
      />
      <View style={styles.cardBottom}>
        <View style={[styles.tag, { backgroundColor: C.profile.tag }]}>
          <AppText
            variant="bodySmall"
            style={[styles.tagText, { color: C.profile.tagText }]}
          >
            Build your profile
          </AppText>
        </View>
        <AppText variant="subtitle" style={{ fontWeight: '700', marginTop: 8 }}>
          {card.actionTitle}
        </AppText>
        <AppText
          variant="body"
          color="dimmer"
          style={{ marginTop: 6, lineHeight: 22 }}
        >
          {card.actionDescription}
        </AppText>
        <AppText
          variant="bodySmall"
          style={{ color: C.profile.icon, marginTop: 14, fontWeight: '500' }}
        >
          Tap to get started →
        </AppText>
      </View>
    </View>
  );
}

// ─── Weekly Prompt ────────────────────────────────────────────────────────────

function WeeklyPromptCard({
  card,
}: {
  card: Extract<DailyCard, { type: 'weekly_prompt' }>;
}) {
  const daysLeft = card.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(card.expiresAt).getTime() - Date.now()) / 86_400_000
        )
      )
    : null;

  return (
    <View style={[styles.fill, { backgroundColor: C.weekly.bg }]}>
      <CardTop
        topBg={C.weekly.topBg}
        deco={C.weekly.deco}
        icon={Sparkles}
        iconColor={C.weekly.icon}
      />
      <View style={styles.cardBottom}>
        <View style={styles.weeklyTagRow}>
          <View style={[styles.tag, { backgroundColor: C.weekly.tag }]}>
            <AppText
              variant="bodySmall"
              style={[styles.tagText, { color: C.weekly.tagText }]}
            >
              Weekly prompt
            </AppText>
          </View>
          {daysLeft !== null && (
            <View style={[styles.tag, { backgroundColor: C.weekly.timeBg }]}>
              <AppText
                variant="bodySmall"
                style={[styles.tagText, { color: C.weekly.timeText }]}
              >
                {daysLeft}d left
              </AppText>
            </View>
          )}
        </View>
        <AppText
          variant="subtitle"
          style={{ fontWeight: '700', marginTop: 8, lineHeight: 28 }}
        >
          {card.promptText}
        </AppText>
        <AppText
          variant="bodySmall"
          style={{ color: C.weekly.accent, fontWeight: '500', marginTop: 12 }}
        >
          Answer → shows on your profile
        </AppText>
      </View>
    </View>
  );
}

// ─── Tutorial ─────────────────────────────────────────────────────────────────

function TutorialCardView({
  card,
}: {
  card: Extract<DailyCard, { type: 'tutorial' }>;
}) {
  const s = TUTORIAL_STEPS[card.step];
  const { Icon } = s;
  return (
    <View style={[styles.fill, { backgroundColor: s.bg }]}>
      <CardTop topBg={s.topBg} deco={s.deco} icon={Icon} iconColor={s.icon} />
      <View style={styles.cardBottom}>
        <View style={[styles.tag, { backgroundColor: s.tag }]}>
          <AppText
            variant="bodySmall"
            style={[styles.tagText, { color: s.tagText }]}
          >
            {s.tagLabel}
          </AppText>
        </View>
        <AppText
          variant="subtitle"
          style={{ fontWeight: '700', marginTop: 8, lineHeight: 28 }}
        >
          {card.title}
        </AppText>
        <AppText
          variant="body"
          color="dimmer"
          style={{ marginTop: 6, lineHeight: 22 }}
        >
          {card.subtitle}
        </AppText>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fill: { flex: 1 },

  // Shared structure — all 4 types use cardTop + cardBottom
  cardTop: {
    height: '46%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBottom: { flex: 1, padding: 24 },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AppColors.backgroundDefault,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  blob: { position: 'absolute', borderRadius: 999 },

  tag: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  tagText: { fontWeight: '600', fontSize: 13 },

  // ─── Preference ─────────────────────────────────────────────────────────────
  preferenceBody: { flex: 1, justifyContent: 'center', gap: 16 },

  optionsRow: { flexDirection: 'row', gap: 10 },
  optionPill: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankPreview: { gap: 10 },
  rankPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scaleDots: { flexDirection: 'row', gap: 6 },
  scaleSeg: { flex: 1, height: 7, borderRadius: 4 },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },

  textPreview: { gap: 10 },
  textLine: { height: 1.5, borderRadius: 1 },

  // ─── Weekly Prompt ────────────────────────────────────────────────────────
  weeklyTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
