import { Check } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '../AppColors';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  color?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onValueChange,
  color = AppColors.accentDefault,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => onValueChange(!value)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.checkbox,
          value && { backgroundColor: color, borderColor: color },
        ]}
        activeOpacity={1}
      >
        {value && <Check size={16} color={AppColors.backgroundDefault} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.foregroundDimmer,
    backgroundColor: AppColors.backgroundDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Checkbox;
