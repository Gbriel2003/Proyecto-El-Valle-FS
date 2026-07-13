import { useState, useEffect } from 'react';
import api from './api';
import { Activity, Timer, Save, Users, PlusCircle, CheckCircle, ArrowLeft, Trash2, ChevronRight, Search, UserCheck, Download } from 'lucide-react';
import CustomSelect from './components/ui/CustomSelect';
import { generatePDFReport } from './utils/reportGenerator';

export default function RegistroEntrenamiento({ crearNotificacion = null }) {
    const [vista, setVista] = useState('lista');
    
    const [sesiones, setSesiones] = useState([]);
    const [jugadores, setJugadores] = useState([]);
    
    const [sesionActiva, setSesionActiva] = useState(null);
    
    const rolUsuario = localStorage.getItem('rol_usuario');
    const isAtleta = rolUsuario === 'Atleta';
    
    // Filtros de historial
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

    // Control de asistencia masiva
    const [asistenciaEstado, setAsistenciaEstado] = useState({});
    const [busquedaJugadorAsistencia, setBusquedaJugadorAsistencia] = useState('');
    const [cargasRegistradas, setCargasRegistradas] = useState([]);

    const [sesionForm, setSesionForm] = useState({ tipo_sesion: 'Físico', descripcion: '', duracion_min: 90 });
    const [cargaForm, setCargaForm] = useState({ atleta_id: '', rpe_esfuerzo: 5, saltos_cm: '', tiempo_sprint_30m: '' });
    
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [cargando, setCargando] = useState(false);

    // Análisis IA de Equipo
    const [aiTemporalidad, setAiTemporalidad] = useState('diario');
    const [aiReporte, setAiReporte] = useState(null);
    const [generandoIA, setGenerandoIA] = useState(false);



    const mostrarMensaje = (tipo, texto) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    };

    const cargarDatos = async () => {
        try {
            const [resSesiones, resJugadores] = await Promise.all([
                api.get('/entrenamientos/'),
                api.get('/atletas/')
            ]);
            setSesiones(resSesiones.data);
            
            const jugOrd = resJugadores.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            setJugadores(jugOrd);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            mostrarMensaje('error', 'Error al cargar los datos del servidor.');
        }
    };

    useEffect(() => {
        setTimeout(() => {
            cargarDatos();
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const crearSesion = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const res = await api.post('/entrenamientos/', sesionForm);
            mostrarMensaje('exito', '¡Sesión creada exitosamente!');
            if (crearNotificacion) {
                crearNotificacion("Entrenamiento registrado", "Se ha creado una nueva sesión de entrenamiento.", "success");
            }
            setSesionActiva(res.data);
            setCargasRegistradas([]);
            
            // Inicializar asistencia para nueva sesión a true para todos (excepto lesionados en sesiones normales)
            const nuevoEstado = {};
            const isNoRecup = sesionForm.tipo_sesion !== 'Recuperación';
            jugadores.forEach(j => {
                nuevoEstado[j.atleta_id] = (j.lesionado && isNoRecup) ? false : true;
            });
            setAsistenciaEstado(nuevoEstado);

            setVista('detalle');
            cargarDatos();
        } catch (error) {
            console.error("Error al crear sesión:", error);
            mostrarMensaje('error', 'Error al crear la sesión.');
        } finally {
            setCargando(false);
        }
    };

    const eliminarSesion = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta sesión y TODOS los registros físicos asociados a ella?")) return;
        try {
            await api.delete(`/entrenamientos/${id}`);
            mostrarMensaje('exito', 'Sesión eliminada.');
            if (crearNotificacion) {
                crearNotificacion("Sesión eliminada", "Se eliminó la sesión de entrenamiento.", "info");
            }
            cargarDatos();
        } catch (error) {
            console.error("Error al eliminar sesión:", error);
            mostrarMensaje('error', 'Error al eliminar la sesión.');
        }
    };

    const abrirDetalle = async (sesion) => {
        setCargando(true);
        try {
            const resCargas = await api.get(`/entrenamientos/${sesion.id}/cargas/`);
            const cargas = resCargas.data.cargas;
            setCargasRegistradas(cargas);
            
            // Inicializar asistencia desde cargas existentes o por defecto true (excepto lesionados en sesiones normales)
            const nuevoEstado = {};
            const isNoRecup = sesion.tipo_sesion !== 'Recuperación';
            jugadores.forEach(j => {
                if (j.lesionado && isNoRecup) {
                    nuevoEstado[j.atleta_id] = false;
                } else {
                    const cargaExistente = cargas.find(c => c.atleta_id === j.atleta_id);
                    nuevoEstado[j.atleta_id] = cargaExistente ? cargaExistente.asistencia : true;
                }
            });
            setAsistenciaEstado(nuevoEstado);

            setSesionActiva(sesion);
            setVista('detalle');
        } catch (error) {
            console.error("Error al abrir detalle:", error);
            mostrarMensaje('error', 'Error al abrir la sesión.');
        } finally {
            setCargando(false);
        }
    };

    const generarAnalisisIA = async () => {
        setGenerandoIA(true);
        setAiReporte(null);
        try {
            const res = await api.get(`/entrenamientos/equipo/analisis-ia?temporalidad=${aiTemporalidad}`);
            setAiReporte(res.data);
            if (crearNotificacion) {
                crearNotificacion("Análisis IA Completado", `Se generó el reporte ${aiTemporalidad} del equipo.`, "success");
            }
        } catch (error) {
            console.error("Error al generar análisis IA:", error);
            mostrarMensaje('error', 'Error al generar el reporte de IA.');
        } finally {
            setGenerandoIA(false);
        }
    };

    const toggleAsistencia = (atletaId) => {
        const j = jugadores.find(x => x.atleta_id === atletaId);
        const isNoRecup = sesionActiva?.tipo_sesion !== 'Recuperación';
        if (j && j.lesionado && isNoRecup) {
            return;
        }
        setAsistenciaEstado(prev => ({
            ...prev,
            [atletaId]: !prev[atletaId]
        }));
    };

    const guardarAsistenciaMasiva = async () => {
        if (!sesionActiva) return;
        setCargando(true);
        try {
            const payload = {
                asistencias: Object.entries(asistenciaEstado).map(([atletaId, asistencia]) => ({
                    atleta_id: parseInt(atletaId),
                    asistencia: asistencia
                }))
            };
            await api.put(`/entrenamientos/${sesionActiva.id}/asistencia`, payload);
            mostrarMensaje('exito', '¡Asistencia guardada exitosamente!');
            if (crearNotificacion) {
                crearNotificacion("Asistencia Guardada", "Se actualizó el control de asistencia para esta sesión.", "success");
            }
            
            const resCargas = await api.get(`/entrenamientos/${sesionActiva.id}/cargas/`);
            setCargasRegistradas(resCargas.data.cargas);
        } catch (error) {
            console.error("Error al guardar asistencia masiva:", error);
            mostrarMensaje('error', 'Error al registrar la asistencia.');
        } finally {
            setCargando(false);
        }
    };

    const registrarCarga = async (e) => {
        e.preventDefault();
        if (!sesionActiva || !cargaForm.atleta_id) {
            mostrarMensaje('error', 'Selecciona un jugador válido.');
            return;
        }

        setCargando(true);
        try {
            // Se asume que asiste si se registra su carga
            const payload = {
                ...cargaForm,
                asistencia: true
            };
            await api.post(`/entrenamientos/${sesionActiva.id}/cargas/`, payload);
            mostrarMensaje('exito', 'Carga registrada correctamente.');
            if (crearNotificacion) {
                crearNotificacion("Métrica de carga guardada", "Se registraron los datos de RPE del jugador.", "success");
            }
            
            const resCargas = await api.get(`/entrenamientos/${sesionActiva.id}/cargas/`);
            setCargasRegistradas(resCargas.data.cargas);
            
            // Asegurar que su estado de asistencia local sea true
            setAsistenciaEstado(prev => ({
                ...prev,
                [cargaForm.atleta_id]: true
            }));

            setCargaForm({ atleta_id: '', rpe_esfuerzo: 5, saltos_cm: '', tiempo_sprint_30m: '' });
        } catch (error) {
            console.error("Error al registrar carga:", error);
            mostrarMensaje('error', 'Error al registrar la carga del atleta.');
        } finally {
            setCargando(false);
        }
    };

    const isAtletaEvaluado = (atletaId) => {
        const carga = cargasRegistradas.find(c => c.atleta_id === atletaId);
        return carga && carga.rpe_esfuerzo !== null && carga.rpe_esfuerzo !== undefined;
    };

    const totalEvaluados = cargasRegistradas.filter(c => c.rpe_esfuerzo !== null && c.rpe_esfuerzo !== undefined).length;

    // Filtrado de sesiones históricas
    const sesionesFiltradas = sesiones.filter(s => {
        const coincideBusqueda = (s.descripcion || '').toLowerCase().includes(busqueda.toLowerCase());
        const coincideTipo = !filtroTipo || s.tipo_sesion === filtroTipo;
        
        let coincideFecha = true;
        if (filtroFechaDesde && s.fecha < filtroFechaDesde) coincideFecha = false;
        if (filtroFechaHasta && s.fecha > filtroFechaHasta) coincideFecha = false;

        return coincideBusqueda && coincideTipo && coincideFecha;
    });

    // Filtrado de jugadores para panel de asistencia
    const jugadoresFiltradosAsistencia = jugadores.filter(j => 
        `${j.nombre} ${j.apellido}`.toLowerCase().includes(busquedaJugadorAsistencia.toLowerCase())
    );

    const exportarEntrenamientosPDF = async () => {
        const data = sesionesFiltradas.map(s => {
            const fecha = s.fecha 
                ? new Date(`${s.fecha}T00:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) 
                : 'N/A';
            return [
                fecha,
                s.tipo_sesion || 'N/A',
                s.descripcion || 'Sin descripción',
                s.duracion_min ? `${s.duracion_min} min` : 'N/A'
            ];
        });

        const columns = ['Fecha', 'Tipo de Sesión', 'Descripción / Enfoque', 'Duración'];

        await generatePDFReport({
            title: 'Reporte de Entrenamientos',
            filename: 'reporte_entrenamientos',
            columns,
            data,
            extraInfo: `Historial de sesiones de entrenamiento filtradas.\nTotal de sesiones registradas en este reporte: ${sesionesFiltradas.length}`
        });
    };

    const exportarSesionPDF = async () => {
        if (!sesionActiva) return;

        const data = [];
        const tituloSesion = `Control de Asistencia - Sesión del ${sesionActiva.fecha}`;

        jugadores.forEach(j => {
            const asistio = asistenciaEstado[j.atleta_id];
            const fila = [
                `${j.nombre} ${j.apellido}`,
                j.posicion || 'N/A',
                asistio ? 'PRESENTE' : 'AUSENTE'
            ];

            if (asistio) {
                const carga = cargasRegistradas.find(c => c.atleta_id === j.atleta_id);
                if (carga) {
                    fila.push(carga.rpe_esfuerzo !== null ? `${carga.rpe_esfuerzo}/10` : 'N/E');
                    fila.push(carga.saltos_cm ? `${carga.saltos_cm} cm` : '-');
                    fila.push(carga.tiempo_sprint_30m ? `${carga.tiempo_sprint_30m} s` : '-');
                } else {
                    fila.push('N/E', '-', '-');
                }
            } else {
                fila.push('-', '-', '-');
            }
            data.push(fila);
        });

        // Ordenar: primero presentes, luego ausentes, luego alfabéticamente
        data.sort((a, b) => {
            if (a[2] === b[2]) return a[0].localeCompare(b[0]);
            return a[2] === 'PRESENTE' ? -1 : 1;
        });

        const columns = ['Atleta', 'Posición', 'Asistencia', 'Esfuerzo (RPE)', 'Salto Vertical', 'Sprint 30m'];

        await generatePDFReport({
            title: tituloSesion,
            filename: `reporte_sesion_${sesionActiva.fecha}`,
            columns,
            data,
            extraInfo: `Tipo: ${sesionActiva.tipo_sesion} | Duración: ${sesionActiva.duracion_min} min\nDescripción: ${sesionActiva.descripcion}\nTotal Presentes: ${data.filter(d => d[2] === 'PRESENTE').length} / ${jugadores.length}`
        });
    };

    return (
        <div className="w-full mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
            
            {mensaje.texto && (
                <div className={`p-4 rounded-lg text-sm font-medium border-l-4 ${mensaje.tipo === 'exito' ? 'bg-green-50 border-valle-green text-valle-green-dark' : 'bg-red-50 border-red-500 text-red-800'}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* VISTA 1: LISTA HISTÓRICA */}
            {vista === 'lista' && (
                <div id="tour-ia-history" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50 gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-valle-black flex items-center">
                                <Activity className="mr-2 text-valle-green" size={20} /> Historial de Entrenamientos
                            </h2>
                            <p className="text-sm text-slate-500">Administra las sesiones globales del equipo.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 flex-wrap md:flex-nowrap">
                            {!isAtleta && (
                                <button 
                                    onClick={exportarEntrenamientosPDF}
                                    className="px-3 py-1.5 bg-valle-green hover:bg-valle-green-dark text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center shadow-md whitespace-nowrap"
                                >
                                    <Download size={14} className="mr-1.5 shrink-0" /> Descargar Reporte
                                </button>
                            )}
                            <button 
                                onClick={() => setVista('analisis_ia')}
                                className="px-3 py-1.5 bg-valle-gold hover:bg-yellow-500 text-slate-900 rounded-lg text-xs font-bold flex items-center transition justify-center shadow-md cursor-pointer whitespace-nowrap"
                            >
                                <Activity size={14} className="mr-1.5 shrink-0" /> Análisis I.A.
                            </button>
                            <button 
                                id="tour-ia-form"
                                onClick={() => { setSesionForm({ tipo_sesion: 'Físico', descripcion: '', duracion_min: 90 }); setVista('crear'); }}
                                className="px-3 py-1.5 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-xs font-bold flex items-center transition justify-center shadow-md cursor-pointer whitespace-nowrap"
                            >
                                <PlusCircle size={14} className="mr-1.5 shrink-0" /> Nueva Sesión
                            </button>
                        </div>
                    </div>

                    {/* BARRA DE FILTROS */}
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buscar Descripción</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Ej: circuito de fuerza..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Sesión</label>
                            <select
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green font-medium text-slate-700"
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="Físico">Físico</option>
                                <option value="Táctico">Táctico</option>
                                <option value="Recuperación">Recuperación</option>
                                <option value="Partido Amistoso">Partido Amistoso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Desde</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green font-medium text-slate-700"
                                value={filtroFechaDesde}
                                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Hasta</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green font-medium text-slate-700"
                                value={filtroFechaHasta}
                                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                                min={filtroFechaDesde}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold whitespace-nowrap">Fecha</th>
                                    <th className="p-4 font-semibold">Tipo</th>
                                    <th className="p-4 font-semibold hidden md:table-cell">Descripción</th>
                                    <th className="p-4 font-semibold text-center">Duración</th>
                                    <th className="p-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {sesionesFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">
                                            {sesiones.length === 0 ? "No hay sesiones registradas. Crea la primera." : "No se encontraron sesiones con los filtros aplicados."}
                                        </td>
                                    </tr>
                                ) : (
                                    sesionesFiltradas.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 font-medium text-slate-700 whitespace-nowrap">{s.fecha}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap ${
                                                    s.tipo_sesion === 'Físico' ? 'bg-orange-100 text-orange-800' :
                                                    s.tipo_sesion === 'Táctico' ? 'bg-emerald-100 text-emerald-800' :
                                                    s.tipo_sesion === 'Recuperación' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {s.tipo_sesion}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600 hidden md:table-cell">{s.descripcion}</td>
                                            <td className="p-4 text-center text-slate-600 font-medium">{s.duracion_min}'</td>
                                            <td className="p-4 text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                                                <button onClick={() => eliminarSesion(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                                <button onClick={() => abrirDetalle(s)} className="p-2 text-slate-400 hover:text-valle-green hover:bg-slate-100 rounded-lg transition" title="Asistencia y Carga">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VISTA 2: CREAR NUEVA SESIÓN */}
            {vista === 'crear' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
                    <button onClick={() => setVista('lista')} className="text-sm font-medium text-slate-500 hover:text-valle-black flex items-center mb-6">
                        <ArrowLeft size={16} className="mr-1" /> Volver al historial
                    </button>
                    
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 rounded-full bg-valle-green flex items-center justify-center mr-3">
                            <Timer size={20} className="text-valle-gold" />
                        </div>
                        <div>
                            <h3 className="font-bold text-valle-black text-lg">Nueva Sesión de Entrenamiento</h3>
                            <p className="text-sm text-slate-500">Define los parámetros del trabajo grupal.</p>
                        </div>
                    </div>

                    <form onSubmit={crearSesion} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Sesión</label>
                            <CustomSelect
                                value={sesionForm.tipo_sesion}
                                onChange={(e) => setSesionForm({ ...sesionForm, tipo_sesion: e.target.value })}
                                options={["Físico", "Táctico", "Recuperación", "Partido Amistoso"]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción del Trabajo</label>
                            <input
                                required
                                type="text" placeholder="Ej: Circuito de fuerza y resistencia anaeróbica"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                value={sesionForm.descripcion}
                                onChange={(e) => setSesionForm({ ...sesionForm, descripcion: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Duración (Minutos)</label>
                            <input
                                required type="number" min="1"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                value={sesionForm.duracion_min}
                                onChange={(e) => setSesionForm({ ...sesionForm, duracion_min: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button type="submit" disabled={cargando} className="w-full py-3 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg font-bold transition flex justify-center items-center shadow-sm">
                                <PlusCircle size={18} className="mr-2" /> Crear Sesión
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* VISTA 3: DETALLE Y REGISTRO INDIVIDUAL */}
            {vista === 'detalle' && sesionActiva && (
                <div>
                    <button onClick={() => setVista('lista')} className="text-sm font-medium text-slate-500 hover:text-valle-black flex items-center mb-6">
                        <ArrowLeft size={16} className="mr-1" /> Volver al historial
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* COL 1: RESUMEN DE LA SESIÓN (lg:col-span-3) */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
                                <div className="flex items-center mb-4">
                                    <CheckCircle className="text-valle-green mr-2" size={20} />
                                    <h3 className="font-bold text-base text-slate-800">Sesión Activa</h3>
                                </div>
                                <div className="space-y-3 text-xs text-slate-600">
                                    <p><strong className="text-slate-800">Fecha:</strong> {sesionActiva.fecha}</p>
                                    <p><strong className="text-slate-800">Tipo:</strong> {sesionActiva.tipo_sesion}</p>
                                    <p><strong className="text-slate-800">Duración:</strong> {sesionActiva.duracion_min} min</p>
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="italic text-slate-500">"{sesionActiva.descripcion}"</p>
                                    </div>
                                    {!isAtleta && (
                                        <div className="pt-3 mt-3 border-t border-slate-100">
                                            <button 
                                                onClick={exportarSesionPDF}
                                                className="w-full bg-valle-green hover:bg-valle-green-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition shadow-md cursor-pointer"
                                            >
                                                <Download size={14} className="mr-1.5" /> Descargar Reporte
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Estadísticas rápidas de asistencia */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presentes hoy</p>
                                        <p className="text-xl font-black text-valle-black mt-0.5">
                                            {jugadores.filter(j => asistenciaEstado[j.atleta_id] === true).length} 
                                            <span className="text-xs font-semibold text-slate-400"> / {jugadores.length}</span>
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                        <UserCheck className="text-green-600" size={20} />
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluados</p>
                                        <p className="text-xl font-black text-valle-black mt-0.5">
                                            {totalEvaluados} 
                                            <span className="text-xs font-semibold text-slate-400"> / {jugadores.filter(j => asistenciaEstado[j.atleta_id] === true).length}</span>
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-valle-gold-light/20 flex items-center justify-center border border-valle-gold-light/40">
                                        <Activity className="text-valle-green" size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COL 2: CONTROL DE ASISTENCIA (lg:col-span-4) */}
                        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-[520px]">
                            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
                                <Users className="text-valle-green" size={20} />
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Control de Asistencia</h3>
                                    <p className="text-[11px] text-slate-500">Pasa lista antes de cargar métricas</p>
                                </div>
                            </div>

                            {/* Búsqueda rápida de jugadores */}
                            <div className="relative mb-3">
                                <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Buscar jugador..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                    value={busquedaJugadorAsistencia}
                                    onChange={(e) => setBusquedaJugadorAsistencia(e.target.value)}
                                />
                            </div>

                            {/* Lista de atletas toggles */}
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[320px]">
                                {jugadoresFiltradosAsistencia.length === 0 ? (
                                    <p className="text-center text-xs text-slate-400 py-8">No se encontraron jugadores.</p>
                                ) : (
                                    jugadoresFiltradosAsistencia.map(j => (
                                        <div key={j.atleta_id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center space-x-2.5">
                                                <div className="w-7 h-7 rounded-full bg-valle-green/10 flex items-center justify-center text-[10px] text-valle-green-dark border border-valle-green/20 font-black shrink-0">
                                                    {j.nombre.charAt(0)}{j.apellido.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                                        <p className="text-xs font-bold text-slate-700">{j.nombre} {j.apellido}</p>
                                                        {j.lesionado && (
                                                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-90 origin-left">
                                                                Lesionado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-medium">{j.posicion}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={j.lesionado && sesionActiva?.tipo_sesion !== 'Recuperación'}
                                                onClick={() => toggleAsistencia(j.atleta_id)}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                                                    asistenciaEstado[j.atleta_id] ? 'bg-valle-green' : 'bg-slate-300'
                                                } ${
                                                    (j.lesionado && sesionActiva?.tipo_sesion !== 'Recuperación') ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                                }`}
                                                title={j.lesionado && sesionActiva?.tipo_sesion !== 'Recuperación' ? "Los jugadores lesionados no pueden asistir a sesiones normales." : ""}
                                            >
                                                <span
                                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                        asistenciaEstado[j.atleta_id] ? 'translate-x-5.5' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button 
                                onClick={guardarAsistenciaMasiva}
                                disabled={cargando}
                                className="w-full mt-4 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-bold transition flex justify-center items-center shadow-sm"
                            >
                                <Save size={14} className="mr-2" /> Guardar Asistencia ({jugadores.filter(j => asistenciaEstado[j.atleta_id] === true).length} Presentes)
                            </button>
                        </div>

                        {/* COL 3: REGISTRO DE CARGAS INDIVIDUALES (lg:col-span-5) */}
                        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-[520px]">
                            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
                                <Activity size={20} className="text-valle-green" />
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Carga Física Individual</h3>
                                    <p className="text-[11px] text-slate-500">Registra el esfuerzo de los presentes</p>
                                </div>
                            </div>

                            <form onSubmit={registrarCarga} className="flex-1 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Seleccionar Jugador Presente</label>
                                        <CustomSelect
                                            value={cargaForm.atleta_id}
                                            onChange={(e) => setCargaForm({ ...cargaForm, atleta_id: e.target.value })}
                                            placeholder="-- Elige de los presentes --"
                                            options={jugadores
                                                .filter(j => asistenciaEstado[j.atleta_id] === true)
                                                .map(j => {
                                                    const evaluado = isAtletaEvaluado(j.atleta_id);
                                                    return {
                                                        value: j.atleta_id,
                                                        label: `${j.nombre} ${j.apellido}${evaluado ? ' ✅ (Evaluado)' : ''}`,
                                                        disabled: evaluado
                                                    };
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <label className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                                            <span>Esfuerzo Percibido (RPE)</span>
                                            <span className="text-valle-green font-bold bg-white px-2 py-0.5 rounded shadow-xs border border-slate-200">{cargaForm.rpe_esfuerzo} / 10</span>
                                        </label>
                                        <input
                                            type="range" min="1" max="10"
                                            className="w-full accent-valle-green"
                                            value={cargaForm.rpe_esfuerzo}
                                            onChange={(e) => setCargaForm({ ...cargaForm, rpe_esfuerzo: e.target.value })}
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                            <span>Suave</span>
                                            <span>Extremo</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Salto Vertical (cm)</label>
                                            <input
                                                type="number" step="0.1" placeholder="Ej: 45.5"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-valle-green"
                                                value={cargaForm.saltos_cm}
                                                onChange={(e) => setCargaForm({ ...cargaForm, saltos_cm: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Sprint 30m (segs)</label>
                                            <input
                                                type="number" step="0.1" placeholder="Ej: 4.2"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-valle-green"
                                                value={cargaForm.tiempo_sprint_30m}
                                                onChange={(e) => setCargaForm({ ...cargaForm, tiempo_sprint_30m: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto">
                                    <button 
                                        type="submit" 
                                        disabled={cargando || !cargaForm.atleta_id} 
                                        className="w-full py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-bold transition shadow-sm flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save size={14} className="mr-2" /> Registrar Carga Física
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA 4: ANÁLISIS I.A. */}
            {vista === 'analisis_ia' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto min-h-[75vh] flex flex-col">
                    <button onClick={() => setVista('lista')} className="text-sm font-medium text-slate-500 hover:text-valle-black flex items-center mb-6 w-fit">
                        <ArrowLeft size={16} className="mr-1" /> Volver al historial
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4 shrink-0">
                        <div className="flex items-center">
                            <Activity size={32} className="text-valle-green mr-3 shrink-0" />
                            <div>
                                <h3 className="font-bold text-valle-black text-xl">Análisis de Rendimiento (I.A.)</h3>
                                <p className="text-sm text-slate-500">Reporte inteligente del rendimiento colectivo del equipo.</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-200">
                            <div className="w-full sm:w-[220px] shrink-0">
                                <CustomSelect
                                    value={aiTemporalidad}
                                    onChange={(e) => setAiTemporalidad(e.target.value)}
                                    options={[
                                        { value: 'diario', label: 'Diario (Hoy)' },
                                        { value: 'semanal', label: 'Semanal (Últimos 7 días)' },
                                        { value: 'mensual', label: 'Mensual (Últimos 30 días)' },
                                        { value: 'anual', label: 'Anual (Temporada)' }
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <button 
                                onClick={generarAnalisisIA}
                                disabled={generandoIA}
                                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-xs font-bold transition flex items-center justify-center shadow-sm disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
                            >
                                {generandoIA ? "Analizando..." : "Generar Reporte"}
                            </button>
                        </div>
                    </div>

                    {generandoIA && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-fade-in py-12">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-valle-green rounded-full animate-spin mb-4" />
                            <p className="font-bold text-lg">Procesando datos del equipo...</p>
                            <p className="text-sm mt-1">El modelo LLM está analizando las cargas de entrenamiento.</p>
                        </div>
                    )}

                    {!generandoIA && aiReporte && (
                        <div className="space-y-6 animate-fade-in-up flex-1">
                            {aiReporte.error ? (
                                <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex flex-col items-center text-center">
                                    <Activity size={32} className="text-red-500 mb-3" />
                                    <h4 className="font-bold text-red-800 text-lg mb-1">{aiReporte.error}</h4>
                                    <p className="text-sm text-red-600 max-w-md">{aiReporte.detalle || aiReporte.detalle_tecnico}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Carga Global</p>
                                            <p className={`text-2xl font-black ${
                                                aiReporte.carga_global === 'Baja' ? 'text-blue-600' :
                                                aiReporte.carga_global === 'Media' ? 'text-valle-green-dark' :
                                                aiReporte.carga_global === 'Alta' ? 'text-amber-600' : 'text-red-600'
                                            }`}>{aiReporte.carga_global || 'No determinada'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tendencia Principal</p>
                                            <p className="text-sm font-bold text-slate-800">{aiReporte.tendencia}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5">
                                            <h4 className="font-bold text-emerald-800 flex items-center mb-4">
                                                <CheckCircle size={18} className="mr-2 text-emerald-600" /> Puntos Fuertes
                                            </h4>
                                            <ul className="space-y-2">
                                                {(aiReporte.puntos_fuertes || []).map((punto, i) => (
                                                    <li key={i} className="flex items-start text-sm text-emerald-900">
                                                        <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                                                        {punto}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5">
                                            <h4 className="font-bold text-amber-800 flex items-center mb-4">
                                                <Activity size={18} className="mr-2 text-amber-600" /> A Mejorar / Vigilar
                                            </h4>
                                            <ul className="space-y-2">
                                                {(aiReporte.puntos_a_mejorar || []).map((punto, i) => (
                                                    <li key={i} className="flex items-start text-sm text-amber-900">
                                                        <span className="text-amber-500 mr-2 mt-0.5">•</span>
                                                        {punto}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-valle-black rounded-xl p-6 shadow-md border border-valle-black-light mt-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-valle-green/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                        <h4 className="font-bold text-valle-gold flex items-center mb-3">
                                            Recomendación Técnica
                                        </h4>
                                        <p className="text-sm leading-relaxed text-slate-200 relative z-10">
                                            {aiReporte.recomendacion_tecnica}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    {!generandoIA && !aiReporte && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                            <Activity size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Selecciona una temporalidad y haz clic en "Generar Reporte"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}