// SessionHeaderTitle.tsx — large screen title with optional subtitle.
import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../theme';
import { AppText } from './Text';

export function SessionHeaderTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <AppText style={{ fontSize: 27, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>
        {title}
      </AppText>
      {sub ? (
        <AppText style={{ fontSize: 13.5, color: COLORS.muted, fontWeight: '600', marginTop: 2 }}>{sub}</AppText>
      ) : null}
    </View>
  );
}
