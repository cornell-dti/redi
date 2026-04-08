import { AppColors } from '@/app/components/AppColors';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import CardContent from '@/app/components/ui/CardContent';
import SheetContent from '@/app/components/ui/CardSheetContent';
import { useHapticFeedback } from '@/app/hooks/useHapticFeedback';
import { ArrowUp, SkipForward } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { DailyCard } from './cardTypes';

export type { DailyCard } from './cardTypes';

const { width, height: screenHeight } = Dimensions.get('window');

const CARD_HEIGHT = screenHeight * 0.58;
const PEEK_GAP = 22;           // larger gap = more peek from back cards
const SWIPE_THRESHOLD = 100;   // distance px to commit a swipe
const VELOCITY_THRESHOLD = 0.6; // vx to commit a swipe
const MIN_SWIPE_DX = 40;       // minimum horizontal component to count as a swipe
const LONG_PRESS_MS = 320;
const SWIPE_START_PX = 10;

const SHEET_TOP = screenHeight * 0.08;
const SHEET_MARGIN = 8;
const SHEET_HEIGHT = screenHeight - SHEET_TOP - SHEET_MARGIN;

interface CardStackProps {
  cards: DailyCard[];
  onCardDismissed?: (card: DailyCard) => void;
}

function getSheetTitle(card: DailyCard): string {
  if (card.type === 'tutorial') return card.title;
  if (card.type === 'profile_action') return card.actionTitle;
  if (card.type === 'preference') return card.question;
  if (card.type === 'weekly_prompt') return "This week's prompt";
  return card.matchName ? `Meet ${card.matchName}` : 'Your match';
}

const PROFILE_ACTION_LABELS: Record<string, string> = {
  camera:   'Add picture',
  home:     'Add hometown',
  mapPin:   'Add location',
  message:  'Add answer',
  link:     'Add link',
  star:     'Add interests',
  user:     'Add info',
  bookOpen: 'Add major',
};

