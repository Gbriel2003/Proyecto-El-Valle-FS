import React, { useState, useEffect, useMemo } from 'react';
import api from './api';
import { Calendar, Trophy, ChevronRight, Goal, Activity, Shield, XCircle, ArrowRight, CheckCircle, Clock } from 'lucide-react';

export default function MisPartidos({ crearNotificacion }) {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, programados, finalizados

  useEffect(() => {
    cargarPartidos();
  }, []);

  const cargarPartidos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/partidos/mis-partidos');
      setPartidos(res.data);
    } catch (err) {
      console.error(err);
      if (crearNotificacion) {
        crearNotificacion("Error al cargar partidos", "No se pudo obtener tu historial.", "error");
      }
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Fecha sin definir';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatearHora = (fechaStr) => {
    if (!fechaStr) return '--:--';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const { programados, finalizados } = useMemo(() => {
    const list = partidos;
    const progs = list.filter(p => p.estado !== 'Finalizado').sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    const fins = list.filter(p => p.estado === 'Finalizado').sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    return { programados: progs, finalizados: fins };
  }, [partidos]);

  const partidosFiltrados = useMemo(() => {
    if (filtro === 'programados') return programados;
    if (filtro === 'finalizados') return finalizados;
    return partidos; // 'todos'
  }, [partidos, filtro, programados, finalizados]);

  if (cargando) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-valle-gold/30 border-t-valle-gold rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-semibold animate-pulse">Cargando tus partidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      {/* Cabecera y Filtros */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-valle-black font-display flex items-center">
              <Trophy className="mr-2 text-valle-gold" size={24} /> 
              Mis Partidos
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Consulta tus próximas convocatorias y tu rendimiento en la cancha.</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filtro === 'todos' ? 'bg-white shadow-sm text-valle-green' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos ({partidos.length})
            </button>
            <button
              onClick={() => setFiltro('programados')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filtro === 'programados' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Próximos ({programados.length})
            </button>
            <button
              onClick={() => setFiltro('finalizados')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filtro === 'finalizados' ? 'bg-white shadow-sm text-valle-green' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Jugados ({finalizados.length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Partidos */}
      {partidosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No hay partidos para mostrar</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">No tienes convocatorias {filtro === 'programados' ? 'futuras' : filtro === 'finalizados' ? 'pasadas' : 'registradas'} en el sistema en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {partidosFiltrados.map((p) => {
            const esFinalizado = p.estado === 'Finalizado';
            const esLocal = p.equipo_local.toLowerCase().includes('valle');
            const equipoRival = esLocal ? p.equipo_visitante : p.equipo_local;
            
            // Determinar resultado visual
            let resultadoVisual = 'empate'; // victoria, derrota, empate
            if (esFinalizado) {
              const golesMios = esLocal ? p.goles_local : p.goles_visitante;
              const golesEllos = esLocal ? p.goles_visitante : p.goles_local;
              if (golesMios > golesEllos) resultadoVisual = 'victoria';
              else if (golesMios < golesEllos) resultadoVisual = 'derrota';
            }

            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                {/* Header del Partido */}
                <div className={`p-4 border-b ${esFinalizado ? 'bg-slate-50' : 'bg-amber-50/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-200 shadow-sm flex items-center">
                      <Trophy size={10} className="mr-1 text-valle-gold" /> {p.torneo_nombre}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center ${
                      esFinalizado 
                        ? (resultadoVisual === 'victoria' ? 'bg-green-100 text-green-700' : resultadoVisual === 'derrota' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700')
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {esFinalizado ? (
                         resultadoVisual === 'victoria' ? 'Victoria' : resultadoVisual === 'derrota' ? 'Derrota' : 'Empate'
                      ) : (
                        <><Clock size={10} className="mr-1" /> Convocado</>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex-1 text-center">
                      <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-white shadow-sm">
                        {p.equipo_local.toLowerCase().includes('valle') ? (
                          <img src="/logo.png" alt="El Valle F.S." className="w-8 h-8 object-contain" />
                        ) : (
                          <Shield size={20} className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 line-clamp-1">{p.equipo_local}</span>
                    </div>

                    <div className="px-4 text-center">
                      {esFinalizado ? (
                        <div className="bg-valle-black text-valle-gold font-display font-black text-xl px-4 py-1 rounded-lg border border-valle-gold/30 shadow-inner">
                          {p.goles_local} - {p.goles_visitante}
                        </div>
                      ) : (
                        <div className="text-slate-400 font-black text-sm bg-slate-100 px-3 py-1 rounded-md">VS</div>
                      )}
                    </div>

                    <div className="flex-1 text-center">
                      <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-white shadow-sm">
                         {p.equipo_visitante.toLowerCase().includes('valle') ? (
                          <img src="/logo.png" alt="El Valle F.S." className="w-8 h-8 object-contain" />
                        ) : (
                          <Shield size={20} className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 line-clamp-1">{p.equipo_visitante}</span>
                    </div>
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center"><Calendar size={12} className="mr-1.5 text-valle-green" /> {formatearFecha(p.fecha_hora)}</span>
                  <span className="flex items-center"><Clock size={12} className="mr-1.5 text-valle-green" /> {formatearHora(p.fecha_hora)}</span>
                </div>

                {/* Estadísticas Personales (Si está finalizado) */}
                <div className="p-4 bg-white flex-1 flex flex-col justify-center">
                  {!esFinalizado ? (
                    <div className="text-center py-2">
                      <p className="text-sm font-semibold text-slate-600">¡Fuiste convocado para este partido!</p>
                      <p className="text-xs text-slate-400 mt-1">Prepárate para dar lo mejor en la cancha.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest text-center">Tu Rendimiento</p>
                      
                      {p.estadisticas_personales ? (
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-slate-50 rounded-xl p-2 text-center">
                            <span className="block text-[10px] text-slate-500 font-bold mb-1">Goles</span>
                            <span className="block text-sm font-black text-valle-green">{p.estadisticas_personales.goles}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 text-center">
                            <span className="block text-[10px] text-slate-500 font-bold mb-1">Asist.</span>
                            <span className="block text-sm font-black text-valle-green">{p.estadisticas_personales.asistencias}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 text-center">
                            <span className="block text-[10px] text-slate-500 font-bold mb-1">Recup.</span>
                            <span className="block text-sm font-black text-amber-600">{p.estadisticas_personales.recuperaciones}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 text-center">
                            <span className="block text-[10px] text-slate-500 font-bold mb-1">Errores</span>
                            <span className="block text-sm font-black text-red-500">{p.estadisticas_personales.errores_posicionamiento}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-center text-slate-500 italic">Estadísticas tácticas no disponibles.</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
