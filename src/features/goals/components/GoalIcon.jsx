export default function GoalIcon({ name, className = "" }) {
  const paths = {
    down: <><path d="M12 4v15m0 0-5-5m5 5 5-5" /><path d="M5 5h14" /></>,
    balance: <><path d="M12 4v16M5 7h14M7 7l-3 6h6L7 7Zm10 0-3 6h6l-3-6ZM8 20h8" /></>,
    up: <><path d="M12 20V5m0 0-5 5m5-5 5 5" /><path d="M5 19h14" /></>,
    strength: <><path d="M7 8v8M4 10v4m13-6v8m3-6v4M7 12h10" /></>,
    pulse: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 9h16" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    edit: <><path d="m14 5 5 5L9 20H4v-5L14 5Z" /><path d="m12 7 5 5" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    flag: <><path d="M6 21V4m0 1h11l-2 4 2 4H6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    spark: <><path d="M12 3c.4 4.3 2.7 6.6 7 7-4.3.4-6.6 2.7-7 7-.4-4.3-2.7-6.6-7-7 4.3-.4 6.6-2.7 7-7Z" /><path d="M19 16c.2 2 1.3 3.1 3 3.3-1.7.2-2.8 1.3-3 3.2-.2-1.9-1.3-3-3-3.2 1.7-.2 2.8-1.3 3-3.3Z" /></>,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.pulse}
    </svg>
  );
}
