type MarkProps = { size?: number };

// The player character, used as the logo: a circle with its mouth open to the right
const Mark = ({ size = 18 }: MarkProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path className="mark" d="M12 12 L21.4 8.58 A10 10 0 1 0 21.4 15.42 Z" />
  </svg>
);

export default Mark;