import { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '@/theme/tokens';

type AppTextVariant =
  | 'body'
  | 'caption'
  | 'muted'
  | 'sectionTitle'
  | 'title'
  | 'hero'
  | 'button';

type AppTextProps = PropsWithChildren<{
  variant?: AppTextVariant;
}>;

export function AppText({ children, variant = 'body' }: AppTextProps) {
  const style = styles[variant];

  return <Text style={style}>{children}</Text>;
}

const styles = StyleSheet.create({
  body: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.textPrimary
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textTertiary
  },
  muted: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.textSecondary
  },
  sectionTitle: {
    fontSize: typography.sectionTitle,
    lineHeight: 28,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  title: {
    fontSize: typography.title,
    lineHeight: 40,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  hero: {
    fontSize: typography.hero,
    lineHeight: 52,
    color: colors.textPrimary,
    fontWeight: '800'
  },
  button: {
    fontSize: typography.button,
    lineHeight: 24,
    color: colors.surface,
    fontWeight: '700'
  }
});
