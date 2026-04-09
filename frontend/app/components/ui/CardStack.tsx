import { AppColors } from '@/app/components/AppColors';
import AppText from '@/app/components/ui/AppText';
import Button from '@/app/components/ui/Button';
import CardContent from '@/app/components/ui/CardContent';
import SheetContent from '@/app/components/ui/CardSheetContent';
import { useHapticFeedback } from '@/app/hooks/useHapticFeedback';
import { ArrowUp, Check, SkipForward } from 'lucide-react-native';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
const PEEK_GAP = 22;
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.6;
const MIN_SWIPE_DX = 40;
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
  if (card.type === 'tutorial') return card.step === 'act' ? 'Try it' : 'Got it';
  if (card.type === 'profile_action') return PROFILE_ACTION_LABELS[card.actionIconName] ?? 'Add info';
  if (card.type === 'preference') return 'Submit response';
  if (card.type === 'weekly_prompt') return 'Answer prompt';
  return 'View profile';
}

// ─── Main component ───────────────────────────────────────────────────────────
//
// Architecture: instead of rotating the cards array (which causes cards to
// jump between DOM slots, producing flashes), we keep cards fixed in the array
// and track the current "top" index. Each card slot has its own z-index driven
// by its distance from the top. The top card flies out, and only AFTER it has
// fully left the screen do we advance the index — with everything already in
// the correct visual position so no flash is possible.

