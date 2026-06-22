import { useEffect, useState, useRef } from 'react';
import {
  X, Save, PlusCircle, Calendar, Award, Sparkles,
  Loader2, AlertTriangle, ThumbsUp, List
} from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

// Hook para cerrar con tecla Escape
function useEscapeKey(onClose) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}

// 1. Guardar Jugada Modal
export function GuardarJugadaModal({
  isOpen,
  onClose,
  nombreJugada,
  setNombreJugada,
  descJugada,
  setDescJugada,
  onSubmit
}) {
  useEscapeKey(onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-save-title"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
          <h3 id="modal-save-title" className="font-bold text-xs flex items-center tracking-tight uppercase">
            <Save className="mr-1.5" size={14} /> Guardar Jugada Táctica
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-valle-gold/80 hover:text-white transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Título de la Jugada</label>
            <input
              type="text"
              placeholder="Ej: Salida de Presión 2-2, Córner A..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
              value={nombreJugada}
              onChange={(e) => setNombreJugada(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción / Notas</label>
            <textarea
              placeholder="Movimiento del ala izquierda y pase largo al pivot..."
              rows="3"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green resize-none text-slate-800"
              value={descJugada}
              onChange={(e) => setDescJugada(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-valle-green text-valle-gold rounded-xl text-xs font-black hover:bg-valle-green-dark transition-all transform active:scale-98 duration-150 shadow-md cursor-pointer"
          >
            Guardar en Playbook
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. Crear Torneo Modal
export function CrearTorneoModal({
  isOpen,
  onClose,
  nombreTorneo,
  setNombreTorneo,
  temporadaTorneo,
  setTemporadaTorneo,
  fechaInicioTorneo,
  setFechaInicioTorneo,
  fechaFinTorneo,
  setFechaFinTorneo,
  creandoTorneo,
  onSubmit
}) {
  useEscapeKey(onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-tournament-title"
      >
        <div className="p-5 flex justify-between items-center bg-linear-to-br from-valle-green-dark via-valle-green to-[#1b4321] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-valle-gold/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <h3 id="modal-tournament-title" className="font-black text-sm flex items-center tracking-widest uppercase text-white relative z-10 font-display">
            <PlusCircle className="mr-2.5 text-valle-gold drop-shadow-md" size={16} /> Registrar Nuevo Torneo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-valle-gold/80 hover:text-white transition-colors cursor-pointer relative z-10 bg-white/5 hover:bg-white/20 p-1.5 rounded-lg"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 text-xs font-semibold text-slate-700 bg-slate-50/30">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre del Torneo</label>
            <input
              type="text"
              placeholder="Ej: Liga Universitaria de Futsal"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 transition-all shadow-sm placeholder:text-slate-300"
              value={nombreTorneo}
              onChange={(e) => setNombreTorneo(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Temporada</label>
              <input
                type="text"
                placeholder="Ej: 2026-I"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 transition-all shadow-sm placeholder:text-slate-300"
                value={temporadaTorneo}
                onChange={(e) => setTemporadaTorneo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5"><Calendar size={11} className="text-valle-gold" /> Fecha Inicio</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 cursor-pointer transition-all shadow-sm"
                value={fechaInicioTorneo}
                onChange={(e) => setFechaInicioTorneo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5"><Calendar size={11} className="text-valle-gold" /> Fecha Fin</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 cursor-pointer transition-all shadow-sm"
                value={fechaFinTorneo}
                onChange={(e) => setFechaFinTorneo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={creandoTorneo}
              className="w-full py-3.5 bg-linear-to-r from-valle-green to-valle-green-dark text-valle-gold rounded-xl text-sm font-black hover:from-valle-green-dark hover:to-[#1b4321] transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(27,67,33,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(27,67,33,0.6)] disabled:opacity-50 flex items-center justify-center cursor-pointer tracking-wide"
            >
              {creandoTorneo ? <><Loader2 size={16} className="animate-spin mr-2" /> Guardando...</> : 'Crear Torneo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Programar Partido Modal
export function ProgramarPartidoModal({
  isOpen,
  onClose,
  torneos,
  torneoIdPartido,
  setTorneoIdPartido,
  equipoLocalPartido,
  setEquipoLocalPartido,
  equipoVisitantePartido,
  setEquipoVisitantePartido,
  fechaHoraPartido,
  setFechaHoraPartido,
  plantillaAtletas,
  jugadoresSeleccionados,
  setJugadoresSeleccionados,
  programandoPartido,
  editandoPartidoId,
  onAbrirCrearTorneo,
  onSubmit
}) {
  useEscapeKey(onClose);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calcular la fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateTime = tomorrow.toISOString().slice(0, 16);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-match-title"
      >
        <div className="p-5 flex justify-between items-center bg-linear-to-br from-valle-green-dark via-valle-green to-[#1b4321] relative overflow-hidden rounded-t-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-valle-gold/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <h3 id="modal-match-title" className="font-black text-sm flex items-center tracking-widest uppercase text-white relative z-10 font-display">
            <Calendar className="mr-2.5 text-valle-gold drop-shadow-md" size={16} /> {editandoPartidoId ? 'Editar Convocatoria / Partido' : 'Programar Nuevo Partido'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-valle-gold/80 hover:text-white transition-colors cursor-pointer relative z-10 bg-white/5 hover:bg-white/20 p-1.5 rounded-lg"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 text-xs font-semibold text-slate-700 bg-slate-50/30">
          {torneos.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white border border-valle-gold/30 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-valle-gold to-yellow-500"></div>
              <div className="w-12 h-12 bg-valle-gold/10 rounded-full flex items-center justify-center mx-auto mb-2 text-valle-gold-dark">
                <PlusCircle size={24} />
              </div>
              <p className="text-slate-600 font-black tracking-wide leading-relaxed">Debes registrar al menos un Torneo primero.</p>
              <button
                type="button"
                onClick={onAbrirCrearTorneo}
                className="px-6 py-2.5 bg-linear-to-r from-valle-green to-valle-green-dark text-valle-gold font-black rounded-xl text-xs transition-all duration-300 shadow-md shadow-valle-green/20 hover:shadow-lg hover:from-valle-green-dark hover:to-[#1b4321] cursor-pointer"
              >
                Crear Torneo Ahora
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Torneo Asociado</label>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 focus-within:border-valle-green focus-within:ring-4 focus-within:ring-valle-green/10 transition-all">
                  <CustomSelect
                    value={torneoIdPartido}
                    onChange={(e) => setTorneoIdPartido(e.target.value)}
                    options={torneos.map(t => ({ value: t.id, label: `${t.nombre} (${t.temporada})` }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Equipo Local</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 transition-all shadow-sm"
                    value={equipoLocalPartido}
                    onChange={(e) => setEquipoLocalPartido(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Equipo Visitante</label>
                  <input
                    type="text"
                    placeholder="Ej: Futsal Margarita"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 transition-all shadow-sm placeholder:text-slate-300"
                    value={equipoVisitantePartido}
                    onChange={(e) => setEquipoVisitantePartido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 text-slate-800 cursor-pointer transition-all shadow-sm"
                    value={fechaHoraPartido}
                    onChange={(e) => setFechaHoraPartido(e.target.value)}
                    min={minDateTime}
                    required
                  />
                </div>

                {/* Plantilla / Jugadores Convocados */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                    <span>Convocados del Partido</span>
                  </h4>
                  <div ref={dropdownRef} className="relative">
                    <div 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-valle-green shadow-sm transition-all focus-within:ring-4 focus-within:ring-valle-green/10"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <span className={jugadoresSeleccionados.length === 0 ? "text-slate-400" : "text-slate-800"}>
                        {jugadoresSeleccionados.length === 0 
                          ? "Seleccionar atletas..." 
                          : `${jugadoresSeleccionados.length} convocado(s)`}
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    
                    {dropdownOpen && (
                      <div className="absolute z-50 bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl overflow-hidden origin-bottom flex flex-col w-64 md:w-full">
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <input
                            type="text"
                            placeholder="Buscar atleta por nombre..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-2 focus:ring-valle-green/10 text-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1.5">
                          {plantillaAtletas.length === 0 ? (
                            <p className="text-slate-400 text-center py-4 text-xs font-semibold">No hay atletas registrados.</p>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {plantillaAtletas
                                .filter(a => `${a.nombre} ${a.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(atleta => {
                                  const seleccionado = jugadoresSeleccionados.includes(atleta.atleta_id);
                                  return (
                                    <label
                                      key={atleta.atleta_id}
                                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${seleccionado
                                          ? 'bg-valle-green/10 text-valle-green-dark border border-valle-green/20'
                                          : 'bg-transparent border border-transparent text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="rounded text-valle-green focus:ring-valle-green border-slate-300 w-4 h-4 cursor-pointer shrink-0"
                                        checked={seleccionado}
                                        onChange={() => {
                                          if (seleccionado) {
                                            setJugadoresSeleccionados(prev => prev.filter(id => id !== atleta.atleta_id));
                                          } else {
                                            setJugadoresSeleccionados(prev => [...prev, atleta.atleta_id]);
                                          }
                                        }}
                                      />
                                      <div className="text-left flex-1 min-w-0">
                                        <p className="text-xs font-bold leading-tight truncate">{atleta.nombre} {atleta.apellido}</p>
                                        <p className="text-[10px] text-slate-500 leading-none mt-1">{atleta.posicion}</p>
                                      </div>
                                    </label>
                                  );
                                })}
                              {plantillaAtletas.filter(a => `${a.nombre} ${a.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <p className="text-slate-400 text-center py-3 text-xs font-semibold">No se encontraron atletas.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={programandoPartido}
                  className="w-full py-3.5 bg-linear-to-r from-valle-green to-valle-green-dark text-valle-gold rounded-xl text-sm font-black hover:from-valle-green-dark hover:to-[#1b4321] transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(27,67,33,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(27,67,33,0.6)] disabled:opacity-50 flex items-center justify-center cursor-pointer tracking-wide"
                >
                  {programandoPartido ? <><Loader2 size={16} className="animate-spin mr-2" /> Guardando...</> : (editandoPartidoId ? 'Guardar Cambios' : 'Programar Partido')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// 4. Finalizar Partido & Registrar Plantilla
export function FinalizarPartidoModal({
  isOpen,
  onClose,
  partido,
  golesLocalPartido,
  setGolesLocalPartido,
  golesVisitantePartido,
  setGolesVisitantePartido,
  guardandoResultado,
  onSubmit
}) {
  useEscapeKey(onClose);
  if (!isOpen || !partido) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-finalize-title"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
          <h3 id="modal-finalize-title" className="font-bold text-xs flex items-center tracking-tight uppercase">
            <Award className="mr-1.5" size={14} /> Registrar Marcador y Plantilla Convocada
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-valle-gold/80 hover:text-white transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-5 text-xs font-semibold text-slate-700">
          {/* Marcador */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Resultado Final</h4>
            <div className="flex items-center justify-between gap-4 max-w-xs mx-auto">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] font-bold text-slate-600 line-clamp-1 mb-1 text-center">{partido.equipo_local}</span>
                <input
                  type="number"
                  min="0"
                  className="w-16 text-center py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-black focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                  value={golesLocalPartido}
                  onChange={(e) => setGolesLocalPartido(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <span className="text-xl font-bold text-slate-400 self-end mb-2">-</span>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] font-bold text-slate-600 line-clamp-1 mb-1 text-center">{partido.equipo_visitante}</span>
                <input
                  type="number"
                  min="0"
                  className="w-16 text-center py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-black focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                  value={golesVisitantePartido}
                  onChange={(e) => setGolesVisitantePartido(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </div>



          <button
            type="submit"
            disabled={guardandoResultado}
            className="w-full py-2.5 bg-valle-green text-valle-gold rounded-xl text-xs font-black hover:bg-valle-green-dark transition shadow-md disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {guardandoResultado ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Registrando...</> : 'Guardar y Finalizar Partido'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 5. Reporte de IA Analítico
export function ReporteIAModal({
  isOpen,
  onClose,
  partido,
  reporteIA,
  cargandoReporte,
  errorReporte,
  onRetry
}) {
  useEscapeKey(onClose);
  if (!isOpen || !partido) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-report-title"
      >
        {/* Cabecera */}
        <div className="p-4 flex justify-between items-center bg-valle-green text-valle-gold">
          <div className="flex items-center gap-2.5">
            <Sparkles className="animate-pulse text-valle-gold" size={18} />
            <div className="text-left">
              <h3 id="modal-report-title" className="font-bold text-xs tracking-tight uppercase">Análisis Táctico Inteligente (IA)</h3>
              <p className="text-[9px] text-valle-gold/80 mt-0.5 leading-none font-medium tracking-wide">Generado por Groq a partir de El Valle Stats PDF</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-valle-gold/80 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/30">
          {cargandoReporte ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="animate-spin text-valle-green" size={32} />
              <p className="text-xs text-slate-500 font-bold">Consultando reporte de IA...</p>
            </div>
          ) : reporteIA && reporteIA.estado === 'pendiente_procesamiento' ? (
            <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 className="animate-spin text-blue-500" size={28} />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-slate-700">La IA está procesando el reporte</p>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">El PDF fue subido correctamente. El análisis se está generando en segundo plano. Espera unos momentos y vuelve a consultar.</p>
              </div>

              {/* Barra de progreso visual sutil simulando procesamiento */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 bg-blue-500 rounded-full w-2/3 animate-pulse" />
              </div>

              <button
                type="button"
                onClick={onRetry}
                className="px-5 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Loader2 size={13} className="animate-spin" /> Consultar de nuevo
              </button>
            </div>
          ) : (errorReporte || (reporteIA && reporteIA.analisis_ia?.error)) ? (
            <div className="text-center py-10 space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="text-amber-500" size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Sin reporte disponible</p>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {errorReporte || reporteIA.analisis_ia.error}
                </p>
                {reporteIA?.analisis_ia?.detalle_tecnico && (
                  <p className="text-[10px] text-slate-400 font-mono mt-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-left">
                    {reporteIA.analisis_ia.detalle_tecnico}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Volver a intentar
              </button>
            </div>
          ) : reporteIA && (
            <>
              {/* Resumen del Partido */}
              <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/60 text-left shadow-[0_2px_10px_-4px_rgba(59,130,246,0.1)]">
                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <List size={12} className="text-blue-500" /> Dinámica del Encuentro
                </h4>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                  "{reporteIA.analisis_ia?.resumen_partido || 'Análisis de partido no especificado.'}"
                </p>
              </div>

              {/* MVP Destacado */}
              <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100 flex items-start gap-4 text-left shadow-[0_2px_10px_-4px_rgba(245,158,11,0.1)]">
                <div className="p-3 bg-amber-100/80 text-amber-600 rounded-xl">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
                    Jugador Destacado (MVP)
                  </h4>
                  <p className="text-sm font-black text-slate-800">
                    {reporteIA.analisis_ia?.mvp ? reporteIA.analisis_ia.mvp.split(' - ')[0] : 'No asignado'}
                  </p>
                  {reporteIA.analisis_ia?.mvp && reporteIA.analisis_ia.mvp.includes(' - ') && (
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {reporteIA.analisis_ia.mvp.split(' - ').slice(1).join(' - ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Puntos Fuertes vs Mejorar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/50 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.05)]">
                  <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ThumbsUp size={12} /> Fortalezas del Equipo
                  </h4>
                  <ul className="space-y-2.5 text-xs font-medium text-slate-600">
                    {Array.isArray(reporteIA.analisis_ia?.puntos_fuertes) && reporteIA.analisis_ia.puntos_fuertes.map((pf, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{pf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50/15 p-5 rounded-2xl border border-red-100/40 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.05)]">
                  <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Áreas a Corregir
                  </h4>
                  <ul className="space-y-2.5 text-xs font-medium text-slate-600">
                    {Array.isArray(reporteIA.analisis_ia?.puntos_a_mejorar) && reporteIA.analisis_ia.puntos_a_mejorar.map((pam, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{pam}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Análisis Táctico e Individual */}
              {reporteIA.analisis_ia?.analisis_individual && (
                <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/60 text-left shadow-[0_2px_10px_-4px_rgba(99,102,241,0.1)]">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <List size={12} className="text-indigo-500" /> Análisis de Desempeño y Recomendación Táctica
                  </h4>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {reporteIA.analisis_ia.analisis_individual}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
