/**
 * KettleClock logo — a bold 3D kettlebell viewed from a slight angle,
 * with an analog clock face on its side.
 */

interface Props {
  size?: number;
}

export function Logo({ size = 52 }: Props) {
  // Clock tick positions (12 marks around an elliptical clock face)
  const cx = 50, cy = 62;
  const rx = 13, ry = 13;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const inner = i % 3 === 0 ? 0.72 : 0.82;
    return {
      x1: cx + rx * inner * Math.cos(angle),
      y1: cy + ry * inner * Math.sin(angle),
      x2: cx + rx * Math.cos(angle),
      y2: cy + ry * Math.sin(angle),
      major: i % 3 === 0,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* 3D ball gradient — highlight top-left, shadow bottom-right */}
        <radialGradient id="ballGrad" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ff6b7f" />
          <stop offset="50%" stopColor="#e94560" />
          <stop offset="100%" stopColor="#8b1a30" />
        </radialGradient>
        {/* Handle gradient */}
        <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c03050" />
          <stop offset="40%" stopColor="#e94560" />
          <stop offset="70%" stopColor="#ff6b7f" />
          <stop offset="100%" stopColor="#c03050" />
        </linearGradient>
        {/* Clock face gradient */}
        <radialGradient id="clockGrad" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </radialGradient>
        {/* Shadow beneath kettlebell */}
        <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="50" cy="92" rx="22" ry="5" fill="url(#shadowGrad)" />

      {/* Handle — thick arch with 3D shading */}
      <path
        d="M 30,55 Q 30,16 50,16 Q 70,16 70,55"
        stroke="url(#handleGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Handle highlight */}
      <path
        d="M 34,53 Q 34,22 50,22 Q 60,22 64,36"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ball base — slightly elliptical for 3D perspective */}
      <ellipse cx="50" cy="65" rx="25" ry="22" fill="url(#ballGrad)" />

      {/* 3D rim highlight on ball */}
      <ellipse
        cx="42"
        cy="56"
        rx="14"
        ry="8"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />

      {/* Clock face — ellipse for perspective */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#clockGrad)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#b0b0b0" strokeWidth="0.8" />

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.major ? '#c0392b' : '#cba0a0'}
          strokeWidth={t.major ? 1.8 : 0.9}
          strokeLinecap="round"
        />
      ))}

      {/* Hour hand — ~10 o'clock */}
      <line
        x1={cx} y1={cy}
        x2={cx - 6} y2={cy - 7}
        stroke="#c0392b"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Minute hand — ~2 o'clock */}
      <line
        x1={cx} y1={cy}
        x2={cx + 5} y2={cy - 9}
        stroke="#c0392b"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="1.5" fill="#c0392b" />
    </svg>
  );
}
