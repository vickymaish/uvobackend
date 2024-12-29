import * as React from 'react';
import {
  GaugeContainer,
  GaugeValueArc,
  GaugeReferenceArc,
  useGaugeState,
} from '@mui/x-charts/Gauge';

function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy } = useGaugeState();

  if (valueAngle === null) {
    // No value to display
    return null;
  }

  const target = {
    x: cx + outerRadius * Math.sin(valueAngle),
    y: cy - outerRadius * Math.cos(valueAngle),
  };
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="black" />
      <path
        d={`M ${cx} ${cy} L ${target.x} ${target.y}`}
        stroke="black"
        strokeWidth={3}
      />
    </g>
  );
}

export default function Gauge() {
  return (
    <GaugeContainer
      width={150}
      height={100}
      startAngle={-110}
      endAngle={110}
      value={80}
    >
      <GaugeReferenceArc />
      <GaugeValueArc />
      <GaugePointer />
    </GaugeContainer>
  );
}
