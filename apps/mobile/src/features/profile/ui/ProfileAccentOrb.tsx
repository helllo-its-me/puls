import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

type ProfileAccentOrbProps = {
  tone: 'mint' | 'sky' | 'lavender' | 'pink';
  size: number;
};

const toneMap = {
  mint: colors.mint,
  sky: colors.sky,
  lavender: colors.lavender,
  pink: colors.pink
};

export function ProfileAccentOrb({ tone, size }: ProfileAccentOrbProps) {
  return <View style={[styles.orb, { backgroundColor: toneMap[tone], width: size, height: size, borderRadius: size / 2 }]} />;
}

const styles = StyleSheet.create({
  orb: {
    opacity: 0.8
  }
});
