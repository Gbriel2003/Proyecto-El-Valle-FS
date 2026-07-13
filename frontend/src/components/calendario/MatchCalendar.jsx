import { 
  Calendar, Clock, Shield, FileText, 
  Trash2, Upload, Loader2, ChevronRight, Plus, Trophy, Filter, ArrowRight,
  CheckCircle, Pencil, Download, Eye
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { generatePDFReport } from '../../utils/reportGenerator';
import api from '../../api';

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
  manejarEliminarTorneo,
  manejarFinalizarTorneo,
  archivoSeleccionado,
  mensajeSubida,
  subiendo,
  progresoSubida,
  manejarCambioArchivo,
  manejarSubida,
  setEditandoPartidoId,
  setTorneoIdPartido,
  setEquipoLocalPartido,
  setEquipoVisitantePartido,
  setFechaHoraPartido,
  setMostrarProgramarPartido
}) {
  const [torneoFiltro, setTorneoFiltro] = useState(null); // null = todos
  const [reemplazandoReporteId, setReemplazandoReporteId] = useState(null);

  const descargarReporteSubido = async (partidoId) => {
    try {
      const response = await api.get(`/partidos/${partidoId}/descargar-reporte`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_tactico_${partidoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error al descargar el PDF", error);
      alert("Hubo un error al descargar el reporte subido.");
    }
  };

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

  const exportarPartidosPDF = async () => {
    let listToExport = partidos;
    if (torneoFiltro) {
      listToExport = listToExport.filter(p => p.torneo_id === torneoFiltro);
    }
    
    // Sort by date desc
    const sortedList = [...listToExport].sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

    const data = sortedList.map(p => {
      const fecha = new Date(p.fecha_hora).toLocaleDateString();
      const hora = new Date(p.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const resultado = p.estado === 'Finalizado' ? `${p.goles_local} - ${p.goles_visitante}` : 'Por jugar';
      return [
        p.torneo_nombre || 'Sin Torneo',
        `${fecha} ${hora}`,
        p.equipo_local,
        p.equipo_visitante,
        p.estado,
        resultado
      ];
    });

    const columns = ['Torneo', 'Fecha/Hora', 'Local', 'Visitante', 'Estado', 'Resultado'];

    await generatePDFReport({
      title: 'Reporte de Partidos',
      filename: 'reporte_partidos',
      columns,
      data,
      extraInfo: torneoFiltro ? `Filtrado por torneo seleccionado.` : 'Todos los partidos registrados.'
    });
  };

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

    let valleGanador = false;
    let vallePerdedor = false;
    let empate = false;

    if (esFinalizado && (esValleLocal || esValleVisitante)) {
      if (partido.goles_local === partido.goles_visitante) empate = true;
      else if (esValleLocal && partido.goles_local > partido.goles_visitante) valleGanador = true;
      else if (esValleVisitante && partido.goles_visitante > partido.goles_local) valleGanador = true;
      else vallePerdedor = true;
    }

    // Definir colores semánticos basados en el resultado de El Valle F.S.
    let borderColor = 'border-l-slate-300';
    let statusBgColor = 'bg-slate-100 text-slate-500';
    
    if (esFinalizado) {
      if (valleGanador) {
        borderColor = 'border-l-valle-green';
        statusBgColor = 'bg-valle-green/10 text-valle-green-dark border border-valle-green/20';
      } else if (vallePerdedor) {
        borderColor = 'border-l-red-500';
        statusBgColor = 'bg-red-50 text-red-600 border border-red-200';
      } else if (empate) {
        borderColor = 'border-l-slate-400';
        statusBgColor = 'bg-slate-100 text-slate-600 border border-slate-200';
      }
    } else {
      borderColor = 'border-l-valle-gold';
      statusBgColor = 'bg-valle-gold/10 text-valle-gold-dark border border-valle-gold/30';
    }

    return (
      <div className={`bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all duration-300 relative border-l-4 ${borderColor}`}>
        {/* Compact match display */}
        <div className="p-4 sm:p-5">
          {/* Top bar: torneo + estado */}
          <div className="flex justify-between items-center mb-4 pb-1">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 truncate max-w-[60%]">
              <Trophy size={13} className={esFinalizado ? (valleGanador ? 'text-valle-green' : 'text-slate-400') : 'text-valle-gold'} />
              {partido.torneo_nombre || "Torneo Oficial"}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${statusBgColor}`}>
              {esFinalizado ? (valleGanador ? 'Victoria' : vallePerdedor ? 'Derrota' : 'Empate') : partido.estado}
            </span>
          </div>

          {/* Teams + Score - horizontal compact layout */}
          <div className="flex items-center justify-between gap-3 bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
            {/* Local */}
            <div className={`flex items-center flex-1 min-w-0 gap-3 p-2 rounded-lg transition-colors ${esFinalizado && partido.goles_local > partido.goles_visitante ? 'bg-green-50/50' : ''}`}>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                esValleLocal 
                  ? 'bg-white border-valle-gold text-valle-green-dark' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {esValleLocal ? (
                  <img src="/logo.png" alt="El Valle F.S." className="w-full h-full object-contain p-1" />
                ) : (
                  <Shield size={20} />
                )}
              </div>
              <span className={`text-sm sm:text-base font-black truncate ${esValleLocal ? 'text-valle-green-dark' : 'text-slate-700'}`}>
                {partido.equipo_local}
              </span>
            </div>

            {/* Score / VS */}
            <div className="shrink-0 px-3 flex flex-col items-center justify-center">
              {esFinalizado ? (
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${partido.goles_local > partido.goles_visitante ? 'text-slate-800' : 'text-slate-400'}`}>
                    {partido.goles_local}
                  </span>
                  <span className="text-sm font-bold text-slate-300">-</span>
                  <span className={`text-2xl font-black ${partido.goles_visitante > partido.goles_local ? 'text-slate-800' : 'text-slate-400'}`}>
                    {partido.goles_visitante}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-valle-gold/20 flex items-center justify-center border border-valle-gold/30">
                  <span className="text-[10px] font-black text-valle-gold-dark tracking-tighter">VS</span>
                </div>
              )}
            </div>

            {/* Visitante */}
            <div className={`flex items-center flex-1 min-w-0 gap-3 justify-end p-2 rounded-lg transition-colors ${esFinalizado && partido.goles_visitante > partido.goles_local ? 'bg-green-50/50' : ''}`}>
              <span className={`text-sm sm:text-base font-black truncate text-right ${esValleVisitante ? 'text-valle-green-dark' : 'text-slate-700'}`}>
                {partido.equipo_visitante}
              </span>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                esValleVisitante 
                  ? 'bg-white border-valle-gold text-valle-green-dark' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {esValleVisitante ? (
                  <img src="/logo.png" alt="El Valle F.S." className="w-full h-full object-contain p-1" />
                ) : (
                  <Shield size={20} />
                )}
              </div>
            </div>
          </div>

          {/* Footer: Fecha, hora y acciones */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-3 border-t border-slate-100 gap-2.5">
            <div className="flex items-center gap-4 text-xs text-slate-800 font-bold">
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
                  className="px-3 py-1.5 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-xs font-bold transition flex items-center shadow-md cursor-pointer"
                >
                  <Eye size={14} className="mr-1.5" />
                  Ver Reporte
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
                <>

                  <button
                    type="button"
                    onClick={() => {
                      setEditandoPartidoId(partido.id);
                      setTorneoIdPartido(partido.torneo_id.toString());
                      setEquipoLocalPartido(partido.equipo_local);
                      setEquipoVisitantePartido(partido.equipo_visitante);
                      setFechaHoraPartido(new Date(new Date(partido.fecha_hora).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
                      setJugadoresSeleccionados(partido.jugadores_ids || []);
                      setMostrarProgramarPartido(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-valle-green hover:bg-valle-green/10 rounded-lg transition cursor-pointer"
                    title="Editar convocatoria o fecha"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => manejarEliminarPartido(partido.id)}
                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Eliminar partido"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Zona de subida de reportes tácticos (solo finalizados + cuerpo técnico) */}
        {esFinalizado && esCuerpoTecnico && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <div className="pt-3 border-t border-slate-200/60 w-full text-left">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <FileText size={12} className="mr-1 text-valle-green" /> Reporte Táctico (PDF)
              </h4>
              
              {partido.tiene_reporte && reemplazandoReporteId !== partido.id ? (
                <div className="flex flex-col sm:flex-row gap-2 mt-2 justify-start items-center">
                  <button 
                    type="button"
                    onClick={() => descargarReporteSubido(partido.id)}
                    className="px-4 py-2 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <Download size={13} className="mr-1.5" />
                    Descargar reporte subido
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReemplazandoReporteId(partido.id)}
                    className="px-4 py-2 bg-valle-gold hover:bg-valle-gold/90 text-white rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <Upload size={13} className="mr-1.5" />
                    Subir nuevo reporte
                  </button>
                </div>
              ) : (
                <>
                  {partido.tiene_reporte && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 font-medium italic">Reemplazando reporte actual...</span>
                      <button 
                        type="button" 
                        onClick={() => setReemplazandoReporteId(null)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

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
                </>
              )}
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden relative">
          {/* Header con colores del club */}
          <div className="px-5 py-5 bg-linear-to-br from-valle-green-dark via-valle-green to-[#1b4321] relative overflow-hidden">
            {/* Elemento decorativo de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-valle-gold/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="flex flex-col gap-3 relative z-10">
              <div>
                <h3 className="text-base font-black text-white flex items-center tracking-wide font-display">
                  <Trophy size={18} className="mr-2.5 text-valle-gold drop-shadow-md" />
                  Torneos Activos
                </h3>
                <p className="text-xs text-valle-gold/90 mt-1.5 font-semibold tracking-wide">Selecciona un torneo para filtrar los partidos</p>
              </div>
              <button
                type="button"
                onClick={exportarPartidosPDF}
                className="w-full justify-center px-3 py-2 mt-1 bg-valle-gold hover:opacity-90 text-white rounded-lg text-xs font-bold transition flex items-center cursor-pointer shadow-md whitespace-nowrap"
                title="Reporte Partidos"
              >
                <Download size={14} className="mr-1.5" />
                Reporte Partidos
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/30 space-y-3">
            {/* Filtro: Todos */}
            <button
              type="button"
              onClick={() => setTorneoFiltro(null)}
              className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 cursor-pointer border-2 ${
                torneoFiltro === null 
                  ? 'bg-valle-gold/5 border-valle-gold/50 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                    torneoFiltro === null ? 'bg-linear-to-br from-valle-gold to-yellow-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Filter size={14} />
                  </div>
                  <span className={`text-sm font-black tracking-tight ${torneoFiltro === null ? 'text-valle-gold-dark' : 'text-slate-600'}`}>
                    Todos los Partidos
                  </span>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${torneoFiltro === null ? 'bg-valle-gold/20 text-valle-gold-dark' : 'bg-slate-100 text-slate-400'}`}>
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
                <div
                  key={torneo.id}
                  className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 border-2 ${
                    isActive 
                      ? 'bg-valle-green/5 border-valle-green/50 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <button 
                      type="button"
                      onClick={() => setTorneoFiltro(isActive ? null : torneo.id)}
                      className="flex items-start gap-3 min-w-0 flex-1 hover:opacity-80 transition cursor-pointer text-left"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-colors ${
                        isActive ? 'bg-linear-to-br from-valle-green to-valle-green-dark text-valle-gold' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Trophy size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-sm font-black tracking-tight truncate flex items-center gap-2 ${isActive ? 'text-valle-green-dark' : 'text-slate-700'}`}>
                          {torneo.nombre}
                          {torneo.estado === 'Finalizado' && (
                            <CheckCircle size={14} className="text-valle-green shrink-0" title="Finalizado" />
                          )}
                        </span>
                        <span className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 block ${isActive ? 'text-valle-green/70' : 'text-slate-400'}`}>
                          {torneo.temporada}
                        </span>
                      </div>
                    </button>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mb-1">
                        {stats.total}
                      </span>
                      {esCuerpoTecnico && (
                        <div className="flex gap-1">
                          {torneo.estado !== 'Finalizado' && (
                            <button
                              type="button"
                              onClick={() => manejarFinalizarTorneo(torneo.id)}
                              className="p-1.5 text-slate-400 hover:text-valle-green hover:bg-valle-green/10 rounded-md transition cursor-pointer"
                              title="Finalizar torneo"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => manejarEliminarTorneo(torneo.id)}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Eliminar torneo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mini barra de progreso del torneo */}
                  {stats.total > 0 && (
                    <div className="mt-3 ml-11">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
                        <span className="text-slate-400">{stats.jugados} Jugados</span>
                        <span className="text-slate-400">{stats.porJugar} Por Jugar</span>
                      </div>
                      <div className="w-full bg-slate-100/80 rounded-full h-2 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 shadow-sm ${torneo.estado === 'Finalizado' ? 'bg-slate-400' : 'bg-linear-to-r from-valle-green to-valle-green-dark'}`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fechas del torneo */}
                  <div className="mt-3 ml-11 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={11} className={isActive ? "text-valle-green/50" : "text-slate-300"} />
                      <span>{torneo.fecha_inicio}</span>
                      <ArrowRight size={10} className="text-slate-300 mx-0.5" />
                      <span>{torneo.fecha_fin}</span>
                    </div>
                    {torneo.estado === 'Finalizado' && (
                       <span className="text-slate-400/80 italic">Finalizado</span>
                    )}
                  </div>
                </div>
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
