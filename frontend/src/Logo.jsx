export default function Logo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="MedRemind logo">
      <rect width="64" height="64" rx="16" fill="#0F766E" />
      <path
        d="M32 49C20 40 13 33 13 25C13 19 17.5 15 23 15C27 15 30 17 32 20C34 17 37 15 41 15C46.5 15 51 19 51 25C51 33 44 40 32 49Z"
        fill="#fff"
      />
      <polyline
        points="24,28 30,34 40,22"
        fill="none"
        stroke="#0F766E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
