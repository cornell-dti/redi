import { Gender } from '@/types';
import { Mars, NonBinary, Venus } from 'lucide-react-native';
import React from 'react';

interface GenderIconProps {
  gender: Gender;
  size?: number;
  color?: string;
}

/**
 * GenderIcon component that displays the appropriate gender symbol
 * - Female: Venus ♀
 * - Male: Mars ♂
 * - Non-binary: NonBinary ⚧
 */
const GenderIcon: React.FC<GenderIconProps> = ({
  gender,
  size = 24,
  color = '#000000',
}) => {
  switch (gender.toLowerCase()) {
    case 'female':
      return <Venus size={size} color={color} />;
    case 'male':
      return <Mars size={size} color={color} />;
    case 'non-binary':
      return <NonBinary size={size} color={color} />;
    default:
      return <NonBinary size={size} color={color} />;
  }
};

export default GenderIcon;
