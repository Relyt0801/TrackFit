// charts.tsx — inline SVG line chart with gradient area + smooth (Catmull-Rom) curve.
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { COLORS } from '../theme';
import { fmtDateShort } from '../data/helpers';
import { SeriesPoint } from '../types';
import { AppText } from './Text';

interface Pt {
  x: number;
  y: number;
  v: number;
  date: string;
}

function catmullRom(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return pts.length ? `M${pts[0].x} ${pts[0].y}` : '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({
  points,
  color,
  unit = '',
  height = 200,
}: {
  points: SeriesPoint[];
  color: string;
  unit?: string;
  height?: number;
}) {
  const W = 340;
  const H = height;
  const padL = 38;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const gid = useMemo(() => 'g' + Math.random().toString(36).slice(2, 7), []);

  if (!points || points.length === 0) {
    return (
      <View style={{ height: H, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ color: COLORS.muted, fontSize: 13 }}>Keine Daten</AppText>
      </View>
    );
  }

  const vals = points.map((p) => p.value);
  let yMin = Math.min(...vals);
  let yMax = Math.max(...vals);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const range = yMax - yMin;
  yMin = Math.max(0, yMin - range * 0.18);
  yMax = yMax + range * 0.18;

  const times = points.map((p) => new Date(p.date).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const x = (t: number) =>
    padL + (tMax === tMin ? 0.5 : (t - tMin) / (tMax - tMin)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);

  const pts: Pt[] = points.map((p) => ({
    x: x(new Date(p.date).getTime()),
    y: y(p.value),
    v: p.value,
    date: p.date,
  }));
  const line = catmullRom(pts);
  const area = `${line} L${pts[pts.length - 1].x} ${H - padB} L${pts[0].x} ${H - padB} Z`;
  const yticks = 4;
  const last = pts[pts.length - 1];

  const xLabelIdx = [0, Math.floor((pts.length - 1) / 2), pts.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {unit ? (
        <SvgText x={2} y={11} fontSize={9} fontWeight="700" fill={COLORS.muted}>
          {unit}
        </SvgText>
      ) : null}

      {Array.from({ length: yticks + 1 }).map((_, i) => {
        const v = yMin + (yMax - yMin) * (i / yticks);
        const yy = y(v);
        return (
          <G key={i}>
            <Line
              x1={padL}
              y1={yy}
              x2={W - padR}
              y2={yy}
              stroke={COLORS.border}
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <SvgText x={padL - 6} y={yy + 3.5} textAnchor="end" fontSize={9} fill={COLORS.muted} fontWeight="600">
              {Math.round(v)}
            </SvgText>
          </G>
        );
      })}

      {xLabelIdx.map((idx, i, arr) => (
        <SvgText
          key={idx}
          x={pts[idx].x}
          y={H - 8}
          textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
          fontSize={9}
          fill={COLORS.muted}
          fontWeight="600"
        >
          {fmtDateShort(pts[idx].date)}
        </SvgText>
      ))}

      <Path d={area} fill={`url(#${gid})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {pts.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 4 : 2.6}
          fill={i === pts.length - 1 ? color : COLORS.surface}
          stroke={color}
          strokeWidth={2}
        />
      ))}

      {(() => {
        const lbl = `${last.v}${unit ? ' ' + unit : ''}`;
        const bw = Math.max(46, lbl.length * 6.4 + 14);
        return (
          <G x={Math.min(last.x, W - padR - bw + 2)} y={Math.max(last.y - 14, padT + 6)}>
            <Rect x={-2} y={-12} width={bw} height={17} rx={5} fill={color} />
            <SvgText x={-2 + bw / 2} y={0} textAnchor="middle" fontSize={10.5} fontWeight="800" fill={COLORS.accentInk}>
              {lbl}
            </SvgText>
          </G>
        );
      })()}
    </Svg>
  );
}

export function Sparkline({
  points,
  color,
  width = 90,
  height = 30,
}: {
  points: SeriesPoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!points || points.length < 2) return <Svg width={width} height={height} />;
  const vals = points.map((p) => p.value);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const r = mx - mn || 1;
  const pts = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - 3 - ((p.value - mn) / r) * (height - 6),
  }));
  return (
    <Svg width={width} height={height}>
      <Path d={catmullRom(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2.5} fill={color} />
    </Svg>
  );
}
