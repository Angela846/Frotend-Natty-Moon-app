import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-plum/10 bg-blush-soft">
      <div className="container-natymoo py-12 flex flex-col sm:flex-row justify-between gap-6">
        <div>
          <Logo className="h-7 w-auto" textClassName="font-display text-xl text-plum" />
          <p className="text-sm text-plum-ink/60 mt-1 max-w-xs">
            Ropa de descanso pensada para noches tranquilas.
          </p>
          <Link to="/novedades" className="text-sm text-plum hover:text-rose transition-colors inline-block mt-3">
            ¿Algo salió mal? Reporta una novedad →
          </Link>
        </div>
        <p className="text-sm text-plum-ink/50 self-end">
          © {new Date().getFullYear()} Natymoo. Hecho con cariño.
        </p>
      </div>
    </footer>
  );
}
