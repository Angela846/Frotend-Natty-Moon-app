import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-natymoo py-32 text-center">
      <h1 className="font-display text-6xl text-plum/30 mb-4">404</h1>
      <p className="text-plum-ink/60 mb-6">No encontramos esta página.</p>
      <Link
        to="/"
        className="inline-block px-6 py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
