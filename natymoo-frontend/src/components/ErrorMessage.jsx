export default function ErrorMessage({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div className="bg-rose/10 border border-rose/30 text-plum-ink px-4 py-3 rounded-xl text-sm">
      {mensaje}
    </div>
  );
}
