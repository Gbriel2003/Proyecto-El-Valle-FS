import { useState, useEffect } from 'react';
import api from './api';
import {
  Apple, Scale, Droplet, Moon, Search, Activity, User,
  Calendar, Award, Plus, Loader2, ClipboardList, Check, TrendingUp
} from 'lucide-react';
import CustomSelect from './components/ui/CustomSelect';

export default function ControlNutricional({ crearNotificacion = null }) {
  const [jugadores, setJugadores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoJugadores, setCargandoJugadores] = useState(true);
  const [atletaSeleccionado, setAtletaSeleccionado] = useState(null);

  // Historiales del atleta seleccionado
  const [biometriaHistorial, setBiometriaHistorial] = useState([]);
  const [habitosHistorial, setHabitosHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [tabHistorial, setTabHistorial] = useState('biometria'); // 'biometria' o 'habitos'

  // Estados de formularios
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [frecuenciaComidas, setFrecuenciaComidas] = useState(4);
  const [hidratacionLitros, setHidratacionLitros] = useState(2.5);
  const [calidadDescanso, setCalidadDescanso] = useState(7);
  const [suplementacion, setSuplementacion] = useState('');
  const [planAlimentacion, setPlanAlimentacion] = useState('Menú de recuperación');
  const [tabPrincipal, setTabPrincipal] = useState('atletas'); // 'atletas' o 'dietas'
  const [dietas, setDietas] = useState([]);
  const [cargandoDietas, setCargandoDietas] = useState(false);
  const [nombreDieta, setNombreDieta] = useState('');
  const [descripcionDieta, setDescripcionDieta] = useState('');
  const [caloriasDieta, setCaloriasDieta] = useState('');
  const [dietaSeleccionada, setDietaSeleccionada] = useState(null);
  const [guardandoDieta, setGuardandoDieta] = useState(false);
  const [dietaDetalleModal, setDietaDetalleModal] = useState(null);

  const [guardandoBiometria, setGuardandoBiometria] = useState(false);
  const [guardandoHabitos, setGuardandoHabitos] = useState(false);
  const [asignandoDieta, setAsignandoDieta] = useState(false);

  // IMC Calculado en vivo
  const [imcCalculado, setImcCalculado] = useState(null);
  const [imcEstado, setImcEstado] = useState({ texto: 'N/A', color: 'text-slate-400' });

  // Cargar lista de atletas
  const cargarAtletas = async () => {
    try {
      setCargandoJugadores(true);
      const res = await api.get('/atletas/');
      if (Array.isArray(res.data)) {
        setJugadores(res.data);
      }
    } catch (err) {
      console.error("Error al cargar atletas:", err);
      if (crearNotificacion) {
        crearNotificacion("Error", "No se pudo cargar la plantilla de jugadores.", "error");
      }
    } finally {
      setCargandoJugadores(false);
    }
  };

  const cargarDietas = async () => {
    try {
      setCargandoDietas(true);
      const res = await api.get('/dietas/');
      if (Array.isArray(res.data)) {
        setDietas(res.data);
      }
    } catch (err) {
      console.error("Error al cargar dietas:", err);
    } finally {
      setCargandoDietas(false);
    }
  };

  const seleccionarDietaParaEditar = (dieta) => {
    setDietaSeleccionada(dieta);
    setNombreDieta(dieta.nombre);
    setDescripcionDieta(dieta.descripcion);
    setCaloriasDieta(dieta.calorias || '');
  };

  const prepararNuevaDieta = () => {
    setDietaSeleccionada(null);
    setNombreDieta('');
    setDescripcionDieta('');
    setCaloriasDieta('');
  };

  const handleGuardarDieta = async (e) => {
    e.preventDefault();
    if (!nombreDieta.trim() || !descripcionDieta.trim()) {
      alert("Nombre y descripción son requeridos.");
      return;
    }

    try {
      setGuardandoDieta(true);
      const payload = {
        nombre: nombreDieta.trim(),
        descripcion: descripcionDieta.trim(),
        calorias: caloriasDieta ? parseInt(caloriasDieta) : null
      };
      await api.post('/dietas/', payload);

      if (crearNotificacion) {
        crearNotificacion(
          "Dieta Guardada",
          `La dieta "${nombreDieta}" se ha guardado en la biblioteca.`,
          "success"
        );
      }

      prepararNuevaDieta();
      cargarDietas();
    } catch (err) {
      console.error("Error al guardar dieta:", err);
      alert("Error al guardar la propuesta de dieta.");
    } finally {
      setGuardandoDieta(false);
    }
  };

  const handleEliminarDieta = async (dietaId) => {
    if (!dietaId) return;
    if (!window.confirm("¿Estás seguro de eliminar esta propuesta de dieta de la biblioteca? Los registros anteriores seguirán mostrando el nombre pero no los detalles.")) return;

    try {
      await api.delete(`/dietas/${dietaId}`);
      if (crearNotificacion) {
        crearNotificacion(
          "Dieta Eliminada",
          "La dieta se eliminó de la biblioteca.",
          "info"
        );
      }
      prepararNuevaDieta();
      cargarDietas();
    } catch (err) {
      console.error("Error al eliminar dieta:", err);
      alert("Error al eliminar la dieta.");
    }
  };

  const mostrarDetalleDietaPorNombre = (nombre) => {
    const found = dietas.find(d => d.nombre.toLowerCase() === nombre.toLowerCase());
    if (found) {
      setDietaDetalleModal(found);
    } else {
      setDietaDetalleModal({
        nombre,
        descripcion: "Detalles específicos de este plan no disponibles en la biblioteca actual."
      });
    }
  };

  useEffect(() => {
    cargarAtletas();
    cargarDietas();
  }, []);

  useEffect(() => {
    if (dietas.length > 0 && !dietas.some(d => d.nombre === planAlimentacion)) {
      setPlanAlimentacion(dietas[0].nombre);
    }
  }, [dietas]);

  // Cargar historial médico/nutricional de atleta seleccionado
  const cargarHistorial = async (atletaId) => {
    if (!atletaId) return;
    try {
      setCargandoHistorial(true);
      const [resBio, resHab] = await Promise.all([
        api.get(`/atletas/${atletaId}/biometria`).catch(() => ({ data: [] })),
        api.get(`/atletas/${atletaId}/habitos-nutricionales`).catch(() => ({ data: [] }))
      ]);
      setBiometriaHistorial(resBio.data || []);
      setHabitosHistorial(resHab.data || []);
    } catch (err) {
      console.error("Error al cargar historial nutricional:", err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Efecto cuando se selecciona un atleta (Cargar historial y datos biométricos base)
  useEffect(() => {
    if (atletaSeleccionado) {
      cargarHistorial(atletaSeleccionado.atleta_id);
      setPesoKg(atletaSeleccionado.peso_actual || atletaSeleccionado.peso_base || '');
      setAlturaCm(atletaSeleccionado.altura_base || 175);
    } else {
      setBiometriaHistorial([]);
      setHabitosHistorial([]);
    }
  }, [atletaSeleccionado]);

  // Pre-cargar valores de hábitos diarios cuando cambia el historial de hábitos
  useEffect(() => {
    if (atletaSeleccionado) {
      const hoyStr = new Date().toLocaleDateString('sv');
      const tieneHoy = habitosHistorial.length > 0 && habitosHistorial[0].fecha === hoyStr;
      if (tieneHoy) {
        setFrecuenciaComidas(habitosHistorial[0].frecuencia_comidas);
        setSuplementacion(habitosHistorial[0].suplementacion || '');
        setHidratacionLitros(habitosHistorial[0].hidratacion_litros);
        setCalidadDescanso(habitosHistorial[0].calidad_descanso);
        if (habitosHistorial[0].plan_alimentacion) {
          setPlanAlimentacion(habitosHistorial[0].plan_alimentacion);
        }
      } else {
        setFrecuenciaComidas(4);
        setSuplementacion('');
        setHidratacionLitros(2.5);
        setCalidadDescanso(7);
        if (atletaSeleccionado.dieta_asignada_nombre) {
          setPlanAlimentacion(atletaSeleccionado.dieta_asignada_nombre);
        } else if (dietas.length > 0) {
          setPlanAlimentacion(dietas[0].nombre);
        }
      }
    }
  }, [habitosHistorial, atletaSeleccionado, dietas]);

  // Recalcular el IMC en vivo
  useEffect(() => {
    const peso = parseFloat(pesoKg);
    const altura = parseFloat(alturaCm);
    if (peso > 20 && altura > 100) {
      const altM = altura / 100;
      const imc = round(peso / (altM * altM), 2);
      setImcCalculado(imc);

      if (imc < 18.5) {
        setImcEstado({ texto: 'Bajo Peso', color: 'text-sky-500 bg-sky-50 border-sky-100' });
      } else if (imc < 25) {
        setImcEstado({ texto: 'Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' });
      } else if (imc < 30) {
        setImcEstado({ texto: 'Sobrepeso', color: 'text-amber-600 bg-amber-50 border-amber-100' });
      } else {
        setImcEstado({ texto: 'Obesidad', color: 'text-rose-600 bg-rose-50 border-rose-100' });
      }
    } else {
      setImcCalculado(null);
      setImcEstado({ texto: 'N/A', color: 'text-slate-400 bg-slate-50 border-slate-100' });
    }
  }, [pesoKg, alturaCm]);

  const round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  const handleAsignarDieta = async (dietaIdVal) => {
    if (!atletaSeleccionado) return;
    try {
      setAsignandoDieta(true);
      const dietaId = dietaIdVal ? parseInt(dietaIdVal) : null;

      const params = {};
      if (dietaId !== null) {
        params.dieta_id = dietaId;
      }

      const res = await api.put(`/atletas/${atletaSeleccionado.atleta_id}/dieta`, null, { params });

      const updatedAtleta = {
        ...atletaSeleccionado,
        dieta_asignada_id: res.data.dieta_asignada_id,
        dieta_asignada_nombre: res.data.dieta_asignada_nombre
      };

      setAtletaSeleccionado(updatedAtleta);
      setJugadores(prev => prev.map(j => j.atleta_id === atletaSeleccionado.atleta_id ? updatedAtleta : j));

      if (res.data.dieta_asignada_nombre) {
        setPlanAlimentacion(res.data.dieta_asignada_nombre);
      }

      if (crearNotificacion) {
        crearNotificacion(
          "Dieta Asignada",
          res.data.dieta_asignada_nombre
            ? `Se ha asignado la dieta "${res.data.dieta_asignada_nombre}" a ${atletaSeleccionado.nombre} ${atletaSeleccionado.apellido}.`
            : `Se ha retirado la dieta asignada a ${atletaSeleccionado.nombre} ${atletaSeleccionado.apellido}.`,
          "success"
        );
      }
    } catch (err) {
      console.error("Error al asignar dieta:", err);
      alert("Error al asignar la dieta al jugador.");
    } finally {
      setAsignandoDieta(false);
    }
  };

  // Filtrar lista de jugadores según buscador
  const jugadoresFiltrados = jugadores.filter(j => {
    const nombreCompleto = `${j.nombre || ''} ${j.apellido || ''}`.toLowerCase();
    return nombreCompleto.includes(busqueda.toLowerCase());
  });

  // Guardar datos biométricos (Peso y Altura)
  const handleGuardarBiometria = async (e) => {
    e.preventDefault();
    if (!atletaSeleccionado) return;
    if (!pesoKg || !alturaCm) {
      alert("Por favor completa el peso y la altura.");
      return;
    }

    try {
      setGuardandoBiometria(true);
      await api.post(`/atletas/${atletaSeleccionado.atleta_id}/biometria`, {
        peso_kg: parseFloat(pesoKg),
        altura_cm: parseFloat(alturaCm)
      });

      if (crearNotificacion) {
        crearNotificacion(
          "Biometría Registrada",
          `Peso y altura de ${atletaSeleccionado.nombre} guardados correctamente.`,
          "success"
        );
      }

      // Actualizar listados
      cargarHistorial(atletaSeleccionado.atleta_id);
      cargarAtletas(); // Para actualizar los valores en la lista
    } catch (err) {
      console.error(err);
      alert("Error al registrar la biometría semanal.");
    } finally {
      setGuardandoBiometria(false);
    }
  };

  // Guardar hábitos y plan nutricional
  const handleGuardarHabitos = async (e) => {
    e.preventDefault();
    if (!atletaSeleccionado) return;

    try {
      setGuardandoHabitos(true);
      await api.post(`/atletas/${atletaSeleccionado.atleta_id}/habitos-nutricionales`, {
        fecha: new Date().toLocaleDateString('sv'),
        frecuencia_comidas: parseInt(frecuenciaComidas),
        suplementacion: suplementacion.trim() || 'Ninguna',
        hidratacion_litros: parseFloat(hidratacionLitros),
        calidad_descanso: parseInt(calidadDescanso),
        plan_alimentacion: planAlimentacion
      });

      if (crearNotificacion) {
        crearNotificacion(
          "Hábitos y Plan Asignados",
          `Plan nutricional de ${atletaSeleccionado.nombre} actualizado.`,
          "success"
        );
      }

      // Limpiar campos de hábitos después de guardar
      setSuplementacion('');

      // Actualizar historial
      cargarHistorial(atletaSeleccionado.atleta_id);
    } catch (err) {
      console.error(err);
      alert("Error al registrar los hábitos nutricionales.");
    } finally {
      setGuardandoHabitos(false);
    }
  };

  return (
    <div className="w-full mx-auto pb-12 space-y-6 animate-fade-in-up px-2 sm:px-4 lg:px-6">

      {/* CABECERA */}
      <div className="bg-linear-to-r from-white via-slate-50/50 to-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-valle-green flex items-center justify-center shadow-md border border-valle-gold/20 shrink-0">
            <Apple size={20} className="text-valle-gold" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg font-display leading-tight">Control Nutricional & Biometría</h2>
            <p className="text-xs text-slate-500 mt-0.5">Asignación de Dietas, Control de Hábitos y Seguimiento de Peso</p>
          </div>
        </div>
      </div>

      {/* TABS PRINCIPALES */}
      <div className="flex flex-wrap bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setTabPrincipal('atletas')}
          className={`pb-2 px-3 text-sm font-bold transition-all relative flex items-center cursor-pointer ${tabPrincipal === 'atletas'
              ? 'text-valle-green border-b-2 border-valle-green font-extrabold'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Activity size={18} className="mr-2" /> Control de Atletas
        </button>
        <button
          type="button"
          onClick={() => setTabPrincipal('dietas')}
          className={`pb-2 px-3 text-sm font-bold transition-all relative flex items-center cursor-pointer ${tabPrincipal === 'dietas'
              ? 'text-valle-green border-b-2 border-valle-green font-extrabold'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Apple size={18} className="mr-2" /> Biblioteca de Dietas
        </button>
      </div>

      {tabPrincipal === 'atletas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* COLUMNA SELECCIONADOR DE JUGADORES (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col max-h-[700px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-sm font-bold text-slate-850 tracking-tight font-display block mb-3">Lista de Jugadores</span>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar jugador..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 transition-all duration-200 font-semibold"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {cargandoJugadores ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto text-valle-green mb-2" size={20} />
                  <p className="text-sm font-semibold">Cargando plantilla...</p>
                </div>
              ) : jugadoresFiltrados.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-12 font-medium">No se encontraron jugadores.</p>
              ) : (
                jugadoresFiltrados.map((j) => {
                  const esActivo = atletaSeleccionado?.atleta_id === j.atleta_id;
                  return (
                    <button
                      key={j.atleta_id}
                      onClick={() => setAtletaSeleccionado(j)}
                      className={`w-full text-left p-3.5 rounded-xl transition flex items-center justify-between group ${esActivo
                          ? 'bg-linear-to-r from-valle-green/8 to-valle-green/4 border-l-4 border-valle-green text-valle-green font-bold pl-2.5'
                          : 'hover:bg-slate-50 text-slate-700 font-medium pl-3'
                        }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-display uppercase border shrink-0 ${esActivo
                            ? 'bg-valle-green text-white border-valle-green'
                            : 'bg-slate-100 text-slate-700 border-slate-200/80 group-hover:bg-valle-green group-hover:text-white group-hover:border-valle-green transition border-dashed'
                          }`}>
                          {j.nombre.charAt(0)}{j.apellido.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-slate-800">{j.nombre} {j.apellido}</p>
                          <p className="text-xs text-slate-450 font-medium truncate capitalize mt-0.5">{j.posicion}</p>
                        </div>
                      </div>
                      {j.peso_actual && (
                        <span className="text-xs font-bold text-slate-650 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/60 shrink-0">
                          {j.peso_actual} kg
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DETALLE Y FORMULARIOS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            {!atletaSeleccionado ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
                <Apple size={48} className="text-slate-350 stroke-1 mb-4 animate-bounce" />
                <p className="text-sm font-bold text-slate-650">Ningún jugador seleccionado</p>
                <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed font-medium">Selecciona un atleta de la lista de la izquierda para comenzar a registrar su biometría o asignarle hábitos nutricionales.</p>
              </div>
            ) : (
              <>
                {/* FICHA RESUMEN DE JUGADOR */}
                <div className="bg-linear-to-br from-valle-green to-[#0f3016] text-white p-6 rounded-2xl shadow-md border border-valle-gold/10 relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Contenedor de desbordamiento para el fondo */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    {/* Decoración de fondo */}
                    <div className="absolute right-0 bottom-0 opacity-10 select-none translate-x-1/4 translate-y-1/4">
                      <Apple size={180} className="text-white" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 z-10">
                    <div className="w-20 h-20 bg-white/10 rounded-full border-2 border-valle-gold/50 flex items-center justify-center text-white font-black text-2xl font-display uppercase shadow-inner">
                      {atletaSeleccionado.nombre.charAt(0)}{atletaSeleccionado.apellido.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-2xl tracking-tight font-display">{atletaSeleccionado.nombre} {atletaSeleccionado.apellido}</h3>
                      <p className="text-xs text-valle-gold font-bold tracking-wider uppercase mt-0.5">{atletaSeleccionado.posicion}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-xs text-white/95 font-bold uppercase tracking-wider">Dieta:</span>
                        <CustomSelect
                          value={atletaSeleccionado.dieta_asignada_id || ''}
                          disabled={asignandoDieta}
                          onChange={(e) => handleAsignarDieta(e.target.value)}
                          variant="dark"
                          className="max-w-xs inline-block"
                          placeholder="Sin dieta asignada"
                          options={[
                            { value: "", label: "Sin dieta asignada" },
                            ...dietas.map(d => ({ value: d.id, label: `${d.nombre} (${d.calorias || 'N/A'} kcal)` }))
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 z-10 text-base">
                    <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-xs">
                      <span className="text-xs text-white/80 block font-bold uppercase">Peso Fichaje</span>
                      <span className="font-black text-base text-valle-gold mt-0.5 block">{atletaSeleccionado.peso_base ? `${atletaSeleccionado.peso_base} kg` : 'N/A'}</span>
                    </div>
                    <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-xs">
                      <span className="text-xs text-white/80 block font-bold uppercase">Peso Actual</span>
                      <span className="font-black text-base text-white mt-0.5 block">{atletaSeleccionado.peso_actual ? `${atletaSeleccionado.peso_actual} kg` : 'N/A'}</span>
                    </div>
                    <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-xs">
                      <span className="text-xs text-white/80 block font-bold uppercase">Altura Base</span>
                      <span className="font-black text-base text-white mt-0.5 block">{atletaSeleccionado.altura_base ? `${atletaSeleccionado.altura_base} cm` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* FORMULARIOS DE REGISTRO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* FORMULARIO 1: REGISTRO BIOMÉTRICO (PESO Y ALTURA) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <Scale size={20} className="text-valle-green" />
                      <span className="text-sm font-bold text-slate-850 tracking-tight font-display">Biometría Semanal</span>
                    </div>

                    <form onSubmit={handleGuardarBiometria} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Peso (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 74.5"
                            value={pesoKg}
                            onChange={(e) => setPesoKg(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green focus:ring-2 focus:ring-valle-green/10 transition-all font-semibold text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Altura (cm)</label>
                          <input
                            type="number"
                            step="0.5"
                            placeholder="e.g. 178"
                            value={alturaCm}
                            onChange={(e) => setAlturaCm(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green focus:ring-2 focus:ring-valle-green/10 transition-all font-semibold text-slate-800"
                            required
                          />
                        </div>
                      </div>

                      {/* IMC Calculado en vivo */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-sm font-medium">
                        <div>
                          <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">IMC Estimado</span>
                          <span className="text-base font-black text-slate-800 mt-0.5 block">{imcCalculado ? imcCalculado : 'Ingresa datos'}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${imcEstado.color}`}>
                          {imcEstado.texto}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={guardandoBiometria}
                        className="w-full py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer"
                      >
                        {guardandoBiometria ? (
                          <>
                            <Loader2 className="animate-spin mr-1.5" size={16} />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Plus size={16} className="mr-1.5" />
                            Registrar Biometría
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* FORMULARIO 2: REGISTRO DE HÁBITOS Y MENÚ */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <ClipboardList size={20} className="text-valle-green" />
                        <span className="text-sm font-bold text-slate-850 tracking-tight font-display">Hábitos y Plan Dietario</span>
                      </div>
                      {/* Indicador de hábitos de hoy */}
                      {(() => {
                        const hoyStr = new Date().toLocaleDateString('sv');
                        const tieneHoy = habitosHistorial.length > 0 && habitosHistorial[0].fecha === hoyStr;
                        if (tieneHoy) {
                          return (
                            <div className="py-1.5 px-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200/60 flex items-center gap-1.5 w-fit">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Hábitos de hoy: Registrados ✅
                            </div>
                          );
                        } else {
                          return (
                            <div className="py-1.5 px-3 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200/60 flex items-center gap-1.5 w-fit">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Hábitos de hoy: Pendientes ⚠️
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <form onSubmit={handleGuardarHabitos} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descanso (1-10)</label>
                          <CustomSelect
                            value={calidadDescanso}
                            onChange={(e) => setCalidadDescanso(parseInt(e.target.value))}
                            options={[...Array(10)].map((_, i) => ({
                              value: i + 1,
                              label: `${i + 1} - ${i + 1 <= 4 ? 'Malo' : i + 1 <= 7 ? 'Regular' : 'Excelente'}`
                            }))}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Hidratación (Litros)</label>
                          <CustomSelect
                            value={hidratacionLitros}
                            onChange={(e) => setHidratacionLitros(parseFloat(e.target.value))}
                            options={[
                              { value: 1.0, label: "1.0 Litro" },
                              { value: 1.5, label: "1.5 Litros" },
                              { value: 2.0, label: "2.0 Litros" },
                              { value: 2.5, label: "2.5 Litros" },
                              { value: 3.0, label: "3.0 Litros" },
                              { value: 3.5, label: "3.5 Litros" },
                              { value: 4.0, label: "4.0 Litros" },
                              { value: 4.5, label: "4.5 Litros" },
                              { value: 5.0, label: "5.0 Litros (Max)" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Comidas / Día</label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={frecuenciaComidas}
                            onChange={(e) => setFrecuenciaComidas(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green focus:ring-2 focus:ring-valle-green/10 transition-all font-semibold text-slate-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Menú Asignado</label>
                          <CustomSelect
                            value={planAlimentacion}
                            onChange={(e) => setPlanAlimentacion(e.target.value)}
                            options={
                              dietas.length > 0
                                ? dietas.map(d => ({ value: d.nombre, label: d.nombre }))
                                : [
                                  "Menú pre-partido",
                                  "Menú post-partido",
                                  "Menú de recuperación",
                                  "Plan de definición",
                                  "Plan de volumen"
                                ]
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Suplementación (Opcional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Creatina 5g, Suero de electrolitos"
                          value={suplementacion}
                          onChange={(e) => setSuplementacion(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green focus:ring-2 focus:ring-valle-green/10 transition-all font-semibold text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={guardandoHabitos}
                        className="w-full py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer"
                      >
                        {guardandoHabitos ? (
                          <>
                            <Loader2 className="animate-spin mr-1.5" size={16} />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check size={16} className="mr-1.5" />
                            Guardar Hábitos y Menú
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* HISTORIAL CLINICO/NUTRICIONAL */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">

                  {/* Selector de Tabs */}
                  <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-2.5 gap-2">
                    <button
                      onClick={() => setTabHistorial('biometria')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center cursor-pointer ${tabHistorial === 'biometria'
                          ? 'bg-white text-valle-green shadow-xs border border-slate-200/60 font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <Scale size={18} className="mr-2" /> Historial de Pesos (IMC)
                    </button>

                    <button
                      onClick={() => setTabHistorial('habitos')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center cursor-pointer ${tabHistorial === 'habitos'
                          ? 'bg-white text-valle-green shadow-xs border border-slate-200/60 font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <ClipboardList size={18} className="mr-2" /> Historial de Hábitos y Menú
                    </button>
                  </div>

                  {/* Contenido del Historial */}
                  <div className="p-4 overflow-x-auto min-h-48 max-h-72">
                    {cargandoHistorial ? (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mb-1 text-valle-green" size={24} />
                        <p className="text-base font-bold">Cargando registros...</p>
                      </div>
                    ) : tabHistorial === 'biometria' ? (
                      biometriaHistorial.length === 0 ? (
                        <p className="text-base text-slate-500 text-center py-8 font-medium">Sin historial de biometría registrado para este jugador.</p>
                      ) : (
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-xs">
                              <th className="pb-3">Fecha</th>
                              <th className="pb-3">Peso (kg)</th>
                              <th className="pb-3">Altura (cm)</th>
                              <th className="pb-3">IMC Calculado</th>
                              <th className="pb-3 text-right">Variación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {biometriaHistorial.map((b, idx) => {
                              // Calcular variación con respecto a la base o al anterior
                              let variacion = 0;
                              let signo = '';
                              let colorClase = 'text-slate-500';

                              if (idx < biometriaHistorial.length - 1) {
                                const pesoAnterior = biometriaHistorial[idx + 1].peso_kg;
                                variacion = b.peso_kg - pesoAnterior;
                              } else if (atletaSeleccionado.peso_base) {
                                variacion = b.peso_kg - atletaSeleccionado.peso_base;
                              }

                              if (variacion > 0) {
                                signo = '+';
                                colorClase = 'text-rose-500 font-bold';
                              } else if (variacion < 0) {
                                signo = '';
                                colorClase = 'text-emerald-600 font-bold';
                              }

                              return (
                                <tr key={b.id || idx} className="hover:bg-slate-50/40 text-slate-700 font-semibold">
                                  <td className="py-3 flex items-center gap-1.5">
                                    <Calendar size={16} className="text-slate-400" />
                                    {b.fecha}
                                  </td>
                                  <td className="py-3 font-bold">{b.peso_kg} kg</td>
                                  <td className="py-3 text-slate-500">{b.altura_cm} cm</td>
                                  <td className="py-3">
                                    <span className={`font-bold ${b.imc >= 18.5 && b.imc <= 24.9 ? 'text-emerald-600' : 'text-amber-600'
                                      }`}>{b.imc}</span>
                                  </td>
                                  <td className={`py-3 text-right ${colorClase}`}>
                                    {variacion !== 0 ? `${signo}${variacion.toFixed(1)} kg` : 'Estable'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )
                    ) : (
                      habitosHistorial.length === 0 ? (
                        <p className="text-base text-slate-500 text-center py-8 font-medium">Sin historial de hábitos nutricionales registrado para este jugador.</p>
                      ) : (
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-xs">
                              <th className="pb-3">Fecha</th>
                              <th className="pb-3">Comidas</th>
                              <th className="pb-3">Descanso</th>
                              <th className="pb-3">Hidratación</th>
                              <th className="pb-3">Menú</th>
                              <th className="pb-3 text-right">Suplementos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {habitosHistorial.map((h, idx) => {
                              return (
                                <tr key={h.id || idx} className="hover:bg-slate-50/40 text-slate-700 font-semibold">
                                  <td className="py-3 flex items-center gap-1.5 whitespace-nowrap">
                                    <Calendar size={16} className="text-slate-400" />
                                    {h.fecha}
                                  </td>
                                  <td className="py-3">{h.frecuencia_comidas} al día</td>
                                  <td className="py-3 whitespace-nowrap">
                                    <span className={`font-black ${h.calidad_descanso >= 7 ? 'text-emerald-600' : h.calidad_descanso >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                                      {h.calidad_descanso}/10
                                    </span>
                                  </td>
                                  <td className="py-3 font-bold text-slate-600">{h.hidratacion_litros} Litros</td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-valle-green">{h.plan_alimentacion || 'N/A'}</span>
                                      {h.plan_alimentacion && (
                                        <button
                                          type="button"
                                          onClick={() => mostrarDetalleDietaPorNombre(h.plan_alimentacion)}
                                          className="p-1 text-slate-400 hover:text-valle-green hover:bg-slate-100 rounded transition cursor-pointer"
                                          title="Ver detalles de la dieta"
                                        >
                                          <ClipboardList size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 text-right text-slate-500 font-medium italic truncate max-w-xs">{h.suplementacion || 'Ninguna'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in-up">
          {/* COLUMNA IZQUIERDA: LISTADO DE DIETAS (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col max-h-[700px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-base font-extrabold text-slate-850 tracking-tight font-display">Biblioteca de Dietas</span>
              <button
                type="button"
                onClick={prepararNuevaDieta}
                className="px-3 py-1.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-sm font-bold transition flex items-center cursor-pointer"
              >
                <Plus size={15} className="mr-1" /> Nueva
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {cargandoDietas ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto text-valle-green mb-2" size={24} />
                  <p className="text-base font-bold">Cargando biblioteca...</p>
                </div>
              ) : dietas.length === 0 ? (
                <p className="text-base text-slate-550 text-center py-12 font-medium">No hay dietas en la biblioteca.</p>
              ) : (
                dietas.map((d) => {
                  const esActivo = dietaSeleccionada?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => seleccionarDietaParaEditar(d)}
                      className={`w-full text-left p-3.5 rounded-xl transition flex flex-col items-start group ${esActivo
                          ? 'bg-linear-to-r from-valle-green/8 to-valle-green/4 border-l-4 border-valle-green pl-2.5 text-valle-green font-bold'
                          : 'hover:bg-slate-50 text-slate-700 font-medium pl-3'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base font-bold truncate text-slate-800">{d.nombre}</span>
                        {d.calorias && (
                          <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200/50">
                            {d.calorias} kcal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {d.descripcion}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: EDITOR DE DIETAS (8 COLS) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-150 pb-3">
              <Apple size={20} className="text-valle-green" />
              <span className="text-sm font-bold text-slate-850 tracking-tight font-display">
                {dietaSeleccionada ? `Editando: ${dietaSeleccionada.nombre}` : 'Crear Propuesta de Dieta'}
              </span>
            </div>

            <form onSubmit={handleGuardarDieta} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre de la Dieta</label>
                  <input
                    type="text"
                    placeholder="e.g. Dieta pre-partido"
                    value={nombreDieta}
                    onChange={(e) => setNombreDieta(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green transition-all font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Calorías Estimadas (kcal)</label>
                  <input
                    type="number"
                    placeholder="e.g. 750 (opcional)"
                    value={caloriasDieta}
                    onChange={(e) => setCaloriasDieta(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green transition-all font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Directrices y Descripción de Comidas</label>
                <textarea
                  rows="8"
                  placeholder="Describe a detalle las comidas, macronutrientes recomendados, ingredientes o sugerencias para este menú..."
                  value={descripcionDieta}
                  onChange={(e) => setDescripcionDieta(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green transition-all leading-relaxed text-slate-800 font-semibold"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={guardandoDieta}
                  className="w-full sm:w-auto flex-1 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer"
                >
                  {guardandoDieta ? (
                    <>
                      <Loader2 className="animate-spin mr-1.5" size={14} />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check size={14} className="mr-1.5" />
                      {dietaSeleccionada ? 'Guardar Cambios' : 'Crear Propuesta'}
                    </>
                  )}
                </button>

                {dietaSeleccionada && (
                  <button
                    type="button"
                    onClick={() => handleEliminarDieta(dietaSeleccionada.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm rounded-xl transition flex items-center justify-center cursor-pointer"
                  >
                    Eliminar de Biblioteca
                  </button>
                )}

                <button
                  type="button"
                  onClick={prepararNuevaDieta}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition flex items-center justify-center cursor-pointer"
                >
                  Limpiar / Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE DIETA */}
      {dietaDetalleModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Apple className="text-valle-green" size={20} />
                <h3 className="font-extrabold text-slate-850 text-lg font-display">{dietaDetalleModal.nombre}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDietaDetalleModal(null)}
                className="text-slate-500 hover:text-slate-850 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              {dietaDetalleModal.calorias && (
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Energía Estimada:</span>
                  <span className="font-black text-valle-green text-sm">{dietaDetalleModal.calorias} kcal</span>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-550 uppercase tracking-wider text-xs block mb-1.5">Directrices del Menú:</span>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 leading-relaxed italic whitespace-pre-line text-slate-800 text-sm font-medium">
                  {dietaDetalleModal.descripcion}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
