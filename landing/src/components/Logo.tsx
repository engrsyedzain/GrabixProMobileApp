export default function Logo({size = 36}: {size?: number}) {
  return (
    <div
      className="grid place-items-center rounded-[28%] border border-blue/30 bg-gradient-to-br from-ink-600 to-ink-900 shadow-[inset_0_1px_0_rgba(124,190,255,0.25)]"
      style={{width: size, height: size}}
      aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        style={{width: size * 0.6, height: size * 0.6}}>
        <path
          d="M8 3v9m0 0-3.2-3.2M8 12l3.2-3.2"
          stroke="#45E0E6"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.5 19 12l-7 3.5"
          stroke="#22B6FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
