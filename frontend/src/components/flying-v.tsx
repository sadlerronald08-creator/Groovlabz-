import React from "react";
import { StyleSheet } from "react-native";
import Svg, {
  Polygon,
  Line,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
} from "react-native-svg";

export type GuitarGeo = ReturnType<typeof guitarGeo>;

export function guitarGeo(W: number, H: number) {
  const cx = W / 2;
  const hsTopY = 16;
  const neckTop = Math.max(150, H * 0.19);
  const bodyTop = H * 0.585;
  const bottom = H - 6;

  const neckHalfTop = W * 0.1;
  const neckHalfBottom = W * 0.155;

  const shoulderHalf = Math.min(W * 0.44, cx - 4);
  const shoulderY = bodyTop + (bottom - bodyTop) * 0.06;
  const wingHalf = W * 0.3;
  const wingTipY = bottom;
  const notchY = bottom - (bottom - bodyTop) * 0.52;
  const bridgeY = bodyTop + (bottom - bodyTop) * 0.32;
  const hsHalf = neckHalfTop * 1.7;

  const pad = 10;
  const regionTop = neckTop + pad;
  const regionBot = bodyTop - pad;
  const step = (regionBot - regionTop) / 5;
  const btnH = Math.max(46, Math.min(58, step - 8));
  const slots = Array.from({ length: 5 }, (_, i) => {
    const cy = regionTop + step * (i + 0.5);
    return { cy, top: cy - btnH / 2 };
  });
  const btnW = Math.min(W - 44, 300);

  const jamW = Math.min(W * 0.66, 264);
  const jamH = 92;
  const jamTop = hsTopY + 30;

  return {
    W, H, cx, hsTopY, neckTop, bodyTop, bottom, neckHalfTop, neckHalfBottom,
    shoulderHalf, shoulderY, wingHalf, wingTipY, notchY, bridgeY, hsHalf,
    regionTop, step, btnH, slots, btnW, jamW, jamH, jamTop,
  };
}

