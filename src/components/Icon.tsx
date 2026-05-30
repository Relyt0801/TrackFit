// Icon.tsx — minimal stroke icon set rendered with react-native-svg (ports icons.jsx).
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme';

const P: Record<string, string> = {
  dumbbell: 'M6.5 6.5l11 11M3 9l3-3 3 3-3 3-3-3zm12 12l3-3 3 3-3 3-3-3zM7.5 16.5l9-9',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M4 12l5 5L20 6',
  x: 'M6 6l12 12M18 6L6 18',
  chevR: 'M9 5l7 7-7 7',
  chevL: 'M15 5l-7 7 7 7',
  chevD: 'M5 9l7 7 7-7',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  flame: 'M12 22c4 0 7-2.8 7-7 0-3-2-5-3-7-.5 1.5-1.5 2-2.5 2 .5-3-1-5.5-3.5-7 .5 3-1.5 4.5-2.5 6-.8 1.2-1.5 2.6-1.5 4.5C5.5 19.2 8 22 12 22z',
  timer: 'M12 22a8 8 0 100-16 8 8 0 000 16zM12 6V2M9 2h6M12 14V9',
  dots: 'M12 6h.01M12 12h.01M12 18h.01',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z',
  play: 'M7 4l13 8-13 8V4z',
  stop: 'M6 6h12v12H6z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  filter: 'M3 5h18l-7 8v5l-4 2v-7L3 5z',
  body: 'M12 6a2 2 0 100-4 2 2 0 000 4zM7 8h10M12 8v6m0 0l-3 8m3-8l3 8',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01',
  cal: 'M3 9h18M7 3v4M17 3v4M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
};

const FILLED: Record<string, boolean> = { play: true, stop: true, flame: true, bolt: true };

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  style?: StyleProp<ViewStyle>;
}

export function Icon({
  name,
  size = 22,
  color = COLORS.text,
  stroke = 2,
  style,
}: IconProps) {
  const d = P[name] || P.dots;
  const filled = FILLED[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        d={d}
        fill={filled ? color : 'none'}
        stroke={filled ? 'none' : color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
