import { useState, useEffect } from 'react';
import api from './api';
import {
  User, Activity, Scale, Droplet, Moon, Brain, AlertTriangle,
  Plus, Check, ChevronLeft, Calendar, Heart, ShieldAlert, X, Apple,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomSelect from './components/ui/CustomSelect';

export default function FichaTecnica({ atletaId = null, onBack = null, crearNotificacion = null }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [temporalidad, setTemporalidad] = useState('diario');
  const [analisisIa, setAnalisisIa] = useState({
    diario: null,
    semanal: null,
    mensual: null,
    anual: null
  });
  const [cargandoIa, setCargandoIa] = useState(false);
  const [errorIa, setErrorIa] = useState('');

  // Roles de usuario
  const rol = (localStorage.getItem('rol_usuario') || 'atleta').toLowerCase();
  const esCuerpoTecnico = rol === 'admin' || rol === 'entrenador';

  // ID final de atleta (el prop o el del dashboard propio)
  const [actualAtletaId, setActualAtletaId] = useState(atletaId);

  // Datos extendidos
  const [habitos, setHabitos] = useState([]);
  const [lesiones, setLesiones] = useState([]);

  // Estados de formularios y modals
  const [mostrarHabitoModal, setMostrarHabitoModal] = useState(false);
  const [mostrarLesionModal, setMostrarLesionModal] = useState(false);
  const [mostrarAltaModal, setMostrarAltaModal] = useState(null); // guardará el objeto de lesión a dar de alta

  // Campos de formulario diario nutricional
  const [frecuenciaComidas, setFrecuenciaComidas] = useState(4);
  const [suplementacion, setSuplementacion] = useState('Ninguna');
  const [hidratacion, setHidratacion] = useState(2.0);
  const [calidadDescanso, setCalidadDescanso] = useState(7);
  const [guardandoHabito, setGuardandoHabito] = useState(false);

  // Campos de formulario de lesiones
  const [tipoLesion, setTipoLesion] = useState('');
  const [gravedad, setGravedad] = useState('Leve');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [rehabilitacion, setRehabilitacion] = useState('');
  const [guardandoLesion, setGuardandoLesion] = useState(false);

  // Campos de formulario de alta médica
  const [fechaAlta, setFechaAlta] = useState(new Date().toISOString().split('T')[0]);
  const [rehabilitacionAlta, setRehabilitacionAlta] = useState('');
  const [guardandoAlta, setGuardandoAlta] = useState(false);
  const [notificacionInicialMostrada, setNotificacionInicialMostrada] = useState(false);

  const cargarAnalisisIa = async (idAtleta, temp, forzar = false) => {
    // Si ya está en caché local para esta sesión, no re-consultar (a menos que se fuerce)
    if (analisisIa[temp] && !forzar) return;
    
    setCargandoIa(true);
    setErrorIa('');
    try {
      const url = idAtleta 
        ? `/atletas/${idAtleta}/analisis-ia?temporalidad=${temp}${forzar ? '&forzar=true' : ''}`
        : `/mi-dashboard/analisis-ia?temporalidad=${temp}${forzar ? '&forzar=true' : ''}`;
      const res = await api.get(url);
      setAnalisisIa(prev => ({
        ...prev,
        [temp]: res.data
      }));
    } catch (err) {
      console.error(err);
      setErrorIa('Error al cargar el análisis de la IA.');
    } finally {
      setCargandoIa(false);
    }
  };

  useEffect(() => {
    const targetId = actualAtletaId || datos?.perfil?.atleta_id;
    if (datos) {
      cargarAnalisisIa(targetId, temporalidad);
    }
  }, [temporalidad, actualAtletaId, datos]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const urlDashboard = atletaId ? `/atletas/${atletaId}/dashboard` : '/mi-dashboard';
      const res = await api.get(urlDashboard);

      let data = res.data;
      if (data && data.cargas_historicas) {
        // Revertir a orden cronológico para el gráfico
        data.cargas_historicas = [...data.cargas_historicas].reverse();
      }
      
      setDatos(data);
      setAnalisisIa({ diario: null, semanal: null, mensual: null, anual: null });
      setTemporalidad('diario');

      const targetId = atletaId || data.perfil?.atleta_id;
      if (targetId) {
        setActualAtletaId(targetId);

        // Cargar registros adicionales (Hábitos y Lesiones)
        const [resHabitos, resLesiones] = await Promise.all([
          api.get(`/atletas/${targetId}/habitos-nutricionales`).catch(() => ({ data: [] })),
          api.get(`/atletas/${targetId}/lesiones`).catch(() => ({ data: [] }))
        ]);

        setHabitos(resHabitos.data || []);
        setLesiones(resLesiones.data || []);
      }

      // Si el backend trajo el análisis de hoy en la respuesta principal, lo guardamos en la caché local
      if (data.alerta_ia && !data.alerta_ia.error) {
        setAnalisisIa(prev => ({
          ...prev,
          diario: data.alerta_ia
        }));
      } else {
        cargarAnalisisIa(targetId, 'diario');
      }

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError('Aún no tienes una ficha deportiva creada. Pídele al entrenador que te registre en la Plantilla.');
      } else {
        setError('Error al cargar la ficha técnica del atleta.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      cargarDatos();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atletaId]);

  useEffect(() => {
    if (mostrarHabitoModal) {
      const hoyStr = new Date().toLocaleDateString('sv');
      const registroHoy = habitos.find(h => h.fecha === hoyStr);
      if (registroHoy) {
        setFrecuenciaComidas(registroHoy.frecuencia_comidas);
        setSuplementacion(registroHoy.suplementacion || 'Ninguna');
        setHidratacion(registroHoy.hidratacion_litros);
        setCalidadDescanso(registroHoy.calidad_descanso);
      } else {
        setFrecuenciaComidas(4);
        setSuplementacion('Ninguna');
        setHidratacion(2.0);
        setCalidadDescanso(7);
      }
    }
  }, [mostrarHabitoModal, habitos]);

  useEffect(() => {
    if (!cargando && datos && crearNotificacion && !notificacionInicialMostrada) {
      const hoyStr = new Date().toLocaleDateString('sv');
      const completado = habitos.some(h => h.fecha === hoyStr);
      if (!completado) {
        crearNotificacion(
          "Hábitos Pendientes ⚠️",
          !esCuerpoTecnico && !atletaId 
            ? "Usted no ha registrado sus hábitos de hoy."
            : "El atleta no ha registrado sus hábitos de hoy.",
          "warning",
          (!esCuerpoTecnico && !atletaId) ? "mi_perfil" : "jugadores"
        );
      }
      setNotificacionInicialMostrada(true);
    }
  }, [cargando, datos, habitos, crearNotificacion, notificacionInicialMostrada, esCuerpoTecnico, atletaId]);

  // Guardar hábitos diarios
  const manejarGuardarHabito = async (e) => {
    e.preventDefault();
    if (!actualAtletaId) return;
    setGuardandoHabito(true);

    try {
      await api.post(`/atletas/${actualAtletaId}/habitos-nutricionales`, {
        fecha: new Date().toLocaleDateString('sv'),
        frecuencia_comidas: frecuenciaComidas,
        suplementacion,
        hidratacion_litros: parseFloat(hidratacion),
        calidad_descanso: calidadDescanso,
        plan_alimentacion: datos.perfil?.dieta_asignada?.nombre || 'Ninguno'
      });
      setMostrarHabitoModal(false);
      if (crearNotificacion) {
        crearNotificacion("Hábitos guardados", "Información nutricional actualizada.", "success");
      }
      cargarDatos(); // Recargar gráficos e históricos
    } catch (err) {
      console.error("Error al registrar hábitos:", err);
      alert('Error al registrar hábitos diarios.');
    } finally {
      setGuardandoHabito(false);
    }
  };

  // Guardar nueva lesión
  const manejarGuardarLesion = async (e) => {
    e.preventDefault();
    if (!actualAtletaId) return;
    if (!tipoLesion.trim()) return alert('Especifica el tipo de lesión.');
    setGuardandoLesion(true);

    try {
      await api.post(`/atletas/${actualAtletaId}/lesiones`, {
        tipo_lesion: tipoLesion,
        gravedad,
        fecha_inicio: fechaInicio,
        descripcion,
        rehabilitacion
      });
      setMostrarLesionModal(false);
      // Resetear campos
      setTipoLesion('');
      setGravedad('Leve');
      setDescripcion('');
      setRehabilitacion('');
      if (crearNotificacion) {
        crearNotificacion("Lesión registrada", "Nueva lesión agregada al historial médico.", "warning");
      }
      cargarDatos();
    } catch (err) {
      console.error("Error al registrar lesión:", err);
      alert('Error al registrar lesión.');
    } finally {
      setGuardandoLesion(false);
    }
  };

  // Dar alta médica
  const manejarAltaLesion = async (e) => {
    e.preventDefault();
    if (!mostrarAltaModal) return;
    setGuardandoAlta(true);

    try {
      await api.put(`/lesiones/${mostrarAltaModal.id}/alta`, {
        fecha_alta: fechaAlta,
        rehabilitacion: rehabilitacionAlta
      });
      setMostrarAltaModal(null);
      setRehabilitacionAlta('');
      if (crearNotificacion) {
        crearNotificacion("Alta médica otorgada", "El jugador ha recibido el alta médica.", "success");
      }
      cargarDatos();
    } catch (err) {
      console.error("Error al registrar alta:", err);
      alert('Error al registrar alta médica.');
    } finally {
      setGuardandoAlta(false);
    }
  };

  if (cargando) return <div className="text-center p-12 text-slate-500 font-bold">Cargando ficha deportiva...</div>;
  if (error) return <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center font-medium shadow-sm max-w-lg mx-auto">{error}</div>;
  if (!datos) return null;

  // Filtrar lesiones activas (en recuperación)
  const lesionesActivas = lesiones.filter(l => !l.fecha_alta);

  const hoyStr = new Date().toLocaleDateString('sv');
  const habitosDeHoyRegistrados = habitos.some(h => h.fecha === hoyStr);

  return (
    <div className="w-full mx-auto space-y-6 px-2 sm:px-4 lg:px-6">

      {/* Botón Volver (solo si se visualiza desde el listado de plantilla) */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-valle-green transition text-xs font-bold bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm"
        >
          <ChevronLeft size={16} className="mr-1" />
          Volver a la Plantilla
        </button>
      )}

      {/* Cabecera del Jugador */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          {datos.perfil?.foto_perfil ? (
            <img 
              src={datos.perfil.foto_perfil.startsWith('http') ? datos.perfil.foto_perfil : `${api.defaults.baseURL}${datos.perfil.foto_perfil.startsWith('/') ? '' : '/'}${datos.perfil.foto_perfil}`}
              alt="Perfil"
              className="w-16 h-16 rounded-full object-cover border-2 border-valle-gold shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-valle-green/10 border-2 border-valle-gold flex items-center justify-center text-valle-green font-black text-2xl shrink-0">
              {datos.perfil ? datos.perfil.atleta_id : 'AJ'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-valle-black flex items-center">
              <User className="text-valle-green mr-2" size={20} />
              {atletaId ? 'Ficha Deportiva del Atleta' : 'Mi Ficha Deportiva'}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Altura Fichaje: {datos.perfil?.altura_fichaje} cm | Peso Fichaje: {datos.perfil?.peso_fichaje} kg
            </p>
          </div>
        </div>

        {/* Botones de acción contextuales */}
        <div className="flex space-x-2 w-full md:w-auto">
          {!esCuerpoTecnico ? (
            <button
              onClick={() => setMostrarHabitoModal(true)}
              className={`w-full md:w-auto px-4 py-2.5 rounded-lg text-xs font-black transition flex items-center justify-center shadow-sm cursor-pointer ${habitosDeHoyRegistrados
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-valle-green hover:bg-valle-green-dark text-valle-gold'
                }`}
            >
              {habitosDeHoyRegistrados ? (
                <>
                  <Check size={14} className="mr-1.5" /> Actualizar Hábitos Diarios
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-1.5" /> Registrar Hábitos Diarios
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setMostrarLesionModal(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition flex items-center justify-center shadow-sm cursor-pointer"
            >
              <ShieldAlert size={14} className="mr-1.5" /> Reportar Lesión
            </button>
          )}
        </div>
      </div>

      {/* Dieta Asignada */}
      {datos.perfil?.dieta_asignada && (
        <div className="bg-emerald-50 border border-emerald-100 border-l-4 border-l-valle-green p-4 rounded-xl text-xs text-slate-700 font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-valle-green/10 flex items-center justify-center shrink-0">
              <Apple className="text-valle-green" size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-valle-green">Plan Alimenticio Asignado: {datos.perfil.dieta_asignada.nombre}</p>
              <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">{datos.perfil.dieta_asignada.descripcion}</p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="font-black text-base text-valle-green block">{datos.perfil.dieta_asignada.calorias} kcal</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor Energético</span>
          </div>
        </div>
      )}

      {/* Alerta de Lesión Activa */}
      {lesionesActivas.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl text-xs text-red-800 font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-3 animate-pulse" size={20} />
            <div>
              <p className="font-bold text-sm">Estado Médico: De Baja</p>
              <p className="text-slate-600 mt-0.5">El atleta presenta una lesión de tipo: <span className="font-bold">{lesionesActivas[0].tipo_lesion}</span> ({lesionesActivas[0].gravedad}) registrada el {lesionesActivas[0].fecha_inicio}.</p>
            </div>
          </div>
          {esCuerpoTecnico && (
            <button
              onClick={() => setMostrarAltaModal(lesionesActivas[0])}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-lg font-bold transition shadow-sm"
            >
              Dar Alta Médica
            </button>
          )}
        </div>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-indigo-100/50 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Peso / IMC Actual</p>
            <p className="text-2xl font-black text-indigo-950 mt-1">
              {datos.estado_fisico?.peso_actual} <span className="text-sm font-medium text-indigo-700/70">kg</span>
            </p>
            <p className="text-xs text-indigo-600 font-semibold mt-1">IMC: {datos.estado_fisico?.imc_actual}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500">
            <Scale size={24} />
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-fuchsia-50 rounded-xl shadow-sm border border-fuchsia-100/50 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-fuchsia-500 uppercase tracking-wider">Descanso Promedio</p>
            <p className="text-2xl font-black text-fuchsia-950 mt-1">
              {datos.habitos_semanales?.promedio_descanso || 0} <span className="text-sm font-medium text-fuchsia-700/70">/ 10</span>
            </p>
            <p className="text-xs text-fuchsia-600 font-semibold mt-1">Últimos 3 registros</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-fuchsia-500">
            <Moon size={24} />
          </div>
        </div>

        <div className="bg-linear-to-br from-cyan-50 to-sky-50 rounded-xl shadow-sm border border-sky-100/50 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Hidratación Promedio</p>
            <p className="text-2xl font-black text-sky-950 mt-1">
              {datos.habitos_semanales?.promedio_hidratacion || 0} <span className="text-sm font-medium text-sky-700/70">L</span>
            </p>
            <p className="text-xs text-sky-600 font-semibold mt-1">Meta diaria: 3L</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-sky-500">
            <Droplet size={24} />
          </div>
        </div>

        <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-teal-100/50 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Historial Sesiones</p>
            <p className="text-2xl font-black text-teal-950 mt-1">
              {datos.cargas_historicas?.length || 0}
            </p>
            <p className="text-xs text-teal-600 font-semibold mt-1">Entrenamientos evaluados</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-teal-500">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Gráfico y Análisis IA (Mitad y Mitad) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Columna Gráfica de Rendimiento */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <h3 className="font-bold text-valle-black text-sm mb-4">Evolución de Cargas Físicas</h3>
          {datos.cargas_historicas && datos.cargas_historicas.length > 0 ? (
            <div className="h-72 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart data={datos.cargas_historicas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="sesion" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#B49650" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#2E5235" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line yAxisId="left" type="monotone" name="Salto (cm)" dataKey="salto" stroke="#B49650" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" name="Esfuerzo (RPE)" dataKey="rpe" stroke="#2E5235" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex-1 flex items-center justify-center text-slate-400 text-xs">Sin cargas registradas recientemente.</div>
          )}
          <div className="flex justify-center space-x-6 mt-2 pt-2 border-t border-slate-50">
            <div className="flex items-center text-xs font-semibold text-slate-500"><div className="w-2.5 h-2.5 bg-valle-gold rounded-full mr-2"></div> Potencia (Salto)</div>
            <div className="flex items-center text-xs font-semibold text-slate-500"><div className="w-2.5 h-2.5 bg-valle-green rounded-full mr-2"></div> Fatiga (RPE)</div>
          </div>
        </div>

        {/* Alerta Inteligente IA */}
        <div className="bg-valle-black rounded-xl shadow-md p-6 border border-valle-black-light text-white flex flex-col justify-between">
          <div>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
              <div className="flex items-center">
                <Brain className="text-valle-gold mr-3 animate-pulse shrink-0" size={24} />
                <h3 className="font-bold text-lg leading-tight">Análisis Predictivo IA</h3>
              </div>

              {/* Selector de Temporalidad y Botón de Recarga Premium */}
              <div className="flex items-center gap-2 w-full xl:w-auto justify-center xl:justify-end">
                <div className="flex flex-1 xl:flex-none justify-between gap-1 p-1 bg-[#1a1a1a] sm:bg-valle-black-light/60 border border-slate-800 rounded-lg text-xs font-bold">
                  {['diario', 'semanal', 'mensual', 'anual'].map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setTemporalidad(temp)}
                      className={`focus:outline-none flex-1 px-1 sm:px-3 py-1 rounded-md text-center capitalize transition cursor-pointer text-[10px] sm:text-xs whitespace-nowrap ${
                        temporalidad === temp
                          ? 'bg-valle-green text-valle-gold shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {temp}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => cargarAnalisisIa(actualAtletaId || datos?.perfil?.atleta_id, temporalidad, true)}
                  disabled={cargandoIa}
                  className="p-1.5 sm:p-2 bg-valle-black-light border border-slate-700 hover:border-valle-gold rounded-lg text-slate-300 hover:text-valle-gold transition cursor-pointer shrink-0"
                  title="Recalcular análisis"
                >
                  <RefreshCw size={14} className={`${cargandoIa ? 'animate-spin text-valle-green' : ''}`} />
                </button>
              </div>
            </div>

            {cargandoIa ? (
              <div className="flex flex-col items-center justify-center text-center py-8 bg-valle-black-light/30 border border-slate-800/50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-valle-gold mb-3"></div>
                <p className="text-xs text-slate-400 font-bold">Generando análisis con IA...</p>
              </div>
            ) : errorIa ? (
              <div className="flex flex-col items-center justify-center text-center py-8 bg-valle-black-light/30 border border-slate-800/50 rounded-lg">
                <AlertTriangle size={28} className="text-red-500 mb-2" />
                <p className="text-sm text-red-400 font-bold">Error de Conexión IA</p>
                <p className="text-xs text-red-500 mt-1">{errorIa}</p>
              </div>
            ) : analisisIa[temporalidad] ? (
              analisisIa[temporalidad].error ? (
                <div className="flex flex-col items-center justify-center text-center py-8 bg-valle-black-light/30 border border-slate-800/50 rounded-lg">
                  <AlertTriangle size={28} className="text-red-500 mb-2" />
                  <p className="text-sm text-red-400 font-bold">Error de la IA</p>
                  <p className="text-xs text-red-500 mt-1">{analisisIa[temporalidad].error}</p>
                </div>
              ) : (
                <div className="space-y-4 bg-valle-black-light/50 p-4 rounded-lg border border-slate-800 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-bold">Riesgo de Lesión:</span>
                    <span className={`font-black px-2.5 py-0.5 rounded text-xs shadow-sm ${
                      analisisIa[temporalidad].riesgo_lesion === 'Alto' ? 'bg-red-600 text-white border border-red-700' :
                      analisisIa[temporalidad].riesgo_lesion === 'Medio' ? 'bg-amber-600 text-white border border-amber-700' :
                      'bg-emerald-600 text-white border border-emerald-700'
                    }`}>
                      {analisisIa[temporalidad].riesgo_lesion}
                    </span>
                  </div>
                  <p className="text-slate-300 italic leading-relaxed">"{analisisIa[temporalidad].analisis}"</p>
                  <p className="font-bold text-valle-gold flex items-start gap-1.5 mt-2">
                    <span className="shrink-0 text-base">💡</span>
                    <span>{analisisIa[temporalidad].recomendacion}</span>
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 bg-valle-black-light/30 border border-slate-800/50 rounded-lg">
                <AlertTriangle size={28} className="text-slate-500 mb-2" />
                <p className="text-sm text-slate-400">No hay datos suficientes para generar este reporte.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Columna Historial Médico (Lesiones) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-valle-black text-sm mb-4 flex items-center">
          <Heart className="text-red-500 mr-2" size={18} />
          Historial Clínico de Lesiones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lesiones.length === 0 ? (
            <div className="col-span-full">
              <p className="text-xs text-slate-400 py-4">Sin historial de lesiones reportado.</p>
            </div>
          ) : (
            lesiones.map((l) => (
              <div key={l.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800 block mr-2 leading-tight">{l.tipo_lesion}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${l.gravedad === 'Leve' ? 'bg-blue-100 text-blue-700' :
                      l.gravedad === 'Media' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    }`}>{l.gravedad}</span>
                </div>
                {l.descripcion && <p className="text-slate-500 italic mb-2">"{l.descripcion}"</p>}
                <div className="text-xs text-slate-400 flex flex-col space-y-1 mt-auto">
                  <span>Inicio: {l.fecha_inicio}</span>
                  {l.fecha_alta ? (
                    <span className="text-valle-green font-semibold">Alta: {l.fecha_alta}</span>
                  ) : (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-red-600 font-semibold animate-pulse">En Recuperación</span>
                      {esCuerpoTecnico && (
                        <button
                          onClick={() => {
                            setFechaAlta(new Date().toISOString().split('T')[0]);
                            setRehabilitacionAlta('');
                            setMostrarAltaModal(l);
                          }}
                          className="px-2 py-1 bg-valle-green text-valle-gold rounded-md hover:bg-valle-green-dark transition text-[10px] font-black cursor-pointer shadow-xs"
                        >
                          Dar Alta Médica
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {l.rehabilitacion && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <strong className="text-slate-700">Rehabilitación:</strong> {l.rehabilitacion}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historial Nutricional y de Descanso (Litros, Comidas, Sueño) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-valle-black text-sm mb-4">Registro Histórico de Nutrición e Hidratación</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Comidas / Día</th>
                <th className="py-3 px-4">Hidratación (Litros)</th>
                <th className="py-3 px-4">Descanso / Calidad</th>
                <th className="py-3 px-4">Suplementación</th>
              </tr>
            </thead>
            <tbody>
              {habitos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Ningún registro nutricional cargado aún.</td>
                </tr>
              ) : (
                habitos.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-700 flex items-center">
                      <Calendar size={13} className="text-slate-400 mr-2" />
                      {h.fecha}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{h.frecuencia_comidas} comidas</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-bold text-slate-700 mr-2">{h.hidratacion_litros} L</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-valle-green h-full"
                            style={{ width: `${Math.min(100, (h.hidratacion_litros / 3.0) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${h.calidad_descanso >= 8 ? 'bg-valle-green-light/20 text-valle-green-dark' :
                          h.calidad_descanso >= 5 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>{h.calidad_descanso}h</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{h.suplementacion || 'Ninguna'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: DIARIO NUTRICIONAL ================= */}
      {mostrarHabitoModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-visible animate-fadeIn relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center tracking-tight font-display">
                <Heart className="mr-2.5 text-valle-green" size={20} /> Registro Diario de Hábitos
              </h3>
              <button onClick={() => setMostrarHabitoModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={manejarGuardarHabito} className="p-6 space-y-5 text-sm font-medium text-slate-700 bg-slate-50/50 rounded-b-2xl">

              {/* Dieta Asignada Informativa */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Dieta Asignada:</span>
                <span className="font-black text-valle-green">
                  {datos.perfil?.dieta_asignada?.nombre || 'Ninguna'}
                </span>
              </div>

              {/* Comidas al día */}
              <div>
                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-xs font-bold">
                  Comidas al día
                </label>
                <CustomSelect
                  value={frecuenciaComidas}
                  onChange={(e) => setFrecuenciaComidas(parseInt(e.target.value))}
                  options={[
                    { value: 2, label: "2 comidas" },
                    { value: 3, label: "3 comidas" },
                    { value: 4, label: "4 comidas" },
                    { value: 5, label: "5 comidas" },
                    { value: 6, label: "6 comidas" }
                  ]}
                />
              </div>

              {/* Fila agrupada: Hidratación y Descanso */}
              <div className="grid grid-cols-2 gap-4">
                {/* Hidratación */}
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] sm:text-xs font-bold">
                    Hidratación (Litros)
                  </label>
                  <CustomSelect
                    value={hidratacion}
                    onChange={(e) => setHidratacion(parseFloat(e.target.value))}
                    options={[
                      { value: 0, label: "0 Litros" },
                      { value: 0.5, label: "0.5 Litros" },
                      { value: 1.0, label: "1.0 Litros" },
                      { value: 1.5, label: "1.5 Litros" },
                      { value: 2.0, label: "2.0 Litros" },
                      { value: 2.5, label: "2.5 Litros" },
                      { value: 3.0, label: "3.0 Litros" },
                      { value: 3.5, label: "3.5 Litros" },
                      { value: 4.0, label: "4.0 Litros" },
                      { value: 4.5, label: "4.5 Litros" },
                      { value: 5.0, label: "5.0+ Litros" }
                    ]}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">Ej: 2.5 o 3.0 al día.</p>
                </div>

                {/* Calidad del descanso */}
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] sm:text-xs font-bold">
                    Horas de Sueño
                  </label>
                  <CustomSelect
                    value={calidadDescanso}
                    onChange={(e) => setCalidadDescanso(parseInt(e.target.value))}
                    options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
                      value: num,
                      label: num === 10 ? '10+ horas' : num === 1 ? '1 hora' : `${num} horas`
                    }))}
                  />
                </div>
              </div>

              {/* Suplementación */}
              <div>
                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-xs font-bold">
                  Suplementación Diaria
                </label>
                <input
                  type="text"
                  placeholder="Ej: Creatina, Proteína, Ninguna..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium"
                  value={suplementacion}
                  onChange={(e) => setSuplementacion(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={guardandoHabito}
                className="w-full py-3 bg-valle-green text-white rounded-xl text-sm font-bold hover:bg-valle-green-dark transition-all duration-200 shadow-lg shadow-valle-green/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center mt-4"
              >
                {guardandoHabito ? 'Guardando...' : 'Guardar Registro Diario'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORTAR LESIÓN (COACH) ================= */}
      {mostrarLesionModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-visible animate-fadeIn relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center tracking-tight font-display">
                <ShieldAlert className="mr-2.5 text-red-500" size={20} /> Reportar Lesión Deportiva
              </h3>
              <button onClick={() => setMostrarLesionModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={manejarGuardarLesion} className="p-6 space-y-5 bg-slate-50/50 rounded-b-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gravedad</label>
                  <CustomSelect
                    value={gravedad}
                    onChange={(e) => setGravedad(e.target.value)}
                    options={["Leve", "Media", "Grave"]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Lesión</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Lesión</label>
                <input
                  type="text"
                  placeholder="Ej: Esguince tobillo, Contractura isquiotibial..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green"
                  value={tipoLesion}
                  onChange={(e) => setTipoLesion(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción / Observaciones</label>
                <textarea
                  placeholder="Describir las circunstancias o diagnóstico inicial..."
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green resize-none"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plan de Rehabilitación Inicial</label>
                <textarea
                  placeholder="Ej: Reposo 3 días, fisioterapia, hielo..."
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green resize-none"
                  value={rehabilitacion}
                  onChange={(e) => setRehabilitacion(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={guardandoLesion}
                className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center mt-4"
              >
                {guardandoLesion ? 'Guardando...' : 'Reportar Baja Médica'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DAR DE ALTA MÉDICA (COACH) ================= */}
      {mostrarAltaModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-visible animate-fadeIn relative">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold rounded-t-xl">
              <h3 className="font-black text-sm flex items-center">
                <Check className="mr-2" size={16} /> Procesar Alta Médica
              </h3>
              <button onClick={() => setMostrarAltaModal(null)} className="text-valle-gold/80 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={manejarAltaLesion} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Registra el alta médica para la lesión de <strong className="text-slate-700">{mostrarAltaModal.tipo_lesion}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Alta</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  value={fechaAlta}
                  onChange={(e) => setFechaAlta(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reporte de Rehabilitación final</label>
                <textarea
                  placeholder="Detalles de la recuperación del atleta y reincorporación a cargas..."
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green resize-none"
                  value={rehabilitacionAlta}
                  onChange={(e) => setRehabilitacionAlta(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={guardandoAlta}
                className="w-full py-2.5 bg-valle-green text-valle-gold rounded-lg text-xs font-black hover:bg-valle-green-dark transition shadow-md disabled:opacity-50"
              >
                {guardandoAlta ? 'Guardando...' : 'Confirmar Alta Médica'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