export function FlyingVGuitar({ geo }: { geo: GuitarGeo }) {
  const g = geo;
  if (g.W <= 0) return null;
  const { cx } = g;

  const bodyPts = [
    [cx - g.neckHalfBottom, g.bodyTop],
    [cx - g.shoulderHalf, g.shoulderY],
    [cx - g.wingHalf, g.wingTipY],
    [cx, g.notchY],
    [cx + g.wingHalf, g.wingTipY],
    [cx + g.shoulderHalf, g.shoulderY],
    [cx + g.neckHalfBottom, g.bodyTop],
  ].map((p) => p.join(",")).join(" ");

  const neckPts = [
    [cx - g.neckHalfTop, g.neckTop],
    [cx + g.neckHalfTop, g.neckTop],
    [cx + g.neckHalfBottom, g.bodyTop],
    [cx - g.neckHalfBottom, g.bodyTop],
  ].map((p) => p.join(",")).join(" ");

  const hsPts = [
    [cx - g.neckHalfTop, g.neckTop],
    [cx - g.hsHalf, g.neckTop - 18],
    [cx - g.hsHalf, g.hsTopY + 22],
    [cx, g.hsTopY],
    [cx + g.hsHalf, g.hsTopY + 22],
    [cx + g.hsHalf, g.neckTop - 18],
    [cx + g.neckHalfTop, g.neckTop],
  ].map((p) => p.join(",")).join(" ");

  const strings = Array.from({ length: 6 }, (_, i) => {
    const frac = (i - 2.5) / 2.5;
    const xTop = cx + frac * g.neckHalfTop * 0.72;
    const xBot = cx + frac * g.neckHalfBottom * 0.92;
    return { xTop, xBot, w: 0.6 + Math.abs(i - 2.5) * 0.22 };
  });

  const fretLines = Array.from({ length: 6 }, (_, i) => g.regionTop + g.step * i);
  const widthAt = (y: number) => {
    const t = (y - g.neckTop) / (g.bodyTop - g.neckTop);
    return g.neckHalfTop + (g.neckHalfBottom - g.neckHalfTop) * t;
  };

  return (
    <Svg width={g.W} height={g.H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGradient id="bodyG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EC4899" />
          <Stop offset="0.45" stopColor="#7C3AED" />
          <Stop offset="1" stopColor="#0891B2" />
        </SvgGradient>
        <RadialGradient id="bodyHi" cx="42%" cy="30%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <Stop offset="0.5" stopColor="#22D3EE" stopOpacity="0.06" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </RadialGradient>
        <SvgGradient id="neckG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#241436" />
          <Stop offset="1" stopColor="#0F0A1E" />
        </SvgGradient>
        <SvgGradient id="hsG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#312152" />
          <Stop offset="1" stopColor="#160C2A" />
        </SvgGradient>
      </Defs>

      {/* ---- BODY ---- */}
      <Polygon points={bodyPts} fill="none" stroke="#34D399" strokeWidth={11} opacity={0.22} strokeLinejoin="round" />
      <Polygon points={bodyPts} fill="url(#bodyG)" stroke="#22D3EE" strokeWidth={3} strokeLinejoin="round" />
      <Polygon points={bodyPts} fill="url(#bodyHi)" strokeLinejoin="round" />

      {/* pickups + bridge + knobs on body */}
      <Rect x={cx - g.neckHalfBottom * 0.95} y={g.bridgeY - 52} width={g.neckHalfBottom * 1.9} height={13} rx={4} fill="#0D0D12" opacity={0.85} />
      <Rect x={cx - g.neckHalfBottom * 0.95} y={g.bridgeY - 30} width={g.neckHalfBottom * 1.9} height={13} rx={4} fill="#0D0D12" opacity={0.85} />
      <Rect x={cx - g.neckHalfBottom * 0.7} y={g.bridgeY} width={g.neckHalfBottom * 1.4} height={9} rx={2} fill="#E2E8F0" opacity={0.55} />
      <Circle cx={cx + g.neckHalfBottom * 0.2} cy={g.bridgeY + 46} r={9} fill="#0D0D12" stroke="#22D3EE" strokeWidth={1.5} opacity={0.9} />
      <Circle cx={cx + g.neckHalfBottom * 0.85} cy={g.bridgeY + 64} r={9} fill="#0D0D12" stroke="#D946EF" strokeWidth={1.5} opacity={0.9} />
      {/* infinity inlay on lower body */}
      <Circle cx={cx - 8} cy={g.notchY - 26} r={7} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} />
      <Circle cx={cx + 8} cy={g.notchY - 26} r={7} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} />

      {/* ---- NECK ---- */}
      <Polygon points={neckPts} fill="url(#neckG)" stroke="#8B5CF6" strokeWidth={1.5} />
      {fretLines.map((y, i) => {
        const w = widthAt(y);
        return <Line key={`fl${i}`} x1={cx - w} y1={y} x2={cx + w} y2={y} stroke="#C4B5FD" strokeWidth={2} opacity={0.4} />;
      })}
      {/* strings across neck onto body */}
      {strings.map((s, i) => (
        <Line key={`st${i}`} x1={s.xTop} y1={g.hsTopY + 30} x2={s.xBot} y2={g.bridgeY} stroke="#A5F3FC" strokeWidth={s.w} opacity={0.35} />
      ))}

      {/* ---- HEADSTOCK ---- */}
      <Polygon points={hsPts} fill="url(#hsG)" stroke="#22D3EE" strokeWidth={2} strokeLinejoin="round" />
      {[0, 1, 2].map((k) => (
        <React.Fragment key={`peg${k}`}>
          <Circle cx={cx - g.hsHalf + 7} cy={g.hsTopY + 34 + k * 22} r={4.5} fill="#E2E8F0" />
          <Circle cx={cx + g.hsHalf - 7} cy={g.hsTopY + 34 + k * 22} r={4.5} fill="#E2E8F0" />
        </React.Fragment>
      ))}
    </Svg>
  );
}