export default function CardStack({ cards: initialCards, onCardDismissed }: CardStackProps) {
  const cards = initialCards; // never mutated — we advance an index instead
  const haptic = useHapticFeedback();
  const hapticRef = useRef(haptic);
  hapticRef.current = haptic;
  const onCardDismissedRef = useRef(onCardDismissed);
  onCardDismissedRef.current = onCardDismissed;

  // Index of which card is currently on top.
  const [topIndex, setTopIndex] = useState(0);
  // During a swipe-out we need a render-phase snapshot of topIndex.
  const topIndexRef = useRef(0);
  topIndexRef.current = topIndex;

  // Set to true by doSkip; useEffect restores slot opacities after React commits.
  const pendingRestore = useRef(false);

  // ── Gesture values (all native-driver safe: transform + opacity) ──────────
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  // JS-thread mirrors for skip button fill only (non-transform properties).
  const panXFill = useRef(new Animated.Value(0)).current;
  const panYFill = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  // dimProgress: 1 = mid card fully dimmed (rest), 0 = fully revealed (swiped).
  const dimProgress = useRef(new Animated.Value(1)).current;

  // Opacity of each slot — all three are hidden during the index-advance reset
  // so that panX.setValue(0) doesn't flash the old top card back into view.
  const topSlotOpacity = useRef(new Animated.Value(1)).current;
  const midSlotOpacity = useRef(new Animated.Value(1)).current;
  const backSlotOpacity = useRef(new Animated.Value(1)).current;

  // The back card (index+2) rises up into its slot after a skip.
  const backCardOffsetY = useRef(new Animated.Value(0)).current;
  // Compensates for the panX reset snapping the mid card from its "revealed"
  // position (translateY=0) back to its "behind" position (translateY=-PEEK_GAP).
  // Pre-set to PEEK_GAP at the moment of the reset so the net position is
  // unchanged, then spring to 0 so the mid card smoothly settles.
  const midCardOffsetY = useRef(new Animated.Value(0)).current;

  // Submit animation: green fill sweeps over the top card, then checkmark pops in.
  const submitFill = useRef(new Animated.Value(0)).current;   // 0→1: green overlay opacity
  const checkmarkScale = useRef(new Animated.Value(0)).current; // 0→1: checkmark spring-in

  // ── Sheet expansion ───────────────────────────────────────────────────────
  const expandProgress = useRef(new Animated.Value(0)).current;
  const sheetDragY = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardRect, setCardRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const measureRef = useRef<View>(null);
  const closeSheetRef = useRef<() => void>(() => {});

  // ── Derived card refs (by offset from topIndex) ───────────────────────────
  // These are stable across renders because the array never changes.
  const getCard = useCallback((offset: number) => {
    if (cards.length === 0) return null;
    return cards[(topIndexRef.current + offset) % cards.length] ?? null;
  }, [cards]);

  // ── Card slot transforms (driven by panX on native thread) ───────────────
  const midTranslateY = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [0, -PEEK_GAP, 0], extrapolate: 'clamp' });
  const midScale      = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [1.0, 0.97, 1.0], extrapolate: 'clamp' });
  const backTranslateY = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [-PEEK_GAP, -PEEK_GAP * 2, -PEEK_GAP], extrapolate: 'clamp' });
  const backScale      = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [0.97, 0.94, 0.97], extrapolate: 'clamp' });
  const topRotate      = panX.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-8deg', '0deg', '8deg'], extrapolate: 'clamp' });

  const midDimOpacity = dimProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.20] });

  // ── Skip ─────────────────────────────────────────────────────────────────
  const doSkip = useCallback((dirX: number, dirY: number = 0) => {
    hapticRef.current.heavy();
    const flyDist = width + 240;

    // Animate panX/panY out AND fade the fill button back to 0 simultaneously
    // so the skip button doesn't stay frozen at the mid-swipe position.
    Animated.parallel([
      Animated.timing(panX,     { toValue: dirX * flyDist, duration: 300, useNativeDriver: true }),
      Animated.timing(panY,     { toValue: dirY * flyDist, duration: 300, useNativeDriver: true }),
      Animated.timing(panXFill, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(panYFill, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => {
      // The top card is now fully off-screen. Mid/back are at their "revealed"
      // positions (scale=1, translateY=0 for mid; scale=0.97, translateY=−PEEK_GAP
      // for back) because panX drove them there.
      //
      // Instead of hiding mid/back cards (which causes a white flash), we keep
      // them visible and compensate for the panX→0 position snap with offsets:
      //   midCardOffsetY = PEEK_GAP  →  net mid translateY = −PEEK_GAP + PEEK_GAP = 0
      //   backCardOffsetY = PEEK_GAP →  net back translateY = −2*PEEK_GAP + PEEK_GAP = −PEEK_GAP
      // These exactly match the mid/back positions at panX=flyDist, so there is
      // no visual jump. Both offsets then spring to 0 in useLayoutEffect.
      // Only the top slot needs opacity=0 to hide the old card teleporting back.
      Animated.parallel([
        Animated.timing(topSlotOpacity,  { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(panX,            { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(panY,            { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(midCardOffsetY,  { toValue: PEEK_GAP, duration: 0, useNativeDriver: true }),
        Animated.timing(backCardOffsetY, { toValue: PEEK_GAP, duration: 0, useNativeDriver: true }),
      ]).start(() => {
        const dismissed = getCard(0);
        pendingRestore.current = true;
        setTopIndex((prev) => (prev + 1) % cards.length);
        if (dismissed) onCardDismissedRef.current?.(dismissed);
      });
    });
  }, [cards, getCard, panX, panY, panXFill, panYFill, topSlotOpacity, midCardOffsetY, backCardOffsetY, dimProgress]);

  // After React commits the new topIndex, reveal the new top card and spring
  // mid/back offsets to 0 so they smoothly settle into their resting positions.
  useLayoutEffect(() => {
    if (!pendingRestore.current) return;
    pendingRestore.current = false;
    // Top slot: new card is now in the correct position — reveal it.
    Animated.timing(topSlotOpacity, { toValue: 1, duration: 0, useNativeDriver: true }).start();
    Animated.spring(dimProgress, { toValue: 1, useNativeDriver: false, tension: 55, friction: 12 }).start();
    // Mid card springs from revealed position (offset=PEEK_GAP) to behind position.
    if (cards.length >= 2) {
      Animated.spring(midCardOffsetY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 12 }).start();
    }
    // Back card springs from old-mid position (offset=PEEK_GAP) to behind position.
    if (cards.length >= 3) {
      Animated.spring(backCardOffsetY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 12 }).start();
    }
  }, [topIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit — green fill + checkmark + fly up ─────────────────────────────
  const doSubmit = useCallback(() => {
    // 1. Close the sheet immediately (no spring — just hide it).
    expandProgress.setValue(0);
    setIsExpanded(false);
    setCardRect(null);

    // 2. Reset submit values in case of re-use.
    submitFill.setValue(0);
    checkmarkScale.setValue(0);

    hapticRef.current.heavy();

    // 3. Green fill fades in over ~220ms.
    Animated.timing(submitFill, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      // 4. Checkmark springs in.
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }).start(() => {
        // 5. Brief pause so the checkmark reads, then fly the card upward.
        setTimeout(() => {
          hapticRef.current.medium();
          doSkip(0, -1);
          // Reset submit overlay after the card is gone.
          setTimeout(() => {
            submitFill.setValue(0);
            checkmarkScale.setValue(0);
          }, 400);
        }, 320);
      });
    });
  }, [expandProgress, submitFill, checkmarkScale, doSkip]);

  // ── Sheet open / close ────────────────────────────────────────────────────
  const openSheet = useCallback(() => {
    measureRef.current?.measureInWindow((x, y, w, h) => {
      sheetDragY.setValue(0);
      // Set expandProgress to a tiny non-zero value before mounting the Modal
      // so it never renders at exactly 0 (which would flash the card at its
      // original position for one frame before the spring starts).
      expandProgress.setValue(0.01);
      setCardRect({ x, y, w, h });
      setIsExpanded(true);
      Animated.spring(expandProgress, { toValue: 1, useNativeDriver: false, tension: 55, friction: 13 }).start();
    });
  }, [expandProgress, sheetDragY]);

  const closeSheet = useCallback(() => {
    sheetDragY.setValue(0);
    Animated.spring(expandProgress, { toValue: 0, useNativeDriver: false, tension: 70, friction: 14 })
      .start(({ finished }) => {
        if (finished) {
          setIsExpanded(false);
          setCardRect(null);
          expandProgress.setValue(0);
        }
      });
  }, [expandProgress, sheetDragY]);

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
  const doSkipRef = useRef(doSkip);
  doSkipRef.current = doSkip;
  const openSheetRef = useRef(openSheet);
  openSheetRef.current = openSheet;

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
          doSkipRef.current(dirX, dirY);
        } else if (dist < 8) {
          panX.setValue(0);
          panY.setValue(0);
          panXFill.setValue(0);
          panYFill.setValue(0);
          openSheetRef.current();
        } else {
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

  const topCard  = getCard(0)!;
  const midCard  = getCard(1);
  const backCard = getCard(2);

  return (
    <View style={styles.container}>
      <View ref={measureRef} style={[styles.measureTarget, { top: PEEK_GAP * 2, height: CARD_HEIGHT }]} pointerEvents="none" />

      <View style={[styles.stackArea, { height: CARD_HEIGHT + PEEK_GAP * 2 }]}>
        {/* Back card */}
        {backCard && (
          <Animated.View style={[styles.cardShadow, {
            zIndex: 1,
            opacity: backSlotOpacity,
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
        {/* Mid card — dim overlay fades as top card is dragged away */}
        {midCard && (
          <Animated.View style={[styles.cardShadow, {
            zIndex: 2,
            opacity: midSlotOpacity,
            transform: [{ translateY: Animated.add(midTranslateY, midCardOffsetY) }, { scale: midScale }],
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
            opacity: topSlotOpacity,
            transform: [{ translateX: panX }, { translateY: panY }, { rotate: topRotate }, { scale: pressScale }],
          }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.cardClip} pointerEvents="none">
            <CardContent card={topCard} />
            {/* Green submit overlay */}
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.submitOverlay, { opacity: submitFill }]}
              pointerEvents="none"
            >
              <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                <Check size={72} color="#fff" strokeWidth={3} />
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.buttonRow}>
        <SwipeProgressButton panXFill={panXFill} panYFill={panYFill} onPress={() => doSkip(1, 0)} />
        <View style={styles.doItWrap}>
          <Button
            title={getActionLabel(topCard)}
            onPress={topCard.type === 'tutorial' && topCard.step !== 'act' ? () => doSkip(1, 0) : openSheet}
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
                <SheetContent
                  card={topCard}
                  onDismiss={closeSheet}
                  onSubmit={doSubmit}
                  onDismissAndSkip={() => { closeSheet(); setTimeout(() => doSkip(1, 0), 320); }}
                />
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ─── Directional skip button ──────────────────────────────────────────────────

const FILL_SIZE = 400;
const FILL_THRESHOLD_X = width * 0.85;
const FILL_THRESHOLD_Y = screenHeight * 0.45;

function SwipeProgressButton({ panXFill, panYFill, onPress }: { panXFill: Animated.Value; panYFill: Animated.Value; onPress: () => void }) {
  const leftTranslateX = panXFill.interpolate({
    inputRange: [0, FILL_THRESHOLD_X],
    outputRange: [-FILL_SIZE, 0],
    extrapolate: 'clamp',
  });
  const rightTranslateX = panXFill.interpolate({
    inputRange: [-FILL_THRESHOLD_X, 0],
    outputRange: [0, FILL_SIZE],
    extrapolate: 'clamp',
  });
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
    top: (48 - FILL_SIZE) / 2,
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
  submitOverlay: {
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
});
