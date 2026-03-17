import { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '@/theme/tokens';

type AppTextVariant = 'body' | 'title';

type AppTextProps = PropsWithChildren<{
  variant?: AppTextVariant;
}>;

export function AppText({ children, variant = 'body' }: AppTextProps) {
  const style = variant === 'title' ? styles.title : styles.body;

  return <Text style={style}>{children}</Text>;
}

const styles = StyleSheet.create({
  body: {
    fontSize: typography.body,
    color: colors.textSecondary
  },
  title: {
    fontSize: typography.title,
    color: colors.textPrimary,
    fontWeight: '700'
  }
});
