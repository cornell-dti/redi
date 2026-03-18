import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FilledHomeIconProps {
  size?: number;
  color?: string;
}

const FilledHomeIcon: React.FC<FilledHomeIconProps> = ({ size = 24, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default FilledHomeIcon;
