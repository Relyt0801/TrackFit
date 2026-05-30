// Text.tsx — Text / TextInput wrappers that map a CSS-style fontWeight to the matching
// loaded Manrope variant. RN custom fonts need an explicit fontFamily per weight.
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { COLORS, fontFor } from '../theme';

function resolveFamily(style: TextStyle | undefined): TextStyle {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  // An explicit fontFamily in the style (e.g. monospace readouts) always wins.
  if (flat.fontFamily) return {};
  return { fontFamily: fontFor(flat.fontWeight as number | string | undefined) };
}

export function AppText({ style, ...props }: TextProps) {
  return (
    <Text
      {...props}
      style={[{ color: COLORS.text }, resolveFamily(style as TextStyle), style]}
    />
  );
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      style={[{ color: COLORS.text }, resolveFamily(style as TextStyle), style]}
    />
  );
}
