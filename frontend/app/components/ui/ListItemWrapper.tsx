import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ListItemWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Helper component to wrap children and apply border radius to first/last child
const getChildWithRadius = (
  child: React.ReactNode,
  index: number,
  total: number
) => {
  // Only apply style to React elements
  if (React.isValidElement(child)) {
    let borderRadiusStyle = {};
    if (index === 0) {
      borderRadiusStyle = { borderTopLeftRadius: 24, borderTopRightRadius: 24 };
    }
    if (index === total - 1) {
      borderRadiusStyle = {
        ...borderRadiusStyle,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      };
    }
    return React.cloneElement(
      child as React.ReactElement<{ style?: StyleProp<ViewStyle> }>,
      {
        style: [
          (child.props as { style?: StyleProp<ViewStyle> }).style,
          borderRadiusStyle,
        ],
      }
    );
  }
  return child;
};

export default function ListItemWrapper({
  children,
  style,
}: ListItemWrapperProps) {
  const childrenArray = React.Children.toArray(children);
  return (
    <View style={[styles.container, style]}>
      {childrenArray.map((child, idx) =>
        getChildWithRadius(child, idx, childrenArray.length)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
});
