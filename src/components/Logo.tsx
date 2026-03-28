/**
 * KettleClock logo — a kettlebell with an analog clock face on its ball,
 * tilted at an angle for a dynamic look.
 */

interface Props {
  size?: number;
}

export function Logo({ size = 52 }: Props) {
  // Clock tick positions (12 marks around a circle of r=11)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const inner = i % 3 === 0 ? 8.5 : 9.5;
    const outer = 11;
    return {
      x1: 32 + inner * Math.cos(angle),
      y1: 50 + inner * Math.sin(angle),
      x2: 32 + outer * Math.cos(angle),
      y2: 50 + outer * Math.sin(angle),
      major: i % 3 === 0,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 68"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g transform="rotate(-15 32 44)">
        {/* Handle arch */}
        <path
          d="M 16,44 Q 16,12 32,12 Q 48,12 48,44"
          stroke="#e94560"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Ball */}
        <circle cx="32" cy="50" r="17" fill="#e94560" />
        {/* Clock face */}
        <circle cx="32" cy="50" r="12" fill="white" opacity="0.93" />
        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? '#c0392b' : '#e8a0a0'}
            strokeWidth={t.major ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        ))}
        {/* Hour hand — pointing toward ~10 o'clock */}
        <line
          x1="32" y1="50"
          x2="25.5" y2="43"
          stroke="#c0392b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Minute hand — pointing toward ~2 o'clock */}
        <line
          x1="32" y1="50"
          x2="37" y2="41"
          stroke="#c0392b"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx="32" cy="50" r="1.8" fill="#c0392b" />
      </g>
    </svg>
  );
}
