import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FilledCoffeeIconProps {
  size?: number;
  color?: string;
}

const FilledCoffeeIcon: React.FC<FilledCoffeeIconProps> = ({
  size = 24,
  color = 'white',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8H19C20.1046 8 21 8.89543 21 10V11C21 12.1046 20.1046 13 19 13H18M18 8V13M18 8H6C4.89543 8 4 8.89543 4 10V13C4 15.7614 6.23858 18 9 18H13C15.7614 18 18 15.7614 18 13M6 5V7M10 5V7M14 5V7M9 18V20H13V18"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default FilledCoffeeIcon;
