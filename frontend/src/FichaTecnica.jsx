import { useState, useEffect } from 'react';
import api from './api';
import {
  User, Activity, Scale, Droplet, Moon, Brain, AlertTriangle,
  Plus, Check, ChevronLeft, Calendar, Heart, ShieldAlert, X, Apple
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomSelect from './components/ui/CustomSelect';

export default function FichaTecnica({ atletaId = null, onBack = null, crearNotificacion = null }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Roles de usuario
  const rol = localStorage.getItem('rol_usuario') || 'atleta';
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
      const tieneHoy = habitos.length > 0 && habitos[0].fecha === hoyStr;
      if (tieneHoy) {
        setFrecuenciaComidas(habitos[0].frecuencia_comidas);
        setSuplementacion(habitos[0].suplementacion || 'Ninguna');
        setHidratacion(habitos[0].hidratacion_litros);
        setCalidadDescanso(habitos[0].calidad_descanso);
      } else {
        setFrecuenciaComidas(4);
        setSuplementacion('Ninguna');
        setHidratacion(2.0);
        setCalidadDescanso(7);
      }
    }
  }, [mostrarHabitoModal, habitos]);

  // Guardar hábitos diarios
  const manejarGuardarHabito = async (e) => {
    e.preventDefault();
    if (!actualAtletaId) return;
    setGuardandoHabito(true);

    try {
      await api.post(`/atletas/${actualAtletaId}/habitos-nutricionales`, {
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
  const habitosDeHoyRegistrados = habitos.length > 0 && habitos[0].fecha === hoyStr;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

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
          <div className="w-16 h-16 rounded-full bg-valle-green/10 border-2 border-valle-gold flex items-center justify-center text-valle-green font-black text-2xl">
            {datos.perfil ? datos.perfil.atleta_id : 'AJ'}
          </div>
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

      {/* Alerta de Hábitos Diarios */}
      {habitosDeHoyRegistrados ? (
        <div className="bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-600 p-4 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2.5 shadow-sm">
          <Check className="text-emerald-600 shrink-0" size={18} />
          <div>
            <p className="font-bold text-sm">Hábitos de hoy: Completados ✅</p>
            <p className="text-slate-655 font-medium mt-0.5">
              {!esCuerpoTecnico && !atletaId
                ? "Ya has reportado tu descanso, alimentación e hidratación de hoy. Puedes actualizarlo si es necesario."
                : "El atleta ya ha registrado sus hábitos e hidratación para el día de hoy."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 border-l-4 border-l-amber-500 p-4 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="text-amber-600 shrink-0 animate-pulse" size={18} />
          <div>
            <p className="font-bold text-sm">Hábitos de hoy: Pendientes de registrar ⚠️</p>
            <p className="text-slate-655 font-medium mt-0.5">
              {!esCuerpoTecnico && !atletaId
                ? "Por favor, registra tus hábitos diarios para hoy. Es indispensable para el seguimiento nutricional del club."
                : "El atleta aún no ha registrado su reporte diario de hábitos de hoy."}
            </p>
          </div>
        </div>
      )}

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peso / IMC Actual</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.estado_fisico?.peso_actual} <span className="text-sm font-medium text-slate-400">kg</span>
            </p>
            <p className="text-xs text-valle-green-light font-semibold mt-1">IMC: {datos.estado_fisico?.imc_actual}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Scale className="text-valle-gold" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descanso Promedio</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.habitos_semanales?.promedio_descanso || 0} <span className="text-sm font-medium text-slate-400">/ 10</span>
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Últimos 3 registros</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Moon className="text-valle-gold" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hidratación Promedio</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.habitos_semanales?.promedio_hidratacion || 0} <span className="text-sm font-medium text-slate-400">L</span>
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Meta diaria: 3L</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Droplet className="text-valle-gold" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial Sesiones</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.cargas_historicas?.length || 0}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Entrenamientos evaluados</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Activity className="text-valle-gold" size={24} />
          </div>
        </div>
      </div>

      {/* Alerta Inteligente IA */}
      {datos.alerta_ia && (
        <div className="bg-valle-black rounded-xl shadow-md p-6 border border-valle-black-light text-white">
          <div className="flex items-center mb-3">
            <Brain className="text-valle-gold mr-3" size={24} />
            <h3 className="font-bold text-lg">Recomendación de Prevención IA</h3>
          </div>
          {typeof datos.alerta_ia === 'object' ? (
            <div className="space-y-3 bg-valle-black-light/50 p-4 rounded-lg border border-slate-800 text-sm">
              <p className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span>Riesgo Estimado:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${datos.alerta_ia.riesgo_lesion === 'Alto' ? 'bg-red-500 text-white' :
                    datos.alerta_ia.riesgo_lesion === 'Medio' ? 'bg-amber-500 text-white' :
                      'bg-green-500 text-white'
                  }`}>{datos.alerta_ia.riesgo_lesion}</span>
              </p>
              <p className="text-slate-300 italic">"{datos.alerta_ia.analisis}"</p>
              <p className="font-bold text-valle-gold">💡 {datos.alerta_ia.recomendacion}</p>
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-valle-black-light/50 p-4 rounded-lg border border-slate-800">
              {datos.alerta_ia}
            </p>
          )}
        </div>
      )}

      {/* Gráfico y Diarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna Gráfica de Rendimiento */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <h3 className="font-bold text-valle-black text-sm mb-4">Evolución de Cargas Físicas</h3>
          {datos.cargas_historicas && datos.cargas_historicas.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
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
            <div className="h-72 flex items-center justify-center text-slate-400 text-xs">Sin cargas registradas recientemente.</div>
          )}
          <div className="flex justify-center space-x-6 mt-2 pt-2 border-t border-slate-50">
            <div className="flex items-center text-xs font-semibold text-slate-500"><div className="w-2.5 h-2.5 bg-valle-gold rounded-full mr-2"></div> Potencia (Salto)</div>
            <div className="flex items-center text-xs font-semibold text-slate-500"><div className="w-2.5 h-2.5 bg-valle-green rounded-full mr-2"></div> Fatiga (RPE)</div>
          </div>
        </div>

        {/* Columna Historial Médico (Lesiones) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-valle-black text-sm mb-4 flex items-center">
              <Heart className="text-red-500 mr-2" size={18} />
              Historial Clínico de Lesiones
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
              {lesiones.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Sin historial de lesiones reportado.</p>
              ) : (
                lesiones.map((l) => (
                  <div key={l.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{l.tipo_lesion}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.gravedad === 'Leve' ? 'bg-blue-100 text-blue-700' :
                          l.gravedad === 'Media' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>{l.gravedad}</span>
                    </div>
                    {l.descripcion && <p className="text-slate-500 italic">"{l.descripcion}"</p>}
                    <div className="text-xs text-slate-400 flex flex-col space-y-0.5">
                      <span>Inicio: {l.fecha_inicio}</span>
                      {l.fecha_alta ? (
                        <span className="text-valle-green font-semibold">Alta: {l.fecha_alta}</span>
                      ) : (
                        <span className="text-red-600 font-semibold animate-pulse">En Recuperación</span>
                      )}
                    </div>
                    {l.rehabilitacion && (
                      <div className="mt-1 pt-1.5 border-t border-slate-200 text-xs text-slate-600">
                        <strong className="text-slate-700">Rehabilitación:</strong> {l.rehabilitacion}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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
                        }`}>{h.calidad_descanso} / 10</span>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
              <h3 className="font-black text-sm flex items-center">
                <Heart className="mr-2" size={16} /> Registro Diario de Hábitos
              </h3>
              <button onClick={() => setMostrarHabitoModal(false)} className="text-valle-gold/80 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={manejarGuardarHabito} className="p-5 space-y-4 text-xs font-semibold text-slate-700">

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

              {/* Hidratación */}
              <div>
                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-xs font-bold">
                  Hidratación (Litros de agua)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium"
                  value={hidratacion}
                  onChange={(e) => setHidratacion(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-slate-400 mt-1 font-medium">Ejemplo: 2.5 o 3.0 litros al día.</p>
              </div>

              {/* Calidad del descanso */}
              <div>
                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-xs font-bold">
                  Calidad del Descanso (Escala 1 al 10)
                </label>
                <CustomSelect
                  value={calidadDescanso}
                  onChange={(e) => setCalidadDescanso(parseInt(e.target.value))}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
                    value: num,
                    label: `${num} - ${num <= 4 ? 'Bajo (Fatiga Física)' :
                        num <= 6 ? 'Regular (Descanso Incompleto)' :
                          num <= 8 ? 'Bueno (Óptimo)' :
                            'Excelente (Recuperación Completa)'
                      }`
                  }))}
                />
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
                className="w-full py-2.5 bg-valle-green text-valle-gold rounded-lg text-xs font-black hover:bg-valle-green-dark transition shadow-md disabled:opacity-50 flex items-center justify-center mt-2"
              >
                {guardandoHabito ? 'Guardando...' : 'Guardar Registro Diario'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORTAR LESIÓN (COACH) ================= */}
      {mostrarLesionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-600 text-white">
              <h3 className="font-black text-sm flex items-center">
                <ShieldAlert className="mr-2" size={16} /> Reportar Lesión Deportiva
              </h3>
              <button onClick={() => setMostrarLesionModal(false)} className="text-white/80 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={manejarGuardarLesion} className="p-5 space-y-4">
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
                className="w-full py-2.5 bg-red-600 text-white rounded-lg text-xs font-black hover:bg-red-700 transition shadow-md disabled:opacity-50"
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
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
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
