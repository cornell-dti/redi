import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FilledChatIconProps {
  size?: number;
  color?: string;
}

const FilledChatIcon: React.FC<FilledChatIconProps> = ({
  size = 24,
  color = 'white',
}) => (
  <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <Path
      d="M1.99169 15.3417C2.13873 15.7126 2.17147 16.119 2.08569 16.5087L1.02069 19.7987C0.986375 19.9655 0.995248 20.1384 1.04647 20.3008C1.09769 20.4633 1.18955 20.61 1.31336 20.727C1.43716 20.844 1.5888 20.9274 1.75389 20.9693C1.91898 21.0113 2.09205 21.0104 2.25669 20.9667L5.66969 19.9687C6.03741 19.8958 6.41822 19.9276 6.76869 20.0607C8.90408 21.0579 11.3231 21.2689 13.5988 20.6564C15.8746 20.0439 17.861 18.6473 19.2074 16.7131C20.5538 14.7788 21.1738 12.4311 20.958 10.0842C20.7422 7.73738 19.7044 5.54216 18.0278 3.88589C16.3511 2.22962 14.1434 1.21873 11.7941 1.03159C9.44475 0.844449 7.10483 1.49308 5.18713 2.86303C3.26944 4.23299 1.89722 6.23624 1.31258 8.51933C0.727946 10.8024 0.96846 13.2186 1.99169 15.3417Z"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default FilledChatIcon;
