interface TrophyVaultIconProps {
  className?: string;
  size?: number;
}

export default function TrophyVaultIcon({ className, size = 32 }: TrophyVaultIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M32 38c0 0-2-4-2-10c0-4 1-8 2-12c1 4 2 8 2 12c0 6-2 10-2 10z" />
      <path d="M30 28c-1-3-3-6-5-8c-2-2-4-4-4-7c0-2 1-4 2-5c-1 3 0 5 2 7c2 2 4 5 5 8z" />
      <path d="M34 28c1-3 3-6 5-8c2-2 4-4 4-7c0-2-1-4-2-5c1 3 0 5-2 7c-2 2-4 5-5 8z" />
      <path d="M28 24c-2-2-5-3-8-3c-2 0-4 0-6 1c2-2 4-2 6-2c3 0 6 1 8 4z" />
      <path d="M36 24c2-2 5-3 8-3c2 0 4 0 6 1c-2-2-4-2-6-2c-3 0-6 1-8 4z" />
      <path d="M26 20c-1-2-3-4-6-5c-2-1-4-1-6 0c2-2 4-2 6-1c3 1 5 3 6 6z" />
      <path d="M38 20c1-2 3-4 6-5c2-1 4-1 6 0c-2-2-4-2-6-1c-3 1-5 3-6 6z" />
      <path d="M10 42c0 0 8-2 22-2c14 0 22 2 22 2v2H10v-2z" />
      <path d="M8 44c-3 2-6 6-7 12c2-4 5-8 9-10z" />
      <path d="M56 44c3 2 6 6 7 12c-2-4-5-8-9-10z" />
    </svg>
  );
}
