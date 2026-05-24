import React from 'react';

// Emotion color palettes
const PALETTES = {
  levelUp:       { bg: '#7c3aed', glow: '#a78bfa', accent: '#fbbf24', face: '#fde68a' },
  badgeEarned:   { bg: '#d97706', glow: '#fbbf24', accent: '#f59e0b', face: '#fde68a' },
  cleanCode:     { bg: '#059669', glow: '#34d399', accent: '#6ee7b7', face: '#fde68a' },
  bugFound:      { bg: '#ea580c', glow: '#fb923c', accent: '#fed7aa', face: '#fde68a' },
  criticalBug:   { bg: '#991b1b', glow: '#ef4444', accent: '#fca5a5', face: '#fde68a' },
  streak:        { bg: '#1d4ed8', glow: '#f97316', accent: '#fb923c', face: '#fde68a' },
  streakBroken:  { bg: '#374151', glow: '#6b7280', accent: '#9ca3af', face: '#fde68a' },
  welcomeBack:   { bg: '#0d9488', glow: '#2dd4bf', accent: '#99f6e4', face: '#fde68a' },
  analyzing:     { bg: '#4c1d95', glow: '#8b5cf6', accent: '#c4b5fd', face: '#fde68a' },
  securityAlert: { bg: '#1e3a5f', glow: '#f97316', accent: '#fed7aa', face: '#fde68a' },
  milestone:     { bg: '#7e22ce', glow: '#e879f9', accent: '#f0abfc', face: '#fde68a' },
  idle:          { bg: '#1e3a5f', glow: '#60a5fa', accent: '#bfdbfe', face: '#fde68a' },
};

// Eye shapes per emotion
const Eyes = ({ emotion }) => {
  const starry = (cx, cy) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="#1e1b4b" />
      <circle cx={cx} cy={cy} r="5" fill="#312e81" />
      <circle cx={cx - 1} cy={cy - 1} r="2" fill="white" opacity="0.9" />
      <circle cx={cx + 2} cy={cy + 2} r="1" fill="white" opacity="0.6" />
    </g>
  );
  const shocked = (cx, cy) => (
    <g>
      <circle cx={cx} cy={cy} r="9" fill="white" />
      <circle cx={cx} cy={cy} r="6" fill="#1e1b4b" />
      <circle cx={cx - 2} cy={cy - 2} r="2" fill="white" opacity="0.9" />
    </g>
  );
  const happy = (cx, cy) => (
    <g>
      <path d={`M${cx - 6},${cy} Q${cx},${cy - 8} ${cx + 6},${cy}`} fill="#1e1b4b" />
      <circle cx={cx - 1} cy={cy - 2} r="1.5" fill="white" opacity="0.7" />
    </g>
  );
  const sleepy = (cx, cy) => (
    <path d={`M${cx - 6},${cy} Q${cx},${cy + 5} ${cx + 6},${cy}`} fill="#1e1b4b" strokeWidth="1" />
  );
  const determined = (cx, cy) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="#1e1b4b" />
      <circle cx={cx} cy={cy} r="4" fill="#312e81" />
      <circle cx={cx - 1} cy={cy - 1} r="1.5" fill="white" opacity="0.9" />
      <path d={`M${cx - 8},${cy - 9} L${cx + 8},${cy - 6}`} stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
  const teary = (cx, cy) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="#1e1b4b" />
      <circle cx={cx} cy={cy} r="4" fill="#312e81" />
      <circle cx={cx - 1} cy={cy - 1} r="1.5" fill="white" opacity="0.9" />
      <ellipse cx={cx + 1} cy={cy + 10} rx="2" ry="3" fill="#60a5fa" opacity="0.8" />
    </g>
  );
  const monocle = (cx, cy, isRight) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="#1e1b4b" />
      <circle cx={cx} cy={cy} r="4" fill="#312e81" />
      <circle cx={cx - 1} cy={cy - 1} r="1.5" fill="white" opacity="0.9" />
      {isRight && <circle cx={cx} cy={cy} r="10" fill="none" stroke="#fbbf24" strokeWidth="2" />}
    </g>
  );

  const map = {
    levelUp:       [starry(68, 72), starry(108, 72)],
    badgeEarned:   [determined(68, 72), determined(108, 72)],
    cleanCode:     [happy(68, 72), happy(108, 72)],
    bugFound:      [shocked(68, 72), shocked(108, 72)],
    criticalBug:   [shocked(68, 72), shocked(108, 72)],
    streak:        [determined(68, 72), determined(108, 72)],
    streakBroken:  [teary(68, 72), teary(108, 72)],
    welcomeBack:   [starry(68, 72), starry(108, 72)],
    analyzing:     [monocle(68, 72, false), monocle(108, 72, true)],
    securityAlert: [determined(68, 72), determined(108, 72)],
    milestone:     [starry(68, 72), starry(108, 72)],
    idle:          [sleepy(68, 72), sleepy(108, 72)],
  };
  return <>{map[emotion] || map.levelUp}</>;
};

