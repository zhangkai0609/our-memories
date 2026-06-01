const paths = {
  home: {
    viewBox: '0 0 24 24',
    outline: <path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4.2v-6.2H9.2V21H5a1 1 0 0 1-1-1v-8.8Z" />,
    filled: <path d="M3.8 10.9 12 3.7l8.2 7.2V20a1.2 1.2 0 0 1-1.2 1.2h-4.4v-6.3H9.4v6.3H5A1.2 1.2 0 0 1 3.8 20v-9.1Z" />,
  },
  memory: {
    viewBox: '0 0 24 24',
    outline: <path d="M7 4.5h9.6A2.4 2.4 0 0 1 19 6.9v12.6H7A2 2 0 0 1 5 17.5v-11a2 2 0 0 1 2-2Zm0 0v15M8.7 8h6.6" />,
    filled: <path d="M7 4.2h9.8a2.2 2.2 0 0 1 2.2 2.2v13H7.2A2.2 2.2 0 0 1 5 17.2V6.2a2 2 0 0 1 2-2Zm2.3 4.2h6.1" />,
  },
  map: {
    viewBox: '0 0 24 24',
    outline: <><path d="M12 3.8a5.4 5.4 0 0 0-5.4 5.4c0 4.2 5.4 10.2 5.4 10.2s5.4-6 5.4-10.2A5.4 5.4 0 0 0 12 3.8Z" /><path d="M12 11.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6.1 18.4 4 20.2h16l-2.1-1.8" /></>,
    filled: <><path d="M12 3.4a5.7 5.7 0 0 0-5.7 5.7c0 4.5 5.7 10.8 5.7 10.8s5.7-6.3 5.7-10.8A5.7 5.7 0 0 0 12 3.4Zm0 7.6a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z" /><path d="M6 18.5 4 20.3h16l-2-1.8" /></>,
  },
  heart: {
    viewBox: '0 0 24 24',
    outline: <path d="M12 20.2S4.6 15.8 4.6 9.4A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7.4 2.4c0 6.4-7.4 10.8-7.4 10.8Z" />,
    filled: <path d="M12 20.4S4.4 15.8 4.4 9.3A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.6 2.3c0 6.5-7.6 11.1-7.6 11.1Z" />,
  },
  calendar: {
    viewBox: '0 0 24 24',
    outline: <><path d="M6 5.5h12a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2ZM4 10h16M8 3.5v4M16 3.5v4" /><path d="M8 14h.1M12 14h.1M16 14h.1M8 17h.1M12 17h.1M16 17h.1" /></>,
  },
  photo: {
    viewBox: '0 0 24 24',
    outline: <><rect x="4" y="5" width="16" height="14" rx="2.2" /><path d="m6.7 16.6 4.2-4 3 2.9 1.7-1.7 2.8 2.8M8.5 9.2h.1" /></>,
  },
  footprints: {
    viewBox: '0 0 24 24',
    outline: <><path d="M8.3 11.4c-1 .3-2.2-.6-2.6-2.1-.5-1.6.1-3 1.2-3.4 1-.3 2.2.6 2.6 2.1.5 1.6 0 3-1.2 3.4ZM15.7 11.4c1 .3 2.2-.6 2.6-2.1.5-1.6-.1-3-1.2-3.4-1-.3-2.2.6-2.6 2.1-.5 1.6 0 3 1.2 3.4ZM7.8 14c-1.4.9-2 2.8-1.3 4 .6 1 2 1.2 3.2.4 1.4-.9 2-2.8 1.3-4-.6-1-2-1.2-3.2-.4ZM16.2 14c1.4.9 2 2.8 1.3 4-.6 1-2 1.2-3.2.4-1.4-.9-2-2.8-1.3-4 .6-1 2-1.2 3.2-.4Z" /></>,
  },
  bookmark: { viewBox: '0 0 24 24', outline: <path d="M7 4.5h10a1 1 0 0 1 1 1v15l-6-4.1-6 4.1v-15a1 1 0 0 1 1-1Z" /> },
  back: { viewBox: '0 0 24 24', outline: <path d="M15.5 5.5 9 12l6.5 6.5M9.6 12H20" /> },
  right: { viewBox: '0 0 24 24', outline: <path d="m8.5 5.5 6.5 6.5-6.5 6.5" /> },
  plus: { viewBox: '0 0 24 24', outline: <path d="M12 5v14M5 12h14" /> },
  close: { viewBox: '0 0 24 24', outline: <path d="m7 7 10 10M17 7 7 17" /> },
  more: { viewBox: '0 0 24 24', outline: <path d="M5.5 12h.1M12 12h.1M18.5 12h.1" /> },
  menu: { viewBox: '0 0 24 24', outline: <path d="M5 7h14M5 12h14M5 17h14" /> },
  bell: { viewBox: '0 0 24 24', outline: <path d="M7 10a5 5 0 0 1 10 0v4.5l1.7 2H5.3l1.7-2V10ZM10 19.3a2.1 2.1 0 0 0 4 0" /> },
  sparkle: { viewBox: '0 0 24 24', outline: <path d="M12 3.8 14.2 9l5.2 2.2-5.2 2.2-2.2 5.2-2.2-5.2-5.2-2.2L9.8 9 12 3.8ZM18.5 4.5v3M17 6h3M5.5 16.5v3M4 18h3" /> },
  mic: { viewBox: '0 0 24 24', outline: <><path d="M12 4a2.8 2.8 0 0 0-2.8 2.8v5.1a2.8 2.8 0 1 0 5.6 0V6.8A2.8 2.8 0 0 0 12 4Z" /><path d="M6.8 11.2a5.2 5.2 0 0 0 10.4 0M12 16.4V20M9.2 20h5.6" /></> },
}

export default function AppIcon({ name, size = 24, active = false, color = 'currentColor', strokeWidth = 1.9, style }) {
  const icon = paths[name] || paths.heart
  const canFill = Boolean(icon.filled)
  return (
    <svg
      viewBox={icon.viewBox}
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block', ...style }}
      fill={active && canFill ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {active && canFill ? icon.filled : icon.outline}
    </svg>
  )
}
