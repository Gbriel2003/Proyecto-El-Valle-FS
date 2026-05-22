import React from 'react';
import { 
  Calendar, Clock, MapPin, Shield, FileText, 
  Trash2, Upload, Loader2, ChevronRight, Plus 
} from 'lucide-react';

export default function MatchCalendar({
  partidos,
  cargando,
  esCuerpoTecnico,
  formatearFecha,
  formatearHora,
  abrirReporteIA,
  setMostrarFinalizarPartido,
  setGolesLocalPartido,
  setGolesVisitantePartido,
  setJugadoresSeleccionados,
  manejarEliminarPartido,
  archivoSeleccionado,
  mensajeSubida,
  subiendo,
  progresoSubida,
  manejarCambioArchivo,
  manejarSubida
}) {
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400 w-full col-span-2">
        <Loader2 className="animate-spin text-valle-green" size={32} />
        <p className="text-xs font-semibold">Cargando encuentros...</p>
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="col-span-2 text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-400 w-full">
        <Calendar className="mx-auto mb-3 opacity-30" size={32} />
        <p className="text-xs font-bold">No hay partidos registrados en el calendario.</p>
        {esCuerpoTecnico && <p className="text-[10px] text-slate-350 mt-1">Usa los botones superiores para programar uno.</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
      {partidos.map((partido) => {
        const esValleLocal = partido.equipo_local.toLowerCase().includes('valle');
        const esValleVisitante = partido.equipo_visitante.toLowerCase().includes('valle');
        const esFinalizado = partido.estado === 'Finalizado';

        return (
          <div 
            key={partido.id} 
            className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300/80 transition duration-300"
          >
            {/* Cabecera de la Tarjeta */}
            <div className={`px-4 py-2.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider ${
              esFinalizado 
                ? 'bg-slate-50 text-slate-500 border-b border-slate-100' 
                : 'bg-valle-green/8 text-valle-green-dark border-b border-valle-green/10'
            }`}>
              <span className="flex items-center">
                {esFinalizado ? <FileText size={12} className="mr-1.5" /> : <Clock size={12} className="mr-1.5" />}
                {partido.estado}
              </span>
              <span>{partido.torneo_nombre || "Torneo Oficial"}</span>
            </div>

            {/* Marcador e Info de Equipos */}
            <div className="p-6 flex items-center justify-between">
              {/* Equipo Local */}
              <div className="flex flex-col items-center flex-1 space-y-2">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-xs transition duration-300 ${
                  esValleLocal 
                    ? 'bg-valle-green/5 border-valle-green/30 text-valle-green' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <Shield size={24} className="shrink-0" />
                </div>
                <span className="font-bold text-slate-800 text-xs text-center line-clamp-1 max-w-[120px]">{partido.equipo_local}</span>
              </div>

              {/* Score / VS */}
              <div className="flex flex-col items-center px-2 shrink-0">
                {esFinalizado ? (
                  <div className="text-2xl font-black text-slate-800 tracking-wider bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs font-mono">
                    {partido.goles_local} - {partido.goles_visitante}
                  </div>
                ) : (
                  <div className="text-xs font-black text-slate-350 tracking-wider uppercase bg-slate-50/50 px-3 py-1 rounded-lg border border-slate-100">VS</div>
                )}
              </div>

              {/* Equipo Visitante */}
              <div className="flex flex-col items-center flex-1 space-y-2">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-xs transition duration-300 ${
                  esValleVisitante 
                    ? 'bg-valle-green/5 border-valle-green/30 text-valle-green' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <Shield size={24} className="shrink-0" />
                </div>
                <span className="font-bold text-slate-800 text-xs text-center line-clamp-1 max-w-[120px]">{partido.equipo_visitante}</span>
              </div>
            </div>

            {/* Detalles de fecha y hora & Acciones */}
            <div className="bg-slate-50/60 p-4 border-t border-slate-100 flex flex-col justify-between gap-3 mt-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                <div className="flex flex-col text-[10px] text-slate-400 font-semibold space-y-1">
                  <span className="flex items-center">
                    <Calendar size={12} className="mr-1.5 text-valle-gold" /> 
                    {formatearFecha(partido.fecha_hora)}
                  </span>
                  <span className="flex items-center">
                    <MapPin size={12} className="mr-1.5 text-valle-gold" /> 
                    {formatearHora(partido.fecha_hora)} · Cancha Local
                  </span>
                </div>

                {esFinalizado ? (
                  <button 
                    type="button"
                    onClick={() => abrirReporteIA(partido)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center shadow-xs w-full sm:w-auto justify-center cursor-pointer"
                  >
                    Ver Reporte Táctico
                    <ChevronRight size={13} className="ml-1" />
                  </button>
                ) : esCuerpoTecnico ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setMostrarFinalizarPartido(partido);
                      setGolesLocalPartido(partido.goles_local || 0);
                      setGolesVisitantePartido(partido.goles_visitante || 0);
                      setJugadoresSeleccionados(partido.jugadores_ids || []);
                    }}
                    className="px-3.5 py-1.5 bg-valle-gold hover:bg-valle-gold/90 text-valle-black rounded-lg text-xs font-bold transition flex items-center shadow-xs w-full sm:w-auto justify-center cursor-pointer"
                  >
                    Registrar Resultado
                    <Plus size={13} className="ml-1" />
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-450 rounded-lg text-[9px] font-bold select-none">
                    Programado
                  </span>
                )}

                {/* Eliminar partido programado */}
                {!esFinalizado && esCuerpoTecnico && (
                  <button
                    type="button"
                    onClick={() => manejarEliminarPartido(partido.id)}
                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Eliminar partido del calendario"
                    aria-label="Eliminar partido"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              
              {/* Zona de subida de reportes tácticos */}
              {esFinalizado && esCuerpoTecnico && (
                <div className="mt-2 pt-3 border-t border-slate-200/60 w-full text-left">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                    <FileText size={11} className="mr-1 text-valle-green" /> Cargar Reporte Estadístico (PDF)
                  </h4>
                  
                  {/* Mensaje de subida */}
                  {mensajeSubida.partidoId === partido.id && mensajeSubida.texto && (
                    <div className={`mb-2 p-2 rounded-lg text-[10px] font-bold border flex items-center ${
                      mensajeSubida.tipo === 'procesando' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      mensajeSubida.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {mensajeSubida.tipo === 'procesando' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
                      {mensajeSubida.texto}
                    </div>
                  )}

                  {/* Barra de progreso */}
                  {subiendo === partido.id && (
                    <div className="mb-2">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
                        <span>Subiendo PDF...</span>
                        <span>{progresoSubida}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 bg-valle-green rounded-full transition-all duration-200"
                          style={{ width: `${progresoSubida}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className="flex-1 w-full border border-dashed border-slate-300 hover:border-valle-green hover:bg-valle-green/5 bg-white rounded-xl p-2.5 text-center cursor-pointer transition">
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        onChange={(e) => manejarCambioArchivo(e, partido.id)}
                        disabled={subiendo === partido.id}
                      />
                      <div className="flex items-center justify-center text-slate-500 text-[11px] font-bold">
                        <Upload size={13} className="mr-1.5 text-valle-gold" />
                        {archivoSeleccionado && mensajeSubida.partidoId === partido.id 
                          ? (archivoSeleccionado.name.length > 25 ? `${archivoSeleccionado.name.substring(0, 22)}...` : archivoSeleccionado.name)
                          : 'Seleccionar PDF'}
                      </div>
                    </label>
                    
                    <button 
                      type="button"
                      onClick={() => manejarSubida(partido.id)}
                      disabled={subiendo === partido.id || !(archivoSeleccionado && mensajeSubida.partidoId === partido.id)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-xl text-[11px] font-black transition disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      {subiendo === partido.id ? (
                        <><Loader2 size={12} className="animate-spin mr-1" /> Procesando...</>
                      ) : (
                        'Analizar'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
