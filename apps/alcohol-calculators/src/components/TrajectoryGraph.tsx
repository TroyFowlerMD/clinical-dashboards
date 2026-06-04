import { BAL_PROFILES } from "../calculators/balTrajectory";
import type { EliminationRates } from "../types";

interface TrajectoryGraphProps {
  startingMgDl: number;
  rates: EliminationRates;
}

const colors = {
  slow: "#8b5cf6",
  typical: "#1f7a7a",
  fast: "#d97706"
};

export default function TrajectoryGraph({ startingMgDl, rates }: TrajectoryGraphProps) {
  const width = 360;
  const height = 220;
  const padLeft = 42;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 34;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const maxHours = Math.max(1, startingMgDl / rates.slow);
  const yMax = Math.max(50, Math.ceil(startingMgDl / 50) * 50);

  function x(hours: number) {
    return padLeft + (hours / maxHours) * chartWidth;
  }

  function y(bal: number) {
    return padTop + (1 - bal / yMax) * chartHeight;
  }

  function linePath(rate: number) {
    const steps = 24;
    return Array.from({ length: steps + 1 }, (_, index) => {
      const hours = (maxHours * index) / steps;
      const bal = Math.max(0, startingMgDl - rate * hours);
      return `${index === 0 ? "M" : "L"} ${x(hours).toFixed(1)} ${y(bal).toFixed(1)}`;
    }).join(" ");
  }

  const references = [300, 250, 200, 150, 100, 50, 0].filter((value) => value <= yMax);
  const ticks = [0, maxHours / 2, maxHours];

  return (
    <figure className="graph-panel">
      <figcaption>BAL trajectory, hours since lab draw</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="trajectory-title">
        <title id="trajectory-title">Estimated BAL decline graph</title>
        <rect x="0" y="0" width={width} height={height} rx="8" fill="#ffffff" />
        {references.map((reference) => (
          <g key={reference}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={y(reference)}
              y2={y(reference)}
              stroke="#d7dee5"
              strokeDasharray={reference === 0 ? "0" : "4 4"}
            />
            <text x="8" y={y(reference) + 4} fontSize="10" fill="#536170">
              {reference}
            </text>
          </g>
        ))}
        {ticks.map((tick) => (
          <g key={tick.toFixed(2)}>
            <line x1={x(tick)} x2={x(tick)} y1={padTop} y2={padTop + chartHeight} stroke="#eef2f5" />
            <text x={x(tick)} y={height - 12} textAnchor="middle" fontSize="10" fill="#536170">
              {tick.toFixed(1)}h
            </text>
          </g>
        ))}
        {BAL_PROFILES.map((profile) => (
          <path
            key={profile}
            d={linePath(rates[profile])}
            fill="none"
            stroke={colors[profile]}
            strokeWidth={profile === "typical" ? 4 : 2.5}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="legend">
        {BAL_PROFILES.map((profile) => (
          <span key={profile}>
            <i style={{ background: colors[profile] }} />
            {profile}
          </span>
        ))}
      </div>
    </figure>
  );
}