function getActionLabel(card: DailyCard): string {
  if (card.type === 'tutorial') return 'Got it';
  if (card.type === 'profile_action') return PROFILE_ACTION_LABELS[card.actionIconName] ?? 'Add info';
  if (card.type === 'preference') return 'Submit response';
  if (card.type === 'weekly_prompt') return 'Answer prompt';
  return 'View profile';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CardStack({ cards: initialCards, onCardDismissed }: CardStackProps) {
  const [cards, setCards] = useState(initialCards);
  const haptic = useHapticFeedback();
  const hapticRef = useRef(haptic);
  hapticRef.current = haptic;
  const onCardDismissedRef = useRef(onCardDismissed);
  onCardDismissedRef.current = onCardDismissed;

  // ── Gesture values ────────────────────────────────────────────────────────
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  // JS-thread mirrors of panX/panY — used only for non-transform animated
  // properties (skip button fill). Kept separate to avoid native-driver conflicts.
  const panXFill = useRef(new Animated.Value(0)).current;
  const panYFill = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  // Controls the dark dim overlay on the mid card.
  // 1 = fully dim (at rest), 0 = transparent (fully swiped).
  // Using a separate Animated.Value — driven by drag distance in onMove,
  // and sprung back to 1 after snap-back or skip — prevents any flash.
  const dimProgress = useRef(new Animated.Value(1)).current;

  // topCardOpacity is set via setValue (not React state) so that
  // opacity=0 and panX=0 are processed atomically on the native side,
  // eliminating the 1-frame flash when rotating the card stack.
  const topCardOpacity = useRef(new Animated.Value(1)).current;
  // midCardOpacity is set to 0 before panX resets so the mid card doesn't
  // visibly snap from its "fully revealed" position back to rest position.
  const midCardOpacity = useRef(new Animated.Value(1)).current;
  // backCardOffsetY drives the returned card rising up into the back slot.
  const backCardOffsetY = useRef(new Animated.Value(0)).current;

  // ── Sheet expansion ───────────────────────────────────────────────────────
  const expandProgress = useRef(new Animated.Value(0)).current;
  const sheetDragY = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardRect, setCardRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const measureRef = useRef<View>(null);

  const closeSheetRef = useRef<() => void>(() => {});

  // ── Card transforms (native-driver: transform + opacity only) ────────────
  const midTranslateY = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [0, -PEEK_GAP, 0], extrapolate: 'clamp' });
  const midScale = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [1.0, 0.97, 1.0], extrapolate: 'clamp' });

  const backTranslateY = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [-PEEK_GAP, -PEEK_GAP * 2, -PEEK_GAP], extrapolate: 'clamp' });
  const backScale = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [0.97, 0.94, 0.97], extrapolate: 'clamp' });

  const topRotate = panX.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-8deg', '0deg', '8deg'], extrapolate: 'clamp' });

  // Mid card dim overlay opacity — driven by dimProgress (JS thread).
  // dimProgress=1 → overlay opacity 0.20 (slightly dark).
  // dimProgress=0 → overlay opacity 0 (fully transparent, card looks normal).
  const midDimOpacity = dimProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.20],
  });

  // ── Skip — flies in swipe direction ──────────────────────────────────────
  const doSkip = (dirX: number, dirY: number = 0) => {
    hapticRef.current.heavy();
    const flyDist = width + 240;
    Animated.parallel([
      Animated.timing(panX, { toValue: dirX * flyDist, duration: 300, useNativeDriver: true }),
      Animated.timing(panY, { toValue: dirY * flyDist, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      // Hide top AND mid card before resetting panX.
      // At panX=flyDist the mid card is at scale=1/translateY=0 (clamped);
      // resetting panX to 0 would snap it back to its rest position in one frame,
      // making it look like the mid card is sliding backwards. Hiding it first
      // prevents that flash entirely.
      topCardOpacity.setValue(0);
      midCardOpacity.setValue(0);
      panX.setValue(0);
      panY.setValue(0);
      panXFill.setValue(0);
      panYFill.setValue(0);
      // The skipped card will rise up into the back slot from slightly below.
      backCardOffsetY.setValue(28);
      setCards((prev) => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        onCardDismissedRef.current?.(first);
        return [...rest, first];
      });
      setTimeout(() => {
        // Snap top and mid visible — they're already at their correct rest
        // positions (panX=0) so no movement is visible.
        topCardOpacity.setValue(1);
        midCardOpacity.setValue(1);
        Animated.spring(dimProgress, { toValue: 1, useNativeDriver: false, tension: 55, friction: 12 }).start();
        // Skipped card rises up into the back of the stack.
        if (initialCards.length >= 3) {
          Animated.spring(backCardOffsetY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 12 }).start();
        }
      }, 40);
    });
  };

  // ── Sheet open / close ────────────────────────────────────────────────────
  const openSheet = () => {
    topCardOpacity.setValue(0);
    measureRef.current?.measureInWindow((x, y, w, h) => {
      sheetDragY.setValue(0);
      setCardRect({ x, y, w, h });
      setIsExpanded(true);
      Animated.spring(expandProgress, { toValue: 1, useNativeDriver: false, tension: 55, friction: 13 }).start();
    });
  };

  const closeSheet = () => {
    sheetDragY.setValue(0);
    Animated.spring(expandProgress, { toValue: 0, useNativeDriver: false, tension: 70, friction: 14 })
      .start(({ finished }) => {
        if (finished) {
          setIsExpanded(false);
          setCardRect(null);
          expandProgress.setValue(0);
          topCardOpacity.setValue(1);
        }
      });
  };

  closeSheetRef.current = closeSheet;

  // ── Sheet drag-to-dismiss ─────────────────────────────────────────────────
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetDragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          closeSheetRef.current();
        } else {
          Animated.spring(sheetDragY, { toValue: 0, useNativeDriver: false, tension: 180, friction: 14 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetDragY, { toValue: 0, useNativeDriver: false }).start();
      },
    })
  ).current;

  // ── Card PanResponder ─────────────────────────────────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haptedSwipeStart = useRef(false);
  const haptedThreshold = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.sqrt(g.dx * g.dx + g.dy * g.dy) > 6,

      onPanResponderGrant: () => {
        panX.stopAnimation();
        panY.stopAnimation();
        haptedSwipeStart.current = false;
        haptedThreshold.current = false;
        longPressTimer.current = setTimeout(() => hapticRef.current.light(), LONG_PRESS_MS);
        Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, tension: 400, friction: 8 }).start();
      },

      onPanResponderMove: (_, g) => {
        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        if (dist > 6 && longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        if (!haptedSwipeStart.current && dist > SWIPE_START_PX) {
          hapticRef.current.medium();
          haptedSwipeStart.current = true;
          pressScale.setValue(1);
        }
        if (!haptedThreshold.current && dist > SWIPE_THRESHOLD) {
          hapticRef.current.rigid();
          haptedThreshold.current = true;
        }
        if (haptedThreshold.current && dist < SWIPE_THRESHOLD * 0.7) {
          haptedThreshold.current = false;
        }
        panX.setValue(g.dx);
        panY.setValue(g.dy);
        panXFill.setValue(g.dx);
        panYFill.setValue(g.dy);
        // Drive dim overlay: 0 when fully dragged, 1 when at rest
        dimProgress.setValue(Math.max(0, 1 - dist / (width * 0.7)));
      },

      onPanResponderRelease: (_, g) => {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }).start();

        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        const isSwipe = (dist > SWIPE_THRESHOLD && Math.abs(g.dx) > MIN_SWIPE_DX) || Math.abs(g.vx) > VELOCITY_THRESHOLD;

        if (isSwipe) {
          const dirX = dist > 0 ? g.dx / dist : 1;
          const dirY = dist > 0 ? g.dy / dist : 0;
          doSkip(dirX, dirY);
        } else if (dist < 8) {
          panX.setValue(0);
          panY.setValue(0);
          panXFill.setValue(0);
          panYFill.setValue(0);
          openSheet();
        } else {
          // Snap back — spring all values including dimProgress
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, tension: 180, friction: 14 }).start();
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, tension: 180, friction: 14 }).start();
          Animated.spring(panXFill, { toValue: 0, useNativeDriver: false, tension: 180, friction: 14 }).start();
          Animated.spring(panYFill, { toValue: 0, useNativeDriver: false, tension: 180, friction: 14 }).start();
          Animated.spring(dimProgress, { toValue: 1, useNativeDriver: false, tension: 180, friction: 14 }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        pressScale.setValue(1);
        Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
        Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        panXFill.setValue(0);
        panYFill.setValue(0);
        dimProgress.setValue(1);
      },
    })
  ).current;

  // ── Expansion styles (JS thread — layout properties) ─────────────────────
  const cr = cardRect ?? { x: 16, y: 200, w: width - 32, h: CARD_HEIGHT };
  const overlayTop = expandProgress.interpolate({ inputRange: [0, 1], outputRange: [cr.y, SHEET_TOP] });
  const overlayLeft = expandProgress.interpolate({ inputRange: [0, 1], outputRange: [cr.x, SHEET_MARGIN] });
  const overlayRight = expandProgress.interpolate({ inputRange: [0, 1], outputRange: [width - cr.x - cr.w, SHEET_MARGIN] });
  const overlayHeight = expandProgress.interpolate({ inputRange: [0, 1], outputRange: [cr.h, SHEET_HEIGHT] });
  const backdropOpacity = expandProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
  const cardContentOpacity = expandProgress.interpolate({ inputRange: [0, 0.3, 0.5], outputRange: [1, 1, 0], extrapolate: 'clamp' });
  const sheetContentOpacity = expandProgress.interpolate({ inputRange: [0.45, 0.75, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  const overlayBorderBottomRadius = expandProgress.interpolate({ inputRange: [0, 1], outputRange: [24, 48] });

  if (cards.length === 0) return null;

  const topCard = cards[0];
  const midCard = cards[1] ?? null;
  const backCard = cards[2] ?? null;

  return (
    <View style={styles.container}>
      <View ref={measureRef} style={[styles.measureTarget, { top: PEEK_GAP * 2, height: CARD_HEIGHT }]} pointerEvents="none" />

      <View style={[styles.stackArea, { height: CARD_HEIGHT + PEEK_GAP * 2 }]}>
        {/* Back card — no dim overlay */}
        {backCard && (
          <Animated.View style={[styles.cardShadow, {
            zIndex: 1,
            transform: [
              { translateY: Animated.add(backTranslateY, backCardOffsetY) },
              { scale: backScale },
            ],
          }]}>
            <View style={styles.cardClip} pointerEvents="none">
              <CardContent card={backCard} />
            </View>
          </Animated.View>
        )}
        {/* Mid card — dim overlay fades out as top card is dragged away */}
        {midCard && (
          <Animated.View style={[styles.cardShadow, {
            zIndex: 2,
            opacity: midCardOpacity,
            transform: [{ translateY: midTranslateY }, { scale: midScale }],
          }]}>
            <View style={styles.cardClip} pointerEvents="none">
              <CardContent card={midCard} />
              <Animated.View style={[StyleSheet.absoluteFill, styles.dimOverlay, { opacity: midDimOpacity }]} pointerEvents="none" />
            </View>
          </Animated.View>
        )}
        {/* Top card */}
        <Animated.View
          style={[styles.cardShadow, {
            zIndex: 10,
            opacity: topCardOpacity,
            transform: [{ translateX: panX }, { translateY: panY }, { rotate: topRotate }, { scale: pressScale }],
          }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.cardClip} pointerEvents="none"><CardContent card={topCard} /></View>
        </Animated.View>
      </View>

      <View style={styles.buttonRow}>
        <SwipeProgressButton panXFill={panXFill} panYFill={panYFill} onPress={() => doSkip(1, 0)} />
        <View style={styles.doItWrap}>
          <Button
            title={getActionLabel(topCard)}
            onPress={topCard.type === 'tutorial' ? () => doSkip(1, 0) : openSheet}
            variant="primary"
            iconLeft={ArrowUp}
            fullWidth
          />
        </View>
      </View>

      {isExpanded && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]} pointerEvents="none" />
          </Pressable>

          <Animated.View style={[styles.sheetOverlay, {
            top: overlayTop,
            left: overlayLeft,
            right: overlayRight,
            height: overlayHeight,
            borderBottomLeftRadius: overlayBorderBottomRadius,
            borderBottomRightRadius: overlayBorderBottomRadius,
            transform: [{ translateY: sheetDragY }],
          }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: cardContentOpacity }]} pointerEvents="none">
              <CardContent card={topCard} />
            </Animated.View>

            <Animated.View style={{ flex: 1, opacity: sheetContentOpacity }}>
              <View style={styles.dragHandleContainer} {...sheetPanResponder.panHandlers}>
                <View style={styles.dragHandle} />
              </View>
              <View style={styles.titleContainer}>
                <AppText variant="subtitle">{getSheetTitle(topCard)}</AppText>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <SheetContent card={topCard} onDismiss={closeSheet} />
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ─── Directional skip button ──────────────────────────────────────────────────

const FILL_SIZE = 400; // large square, clipped by parent overflow:hidden
const FILL_THRESHOLD_X = width * 0.85;
const FILL_THRESHOLD_Y = screenHeight * 0.45;

function SwipeProgressButton({ panXFill, panYFill, onPress }: { panXFill: Animated.Value; panYFill: Animated.Value; onPress: () => void }) {
  // Left fill (right drag): square slides in from left
  const leftTranslateX = panXFill.interpolate({
    inputRange: [0, FILL_THRESHOLD_X],
    outputRange: [-FILL_SIZE, 0],
    extrapolate: 'clamp',
  });
  // Right fill (left drag): square slides in from right
  const rightTranslateX = panXFill.interpolate({
    inputRange: [-FILL_THRESHOLD_X, 0],
    outputRange: [0, FILL_SIZE],
    extrapolate: 'clamp',
  });
  // Y offset: drag up → fill rises from below (+Y shift); drag down → fill falls from above (-Y shift)
  const fillTranslateY = panYFill.interpolate({
    inputRange: [-FILL_THRESHOLD_Y, 0, FILL_THRESHOLD_Y],
    outputRange: [FILL_SIZE * 0.6, 0, -FILL_SIZE * 0.6],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.skipOuter}>
      <Animated.View style={[styles.skipFill, styles.skipFillLeft,  { transform: [{ translateX: leftTranslateX  }, { translateY: fillTranslateY }] }]} pointerEvents="none" />
      <Animated.View style={[styles.skipFill, styles.skipFillRight, { transform: [{ translateX: rightTranslateX }, { translateY: fillTranslateY }] }]} pointerEvents="none" />
      <TouchableOpacity style={styles.skipTouchable} onPress={onPress} activeOpacity={0.8}>
        <SkipForward size={20} color={AppColors.foregroundDefault} />
        <AppText variant="body">Skip</AppText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  measureTarget: { position: 'absolute', left: 0, right: 0, zIndex: -1 },
  stackArea: { position: 'relative', marginBottom: 20 },

  cardShadow: {
    position: 'absolute', top: PEEK_GAP * 2, left: 0, right: 0, height: CARD_HEIGHT,
    borderRadius: 24, backgroundColor: AppColors.backgroundDefault,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 12,
  },
  cardClip: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: AppColors.backgroundDefault },

  // Solid black overlay — dims card without transparency (no see-through)
  dimOverlay: { backgroundColor: '#000' },

  buttonRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  doItWrap: { flex: 1 },

  skipOuter: {
    flex: 1, height: 48, borderRadius: 128,
    backgroundColor: AppColors.backgroundDimmer,
    overflow: 'hidden',
  },
  skipFill: {
    position: 'absolute',
    width: FILL_SIZE,
    height: FILL_SIZE,
    top: (48 - FILL_SIZE) / 2, // vertically center in 48px button
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  skipFillLeft:  { left: 0 },
  skipFillRight: { right: 0 },
  skipTouchable: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },

  sheetOverlay: {
    position: 'absolute',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: AppColors.backgroundDefault,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 32, elevation: 20,
  },
  dragHandleContainer: {
    height: 32, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 8,
  },
  dragHandle: { width: 64, height: 6, borderRadius: 3, backgroundColor: '#e0e0e0' },
  titleContainer: { paddingHorizontal: 16, marginBottom: 8 },
  sheetScrollContent: { paddingHorizontal: 16, paddingBottom: 48 },
});
