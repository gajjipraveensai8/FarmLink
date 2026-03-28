export default function Skeleton({ className = "", variant = "rect" }) {
  const variantClass = variant === 'circle' ? 'rounded-full' : 'rounded-2xl';
  return (
    <div className={`skeleton ${variantClass} ${className}`} />
  );
}
