export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
      <div className="mb-4 text-5xl">{icon}</div>
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      <p className="mb-4 text-gray-400">{subtitle}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
