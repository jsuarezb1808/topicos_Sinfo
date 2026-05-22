type LogoProps = {
  variant?: 'horizontal' | 'icon';
  className?: string;
  height?: number;
  title?: string;
};

export function ConvocaLogo({
  variant = 'horizontal',
  className,
  height = 36,
  title = 'Convoca',
}: LogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
        className={className}
        style={{ height, width: height }}
      >
        <title>{title}</title>
        <path
          d="M 72.5 27.4 A 32 32 0 1 0 72.5 68.6"
          fill="none"
          stroke="var(--c-primary)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d="M 61.8 36.4 A 18 18 0 1 0 61.8 59.6"
          fill="none"
          stroke="var(--c-primary)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.28}
        />
        <circle cx={82} cy={48} r={7} fill="var(--c-accent)" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 340 96"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={{ height, width: 'auto' }}
    >
      <title>{title}</title>
      <g transform="translate(4 16) scale(0.667)">
        <path
          d="M 72.5 27.4 A 32 32 0 1 0 72.5 68.6"
          fill="none"
          stroke="var(--c-primary)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d="M 61.8 36.4 A 18 18 0 1 0 61.8 59.6"
          fill="none"
          stroke="var(--c-primary)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.28}
        />
        <circle cx={82} cy={48} r={7} fill="var(--c-accent)" />
      </g>
      <text
        x={86}
        y={63}
        fontFamily="var(--c-font-sans)"
        fontSize={50}
        fontWeight={700}
        letterSpacing={-1.2}
        fill="var(--c-primary)"
      >
        Convoca
      </text>
    </svg>
  );
}
