export default function FieldError({ mensaje }) {
  if (!mensaje) return null;
  return <p className="text-xs text-rose mt-1">{mensaje}</p>;
}
