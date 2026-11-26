import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-nocturne text-mist">
      <div className="container-natymoo py-12 flex flex-col sm:flex-row justify-between gap-6">
        <div>
          <span className="inline-block bg-white/95 rounded-lg px-3 py-1.5">
            <Logo className="h-6 w-auto" textClassName="font-display text-lg text-plum" />
          </span>
          <p className="text-sm text-white/60 mt-3 max-w-xs">
            Ropa de descanso pensada para noches tranquilas.
          </p>
          <Link to="/novedades" className="text-sm text-rose hover:text-rose-light transition-colors inline-block mt-3">
            ¿Algo salió mal? Reporta una novedad →
          </Link>
        </div>
        <p className="text-sm text-white/40 self-end">
          © {new Date().getFullYear()} Natymoo. Hecho con cariño.
        </p>
      </div>
    </footer>
  );
}