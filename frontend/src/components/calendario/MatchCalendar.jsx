import { 
  Calendar, Clock, MapPin, Shield, FileText, 
  Trash2, Upload, Loader2, ChevronRight, Plus, Trophy, Filter, ArrowRight
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function MatchCalendar({
  partidos,
  torneos = [],
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
  const [torneoFiltro, setTorneoFiltro] = useState(null); // null = todos

  // Separar partidos por estado
  const { programados, finalizados } = useMemo(() => {
    let lista = partidos;
    if (torneoFiltro) {
      lista = lista.filter(p => p.torneo_id === torneoFiltro);
    }
    const programados = lista
      .filter(p => p.estado !== 'Finalizado')
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    const finalizados = lista
      .filter(p => p.estado === 'Finalizado')
      .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    return { programados, finalizados };
  }, [partidos, torneoFiltro]);

  // Calcular stats de cada torneo
  const torneoStats = useMemo(() => {
    const stats = {};
    partidos.forEach(p => {
      const tid = p.torneo_id || 'sin_torneo';
      if (!stats[tid]) {
        stats[tid] = { total: 0, jugados: 0, porJugar: 0, nombre: p.torneo_nombre || 'Sin Torneo' };
      }
      stats[tid].total++;
      if (p.estado === 'Finalizado') stats[tid].jugados++;
      else stats[tid].porJugar++;
    });
    return stats;
  }, [partidos]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400 w-full">
        <Loader2 className="animate-spin text-valle-green" size={32} />
        <p className="text-xs font-semibold">Cargando encuentros...</p>
      </div>
    );
  }

  if (partidos.length === 0 && torneos.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-400 w-full">
        <Calendar className="mx-auto mb-3 opacity-30" size={32} />
        <p className="text-sm font-bold">No hay partidos ni torneos registrados.</p>
        {esCuerpoTecnico && <p className="text-xs text-slate-350 mt-1">Crea un torneo y luego programa partidos.</p>}
      </div>
    );
  }

  const PartidoRow = ({ partido }) => {
    const esValleLocal = partido.equipo_local.toLowerCase().includes('valle');
    const esValleVisitante = partido.equipo_visitante.toLowerCase().includes('valle');
    const esFinalizado = partido.estado === 'Finalizado';

    return (
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-md hover:border-slate-300/80 transition duration-300">
        {/* Compact match display */}
        <div className="p-4 sm:p-5">
          {/* Top bar: torneo + estado */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate max-w-[60%]">
              {partido.torneo_nombre || "Torneo Oficial"}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              esFinalizado 
                ? 'bg-slate-100 text-slate-500' 
                : 'bg-valle-green/10 text-valle-green-dark'
            }`}>
              {partido.estado}
            </span>
          </div>

          {/* Teams + Score - horizontal compact layout */}
          <div className="flex items-center justify-between gap-2">
            {/* Local */}
            <div className="flex items-center flex-1 min-w-0 gap-2.5">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${
                esValleLocal 
                  ? 'bg-valle-green/5 border-valle-green/30 text-valle-green' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Shield size={18} />
              </div>
              <span className={`text-sm font-bold truncate ${esValleLocal ? 'text-valle-green-dark' : 'text-slate-700'}`}>
                {partido.equipo_local}
              </span>
            </div>

            {/* Score / VS */}
            <div className="shrink-0 px-2">
              {esFinalizado ? (
                <div className="text-lg font-black text-slate-800 tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 font-mono">
                  {partido.goles_local} - {partido.goles_visitante}
                </div>
              ) : (
                <div className="text-xs font-extrabold text-slate-350 tracking-wider uppercase bg-slate-50/50 px-2.5 py-1 rounded-lg border border-slate-100">VS</div>
              )}
            </div>

            {/* Visitante */}
            <div className="flex items-center flex-1 min-w-0 gap-2.5 justify-end">
              <span className={`text-sm font-bold truncate text-right ${esValleVisitante ? 'text-valle-green-dark' : 'text-slate-700'}`}>
                {partido.equipo_visitante}
              </span>
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${
                esValleVisitante 
                  ? 'bg-valle-green/5 border-valle-green/30 text-valle-green' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Shield size={18} />
              </div>
            </div>
          </div>

          {/* Footer: Fecha, hora y acciones */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-3 border-t border-slate-100 gap-2.5">
            <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
              <span className="flex items-center">
                <Calendar size={12} className="mr-1 text-valle-gold" /> 
                {formatearFecha(partido.fecha_hora)}
              </span>
              <span className="flex items-center">
                <Clock size={12} className="mr-1 text-valle-gold" /> 
                {formatearHora(partido.fecha_hora)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {esFinalizado ? (
                <button 
                  type="button"
                  onClick={() => abrirReporteIA(partido)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer"
                >
                  Ver Reporte
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
                  className="px-3 py-1.5 bg-valle-gold hover:bg-valle-gold/90 text-valle-black rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer"
                >
                  Resultado
                  <Plus size={13} className="ml-1" />
                </button>
              ) : (
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-450 rounded-lg text-xs font-bold select-none">
                  Programado
                </span>
              )}

              {!esFinalizado && esCuerpoTecnico && (
                <button
                  type="button"
                  onClick={() => manejarEliminarPartido(partido.id)}
                  className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Eliminar partido"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Zona de subida de reportes tácticos (solo finalizados + cuerpo técnico) */}
        {esFinalizado && esCuerpoTecnico && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <div className="pt-3 border-t border-slate-200/60 w-full text-left">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <FileText size={12} className="mr-1 text-valle-green" /> Cargar Reporte (PDF)
              </h4>
              
              {mensajeSubida.partidoId === partido.id && mensajeSubida.texto && (
                <div className={`mb-2 p-2 rounded-lg text-xs font-bold border flex items-center ${
                  mensajeSubida.tipo === 'procesando' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  mensajeSubida.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {mensajeSubida.tipo === 'procesando' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
                  {mensajeSubida.texto}
                </div>
              )}

              {subiendo === partido.id && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
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
                  <div className="flex items-center justify-center text-slate-505 text-xs font-bold">
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
                  className="w-full sm:w-auto px-4 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-xl text-xs font-black transition disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {subiendo === partido.id ? (
                    <><Loader2 size={12} className="animate-spin mr-1" /> Procesando...</>
                  ) : (
                    'Analizar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
      
      {/* ====== PANEL IZQUIERDO: TORNEOS ====== */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <Trophy size={16} className="mr-2 text-valle-gold" />
              Torneos Activos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Selecciona un torneo para filtrar los partidos</p>
          </div>

          <div className="p-3 space-y-2">
            {/* Filtro: Todos */}
            <button
              type="button"
              onClick={() => setTorneoFiltro(null)}
              className={`w-full text-left p-3 rounded-xl transition cursor-pointer border ${
                torneoFiltro === null 
                  ? 'bg-valle-green/5 border-valle-green/20 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    torneoFiltro === null ? 'bg-valle-green text-valle-gold' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Filter size={13} />
                  </div>
                  <span className={`text-sm font-bold ${torneoFiltro === null ? 'text-valle-green-dark' : 'text-slate-600'}`}>
                    Todos los Partidos
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {partidos.length}
                </span>
              </div>
            </button>

            {/* Lista de torneos */}
            {torneos.map(torneo => {
              const stats = torneoStats[torneo.id] || { total: 0, jugados: 0, porJugar: 0 };
              const isActive = torneoFiltro === torneo.id;
              const progreso = stats.total > 0 ? Math.round((stats.jugados / stats.total) * 100) : 0;

              return (
                <button
                  key={torneo.id}
                  type="button"
                  onClick={() => setTorneoFiltro(isActive ? null : torneo.id)}
                  className={`w-full text-left p-3 rounded-xl transition cursor-pointer border ${
                    isActive 
                      ? 'bg-valle-green/5 border-valle-green/20 shadow-sm' 
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? 'bg-valle-gold text-valle-black' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Trophy size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-sm font-bold block truncate ${isActive ? 'text-valle-green-dark' : 'text-slate-700'}`}>
                          {torneo.nombre}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {torneo.temporada}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      {stats.total}
                    </span>
                  </div>

                  {/* Mini barra de progreso del torneo */}
                  {stats.total > 0 && (
                    <div className="mt-2.5 ml-9">
                      <div className="flex justify-between text-xs text-slate-400 font-medium mb-1">
                        <span>{stats.jugados} jugados</span>
                        <span>{stats.porJugar} por jugar</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-valle-green rounded-full transition-all duration-500"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fechas del torneo */}
                  <div className="mt-2 ml-9 flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Calendar size={10} className="text-slate-300" />
                    <span>{torneo.fecha_inicio}</span>
                    <ArrowRight size={10} className="text-slate-300" />
                    <span>{torneo.fecha_fin}</span>
                  </div>
                </button>
              );
            })}

            {torneos.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <Trophy className="mx-auto mb-2 opacity-30" size={24} />
                <p className="text-xs font-bold">Sin torneos registrados</p>
                {esCuerpoTecnico && <p className="text-xs text-slate-350 mt-0.5">Crea uno desde el botón superior</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== PANEL DERECHO: PARTIDOS EN SECUENCIA ====== */}
      <div className="lg:col-span-8 space-y-5">
        
        {/* Próximos Partidos */}
        {programados.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-valle-green animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Próximos Encuentros
              </h3>
              <span className="text-xs font-bold text-valle-green bg-valle-green/10 px-2 py-0.5 rounded-full">
                {programados.length}
              </span>
            </div>
            <div className="space-y-3">
              {programados.map(partido => (
                <PartidoRow key={partido.id} partido={partido} />
              ))}
            </div>
          </div>
        )}

        {/* Partidos Finalizados */}
        {finalizados.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Resultados
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {finalizados.length}
              </span>
            </div>
            <div className="space-y-3">
              {finalizados.map(partido => (
                <PartidoRow key={partido.id} partido={partido} />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío tras filtrar */}
        {programados.length === 0 && finalizados.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-slate-400">
            <Calendar className="mx-auto mb-3 opacity-30" size={32} />
            <p className="text-sm font-bold">No hay partidos en este torneo.</p>
            {esCuerpoTecnico && <p className="text-xs text-slate-350 mt-1">Programa un partido desde el botón superior.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