// Mouth shapes per emotion
const Mouth = ({ emotion }) => {
  const big = <path d="M72,98 Q88,114 104,98" stroke="#c2410c" strokeWidth="3" fill="#fca5a5" strokeLinecap="round" />;
  const scream = <ellipse cx="88" cy="102" rx="10" ry="12" fill="#c2410c" />;
  const smile = <path d="M76,98 Q88,110 100,98" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
  const frown = <path d="M76,104 Q88,94 100,104" stroke="#6b7280" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
  const smirk = <path d="M78,100 Q92,108 102,98" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
  const tiny = <path d="M82,100 Q88,106 94,100" stroke="#c2410c" strokeWidth="2" fill="none" strokeLinecap="round" />;

  const map = {
    levelUp: big, badgeEarned: smirk, cleanCode: big, bugFound: scream,
    criticalBug: scream, streak: smile, streakBroken: frown, welcomeBack: big,
    analyzing: tiny, securityAlert: smirk, milestone: big, idle: tiny,
  };
  return map[emotion] || smile;
};

// Accessories per emotion
const Accessory = ({ emotion, pal }) => {
  if (emotion === 'badgeEarned') return (
    <g>
      <circle cx="88" cy="148" r="14" fill={pal.accent} />
      <circle cx="88" cy="148" r="10" fill={pal.glow} />
      <text x="88" y="153" textAnchor="middle" fontSize="12" fill="#1e1b4b">★</text>
      <line x1="88" y1="134" x2="88" y2="128" stroke={pal.accent} strokeWidth="3" />
    </g>
  );
  if (emotion === 'analyzing') return (
    <g>
      <circle cx="120" cy="60" r="14" fill="none" stroke={pal.accent} strokeWidth="3" />
      <line x1="130" y1="70" x2="142" y2="82" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
  if (emotion === 'securityAlert') return (
    <g>
      <path d="M60,130 L88,118 L116,130 L116,152 Q88,168 60,152 Z" fill={pal.glow} opacity="0.8" />
      <text x="88" y="148" textAnchor="middle" fontSize="16" fill="#1e1b4b">🔒</text>
    </g>
  );
  if (emotion === 'cleanCode') return (
    <g>
      <polygon points="88,108 92,120 104,120 95,128 98,140 88,133 78,140 81,128 72,120 84,120" fill={pal.accent} />
    </g>
  );
  if (emotion === 'idle') return (
    <g>
      <text x="108" y="55" fontSize="14" fill={pal.accent} opacity="0.9">z</text>
      <text x="118" y="42" fontSize="11" fill={pal.accent} opacity="0.7">z</text>
      <text x="126" y="32" fontSize="8" fill={pal.accent} opacity="0.5">z</text>
    </g>
  );
  return null;
};

// Floating particles per emotion
const Particles = ({ emotion, pal }) => {
  const stars = [[20, 30], [148, 25], [15, 120], [155, 110], [88, 15]];
  const bugs = [[25, 40], [145, 35], [20, 130], [150, 125]];
  const hearts = [[30, 50], [140, 45]];
  const sparks = [[18, 60], [152, 55], [88, 12], [20, 140], [150, 140]];

  if (['levelUp', 'milestone', 'welcomeBack'].includes(emotion))
    return <>{stars.map(([x, y], i) => <text key={i} x={x} y={y} fontSize="12" fill={pal.accent} opacity="0.9">✦</text>)}</>;
  if (['bugFound', 'criticalBug'].includes(emotion))
    return <>{bugs.map(([x, y], i) => <text key={i} x={x} y={y} fontSize="11" fill={pal.accent} opacity="0.8">🐛</text>)}</>;
  if (emotion === 'streakBroken')
    return <>{hearts.map(([x, y], i) => <text key={i} x={x} y={y} fontSize="14" fill="#60a5fa" opacity="0.8">💔</text>)}</>;
  if (['streak', 'cleanCode', 'badgeEarned'].includes(emotion))
    return <>{sparks.map(([x, y], i) => <text key={i} x={x} y={y} fontSize="10" fill={pal.accent} opacity="0.8">✨</text>)}</>;
  if (emotion === 'analyzing')
    return <>{[[22, 35], [148, 30], [155, 120]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize="10" fill={pal.accent} opacity="0.7">⚙</text>)}</>;
  if (emotion === 'securityAlert')
    return <>{[[20, 40], [148, 38], [20, 130], [150, 128]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize="11" fill="#f97316" opacity="0.8">⚠</text>)}</>;
  return null;
};

const MascotAvatar = ({ emotion = 'levelUp', size = 176 }) => {
  const pal = PALETTES[emotion] || PALETTES.levelUp;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 176 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 18px ${pal.glow}88)` }}
    >
      {/* Background glow */}
      <circle cx="88" cy="88" r="80" fill={pal.bg} opacity="0.25" />
      <circle cx="88" cy="88" r="60" fill={pal.bg} opacity="0.15" />

      {/* Particles */}
      <Particles emotion={emotion} pal={pal} />

      {/* Body */}
      <ellipse cx="88" cy="148" rx="28" ry="20" fill={pal.glow} opacity="0.6" />
      <rect x="68" y="128" width="40" height="28" rx="12" fill={pal.glow} />

      {/* Arms */}
      {['levelUp', 'cleanCode', 'welcomeBack', 'milestone'].includes(emotion) ? (
        <>
          <path d="M68,132 Q48,118 44,108" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M108,132 Q128,118 132,108" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
        </>
      ) : emotion === 'bugFound' || emotion === 'criticalBug' ? (
        <>
          <path d="M68,132 Q52,122 48,116" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M108,132 Q124,122 128,116" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
          {/* Hands on cheeks */}
          <circle cx="52" cy="112" r="8" fill={pal.face} stroke="white" strokeWidth="2" />
          <circle cx="124" cy="112" r="8" fill={pal.face} stroke="white" strokeWidth="2" />
        </>
      ) : emotion === 'streak' ? (
        <>
          <path d="M68,132 Q56,120 52,110" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M108,128 Q120,112 122,100" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M68,136 Q54,130 50,124" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M108,136 Q122,130 126,124" stroke={pal.glow} strokeWidth="10" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Head */}
      <ellipse cx="88" cy="76" rx="38" ry="36" fill={pal.face} />
      {/* White outline */}
      <ellipse cx="88" cy="76" rx="38" ry="36" fill="none" stroke="white" strokeWidth="3" />

      {/* Cheek blush */}
      <ellipse cx="62" cy="88" rx="8" ry="5" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="114" cy="88" rx="8" ry="5" fill="#fca5a5" opacity="0.5" />

      {/* Eyes */}
      <Eyes emotion={emotion} />

      {/* Mouth */}
      <Mouth emotion={emotion} />

      {/* Sweat drop for critical/bug */}
      {(emotion === 'criticalBug') && (
        <ellipse cx="118" cy="58" rx="5" ry="7" fill="#60a5fa" opacity="0.8" />
      )}

      {/* Accessory */}
      <Accessory emotion={emotion} pal={pal} />

      {/* Ears */}
      <ellipse cx="50" cy="68" rx="8" ry="10" fill={pal.face} stroke="white" strokeWidth="2" />
      <ellipse cx="126" cy="68" rx="8" ry="10" fill={pal.face} stroke="white" strokeWidth="2" />
    </svg>
  );
};

export default MascotAvatar;
