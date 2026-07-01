import { FolderOpen, Save, Trash2, Loader2, Download } from 'lucide-react';
import { generatePDFReport } from '../../utils/reportGenerator';

export default function PlaybookManager({
  cargandoJugadas,
  jugadas,
  cargarJugadaTactica,
  eliminarJugada,
  setMostrarGuardarModal
}) {
  const exportarPlaybookPDF = async () => {
    const data = jugadas.map(j => [
      j.titulo,
      j.descripcion || 'Sin descripción',
      new Date(j.fecha_creacion || Date.now()).toLocaleDateString()
    ]);

    const columns = ['Título de Jugada', 'Descripción', 'Fecha'];

    await generatePDFReport({
      title: 'Playbook / Biblioteca Táctica',
      filename: 'reporte_jugadas',
      columns,
      data,
      extraInfo: 'Listado oficial de jugadas tácticas registradas en el sistema.'
    });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm flex items-center tracking-tight">
          <FolderOpen size={16} className="text-valle-gold mr-2" />
          Playbook / Biblioteca Táctica
        </h3>
        <button
          type="button"
          onClick={exportarPlaybookPDF}
          className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer"
          title="Descargar PDF"
        >
          <Download size={12} className="mr-1" />
          PDF
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMostrarGuardarModal(true)}
        className="w-full py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-xl text-xs font-black transition-all transform active:scale-95 duration-150 flex items-center justify-center shadow-md shadow-valle-green/10 cursor-pointer"
        aria-label="Abrir modal para guardar jugada táctica actual"
      >
        <Save size={13} className="mr-1.5" /> Guardar Jugada Actual
      </button>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {cargandoJugadas ? (
          <div className="flex justify-center items-center py-6 text-slate-400">
            <Loader2 className="animate-spin mr-1.5 text-valle-green" size={14} />
            <span className="text-xs font-semibold">Sincronizando playbook...</span>
          </div>
        ) : jugadas.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl">
            <p className="text-xs text-slate-400 font-bold">No hay jugadas tácticas guardadas.</p>
            <p className="text-xs text-slate-300 mt-0.5">Diseña una en la pizarra y presiona Guardar.</p>
          </div>
        ) : (
          jugadas.map((j) => (
            <div 
              key={j.id} 
              className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/50 rounded-xl flex justify-between items-center transition group text-left"
            >
              <button
                type="button"
                onClick={() => cargarJugadaTactica(j)}
                className="flex-1 text-left focus:outline-none cursor-pointer"
                aria-label={`Cargar jugada táctica: ${j.titulo}`}
              >
                <p className="font-bold text-slate-800 text-xs line-clamp-1">{j.titulo}</p>
                {j.descripcion && (
                  <p className="text-xs text-slate-400 font-semibold line-clamp-1 mt-0.5">{j.descripcion}</p>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => eliminarJugada(j.id)}
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50/50 transition cursor-pointer"
                title="Eliminar jugada"
                aria-label={`Eliminar jugada táctica: ${j.titulo}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
