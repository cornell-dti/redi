import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Configuration for different drag-and-drop patterns
 */
export type DragType = 'grid' | 'list' | 'tag';

export interface DragConfig {
  /** Type of drag pattern */
  type: DragType;
  /** Current index of the item */
  index: number;
  /** Total number of items */
  totalItems: number;
  /** Callback when drag starts */
  onDragStart: () => void;
  /** Callback when drag ends with target index */
  onDragEnd: (toIndex: number) => void;
  /** Callback when hover position changes */
  onHoverChange: (toIndex: number | null) => void;
  /** Haptic feedback callback */
  onHaptic: () => void;
  /** Is currently dragging */
  isDragging: boolean;

  // Grid-specific (for 3-column photo grids)
  /** Size of each grid slot (for grid type) */
  gridSlotSize?: number;
  /** Gap between grid items (for grid type) */
  gridGap?: number;

  // List-specific (for vertical lists)
  /** Height of each list item (for list type) */
  listItemHeight?: number;

  // Tag-specific (for flexible wrap tags)
  /** Horizontal threshold in px (for tag type) */
  tagHorizontalThreshold?: number;
  /** Vertical threshold in px (for tag type) */
  tagVerticalThreshold?: number;
  /** Estimated tags per row (for tag type) */
  tagsPerRow?: number;
}

/**
 * Reusable drag-and-drop hook for different patterns (grid, list, tag)
 *
 * @example Grid (photo upload)
 * ```ts
 * const { gesture, animatedStyle } = useDragAndDrop({
 *   type: 'grid',
 *   index: 0,
 *   totalItems: photos.length,
 *   onDragStart: () => setDragging(0),
 *   onDragEnd: (toIndex) => reorder(0, toIndex),
 *   onHoverChange: setHoverIndex,
 *   onHaptic: () => haptic.medium(),
 *   isDragging: draggingIndex === 0,
 *   gridSlotSize: 120,
 *   gridGap: 8,
 * });
 * ```
 *
 * @example List (vertical socials/prompts)
 * ```ts
 * const { gesture, animatedStyle } = useDragAndDrop({
 *   type: 'list',
 *   index: 0,
 *   totalItems: items.length,
 *   onDragStart: () => setDragging(0),
 *   onDragEnd: (toIndex) => reorder(0, toIndex),
 *   onHoverChange: setHoverIndex,
 *   onHaptic: () => haptic.medium(),
 *   isDragging: draggingIndex === 0,
 *   listItemHeight: 72,
 * });
 * ```
 *
 * @example Tag (flexible wrap interests/clubs)
 * ```ts
 * const { gesture, animatedStyle } = useDragAndDrop({
 *   type: 'tag',
 *   index: 0,
 *   totalItems: tags.length,
 *   onDragStart: () => setDragging(0),
 *   onDragEnd: (toIndex) => reorder(0, toIndex),
 *   onHoverChange: setHoverIndex,
 *   onHaptic: () => haptic.medium(),
 *   isDragging: draggingIndex === 0,
 *   tagHorizontalThreshold: 60,
 *   tagVerticalThreshold: 40,
 *   tagsPerRow: 3,
 * });
 * ```
 */
export function useDragAndDrop(config: DragConfig) {
  const {
    type,
    index,
    totalItems,
    onDragStart,
    onDragEnd,
    onHoverChange,
    onHaptic,
    isDragging,
    // Grid defaults
    gridSlotSize = 120,
    gridGap = 8,
    // List defaults
    listItemHeight = 72,
    // Tag defaults
    tagHorizontalThreshold = 60,
    tagVerticalThreshold = 40,
    tagsPerRow = 3,
  } = config;

  // Shared animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const lastTargetIndex = useSharedValue(index);

  // Calculate target index based on drag type
  const calculateTargetIndex = (translationX: number, translationY: number) => {
    'worklet';
    let offset = 0;

    switch (type) {
      case 'grid': {
        // 3-column grid calculation
        const col = Math.round(translationX / (gridSlotSize + gridGap));
        const row = Math.round(translationY / (gridSlotSize + gridGap));
        offset = row * 3 + col;
        break;
      }
      case 'list': {
        // Vertical list calculation (only Y axis)
        offset = Math.round(translationY / listItemHeight);
        break;
      }
      case 'tag': {
        // Flexible wrap tag calculation (estimate based on thresholds)
        const horizontalMove = Math.round(translationX / tagHorizontalThreshold);
        const verticalMove = Math.round(translationY / tagVerticalThreshold);
        offset = horizontalMove + verticalMove * tagsPerRow;
        break;
      }
    }

    return Math.max(0, Math.min(index + offset, totalItems - 1));
  };

  // Pan gesture handler
  const gesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStart)();
      if (type === 'grid' || type === 'tag') {
        scale.value = withSpring(1.1);
      }
      zIndex.value = 1000;
      lastTargetIndex.value = index;
    })
    .onUpdate((event) => {
      // Update translation based on type
      if (type === 'list') {
        translateY.value = event.translationY;
      } else {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }

      // Calculate target index
      const targetIndex = calculateTargetIndex(
        event.translationX,
        event.translationY
      );

      // Trigger haptic when crossing to new position
      if (targetIndex !== lastTargetIndex.value) {
        runOnJS(onHaptic)();
        lastTargetIndex.value = targetIndex;
      }

      runOnJS(onHoverChange)(targetIndex);
    })
    .onEnd((event) => {
      // Calculate final drop position
      const toIndex = calculateTargetIndex(event.translationX, event.translationY);

      runOnJS(onDragEnd)(toIndex);
      runOnJS(onHoverChange)(null);

      // Reset with spring animation
      if (type === 'list') {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      }
      zIndex.value = 0;
    });

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      zIndex: zIndex.value,
      opacity: isDragging ? 0.8 : 1,
      shadowColor: isDragging ? '#000' : 'transparent',
      shadowOffset: {
        width: 0,
        height: isDragging ? 4 : 0,
      },
      shadowOpacity: isDragging ? 0.3 : 0,
      shadowRadius: isDragging ? 4.65 : 0,
      elevation: isDragging ? 8 : 0,
    };

    // Add transforms based on type
    if (type === 'list') {
      baseStyle.transform = [{ translateY: translateY.value }];
    } else if (type === 'grid' || type === 'tag') {
      baseStyle.transform = [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ];
    }

    // Grid-specific styling
    if (type === 'grid') {
      baseStyle.width = gridSlotSize;
      baseStyle.height = gridSlotSize;
    }

    return baseStyle;
  });

  return {
    gesture,
    animatedStyle,
  };
}
