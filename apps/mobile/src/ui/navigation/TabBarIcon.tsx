import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabBarIconProps = {
  activeName: IconName;
  color: string;
  focused: boolean;
  inactiveName: IconName;
  size: number;
};

export function TabBarIcon({
  activeName,
  color,
  focused,
  inactiveName,
  size
}: TabBarIconProps) {
  return (
    <Ionicons
      aria-hidden
      accessibilityElementsHidden
      color={color}
      name={focused ? activeName : inactiveName}
      size={size}
    />
  );
}
