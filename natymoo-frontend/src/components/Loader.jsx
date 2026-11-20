export default function Loader({ texto = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-plum-ink/50">
      <div className="w-8 h-8 border-2 border-plum/20 border-t-plum rounded-full animate-spin" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}
