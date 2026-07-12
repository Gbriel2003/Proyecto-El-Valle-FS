import { useState } from 'react';
import { FolderOpen, Save, Trash2, Loader2, Download, Search } from 'lucide-react';
import { generatePDFReport } from '../../utils/reportGenerator';

export default function PlaybookManager({
  cargandoJugadas,
  jugadas,
  cargarJugadaTactica,
  eliminarJugada,
  setMostrarGuardarModal
}) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  const jugadasFiltradas = jugadas.filter(j => 
    j.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase()) || 
    (j.descripcion && j.descripcion.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  const exportarPlaybookPDF = async () => {
    const data = jugadasFiltradas.map(j => [
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
      extraInfo: 'Listado de jugadas tácticas registradas en el sistema.'
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
          className="px-3 py-1.5 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-xs font-bold transition flex items-center shadow-md cursor-pointer w-max shrink-0"
          title="Descargar Reporte de Jugadas"
        >
          <Download size={14} className="mr-1.5" />
          Reporte de Jugadas
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

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
        <input
          type="text"
          placeholder="Buscar jugada..."
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-valle-green focus:border-transparent transition-shadow placeholder-slate-400 font-medium"
        />
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {cargandoJugadas ? (
          <div className="flex justify-center items-center py-6 text-slate-400">
            <Loader2 className="animate-spin mr-1.5 text-valle-green" size={14} />
            <span className="text-xs font-semibold">Sincronizando playbook...</span>
          </div>
        ) : jugadasFiltradas.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl">
            <p className="text-xs text-slate-400 font-bold">
              {terminoBusqueda ? 'No se encontraron jugadas' : 'No hay jugadas tácticas guardadas.'}
            </p>
            {!terminoBusqueda && <p className="text-xs text-slate-300 mt-0.5">Diseña una en la pizarra y presiona Guardar.</p>}
          </div>
        ) : (
          jugadasFiltradas.map((j) => (
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
