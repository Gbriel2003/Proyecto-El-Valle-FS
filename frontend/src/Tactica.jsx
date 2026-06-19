import { useState, useEffect, useRef } from 'react';
import api from './api';
import { 
  Calendar, 
  Pencil, 
  PlusCircle
} from 'lucide-react';

import TacticalCanvas from './components/pizarra/TacticalCanvas';
import PlaybookManager from './components/pizarra/PlaybookManager';
import MatchCalendar from './components/calendario/MatchCalendar';
import { 
  GuardarJugadaModal, 
  CrearTorneoModal, 
  ProgramarPartidoModal, 
  FinalizarPartidoModal, 
  ReporteIAModal 
} from './components/modals/TournamentModals';
import ConfirmModal from './components/modals/ConfirmModal';

const initialTokens = [
  // El Valle F.S. (Verde / Borde Oro)
  { id: 'v1', label: 'GK', x: 8, y: 50, team: 'valle' },
  { id: 'v2', label: 'FIX', x: 25, y: 50, team: 'valle' },
  { id: 'v3', label: 'ALA', x: 42, y: 22, team: 'valle' },
  { id: 'v4', label: 'ALA', x: 42, y: 78, team: 'valle' },
  { id: 'v5', label: 'PIV', x: 60, y: 50, team: 'valle' },
  // Rival (Rojo / Borde Negro)
  { id: 'r1', label: 'GK', x: 92, y: 50, team: 'rival' },
  { id: 'r2', label: 'FIX', x: 75, y: 50, team: 'rival' },
  { id: 'r3', label: 'ALA', x: 58, y: 22, team: 'rival' },
  { id: 'r4', label: 'ALA', x: 58, y: 78, team: 'rival' },
  { id: 'r5', label: 'PIV', x: 40, y: 50, team: 'rival' },
  // Balón
  { id: 'ball', label: '⚽', x: 50, y: 50, team: 'ball' }
];

export default function Tactica({ 
    esCuerpoTecnico = false, 
    vistaInicial = 'calendario',
    partidosEnProceso = [],
    registrarPartidoEnProceso = () => {},
    agregarToast = () => {}
}) {
    const subVista = vistaInicial;
    const [partidos, setPartidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    
    // Estados para la subida de archivos
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [subiendo, setSubiendo] = useState(null);
    const [progresoSubida, setProgresoSubida] = useState(0);
    const [mensajeSubida, setMensajeSubida] = useState({ partidoId: null, texto: '', tipo: '' });

    // Torneos, atletas de la plantilla
    const [torneos, setTorneos] = useState([]);
    const [plantillaAtletas, setPlantillaAtletas] = useState([]);
    
    // Modales
    const [confirmacion, setConfirmacion] = useState(null);
    const [mostrarCrearTorneo, setMostrarCrearTorneo] = useState(false);
    const [mostrarProgramarPartido, setMostrarProgramarPartido] = useState(false);
    const [mostrarFinalizarPartido, setMostrarFinalizarPartido] = useState(null); // guardará el partido
    const [mostrarReporteModal, setMostrarReporteModal] = useState(null); // guardará el partido
    
    // Formulario Crear Torneo
    const [nombreTorneo, setNombreTorneo] = useState('');
    const [temporadaTorneo, setTemporadaTorneo] = useState('');
    const [fechaInicioTorneo, setFechaInicioTorneo] = useState('');
    const [fechaFinTorneo, setFechaFinTorneo] = useState('');
    const [creandoTorneo, setCreandoTorneo] = useState(false);
    
    // Formulario Programar Partido
    const [torneoIdPartido, setTorneoIdPartido] = useState('');
    const [equipoLocalPartido, setEquipoLocalPartido] = useState('El Valle F.S.');
    const [equipoVisitantePartido, setEquipoVisitantePartido] = useState('');
    const [fechaHoraPartido, setFechaHoraPartido] = useState('');
    const [programandoPartido, setProgramandoPartido] = useState(false);
    const [editandoPartidoId, setEditandoPartidoId] = useState(null);

    // Formulario Finalizar Partido
    const [golesLocalPartido, setGolesLocalPartido] = useState(0);
    const [golesVisitantePartido, setGolesVisitantePartido] = useState(0);
    const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]); // lista de IDs
    const [guardandoResultado, setGuardandoResultado] = useState(false);

    // Reporte IA Modal
    const [reporteIA, setReporteIA] = useState(null);
    const [cargandoReporte, setCargandoReporte] = useState(false);
    const [errorReporte, setErrorReporte] = useState('');

    // ESTADOS DE LA PIZARRA TÁCTICA
    const [color, setColor] = useState('#ffffff');
    const [grosor, setGrosor] = useState(4);
    const [verFichas, setVerFichas] = useState(true);
    const [tokens, setTokens] = useState(initialTokens);
    const [isDrawing, setIsDrawing] = useState(false);

    // ESTADOS DE PIZARRAS GUARDADAS (PLAYBOOK)
    const [jugadas, setJugadas] = useState([]);
    const [cargandoJugadas, setCargandoJugadas] = useState(false);
    const [mostrarGuardarModal, setMostrarGuardarModal] = useState(false);
    const [nombreJugada, setNombreJugada] = useState('');
    const [descJugada, setDescJugada] = useState('');
    
    const boardRef = useRef(null);
    const canvasRef = useRef(null);

    const cargarPartidos = async () => {
        try {
            setCargando(true);
            const respuesta = await api.get('/partidos/');
            if (Array.isArray(respuesta.data)) {
                setPartidos(respuesta.data);
            } else {
                setPartidos([]);
            }
        } catch (err) {
            console.error("Error al cargar partidos:", err);
            setError('Endpoint de partidos no conectado.');
            setPartidos([
                {
                    id: 1,
                    equipo_local: "El Valle F.S.",
                    equipo_visitante: "Atlético Margarita",
                    fecha_hora: "2026-05-24T19:00:00",
                    estado: "Programado",
                    goles_local: 0,
                    goles_visitante: 0,
                    torneo_nombre: "Liga Oficial 2026",
                    jugadores_ids: []
                },
                {
                    id: 2,
                    equipo_local: "Futsal Nueva Esparta",
                    equipo_visitante: "El Valle F.S.",
                    fecha_hora: "2026-05-10T18:30:00",
                    estado: "Finalizado",
                    goles_local: 2,
                    goles_visitante: 4,
                    torneo_nombre: "Copa El Valle",
                    jugadores_ids: []
                }
            ]);
        } finally {
            setCargando(false);
        }
    };

    const cargarTorneos = async () => {
        try {
            const respuesta = await api.get('/torneos/');
            if (Array.isArray(respuesta.data)) {
                setTorneos(respuesta.data);
                if (respuesta.data.length > 0 && !torneoIdPartido) {
                    setTorneoIdPartido(respuesta.data[0].id.toString());
                }
            }
        } catch (err) {
            console.error("Error al cargar torneos:", err);
        }
    };

    const cargarPlantillaAtletas = async () => {
        try {
            const respuesta = await api.get('/atletas/');
            if (Array.isArray(respuesta.data)) {
                setPlantillaAtletas(respuesta.data);
            }
        } catch (err) {
            console.error("Error al cargar atletas:", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            cargarPartidos();
            cargarTorneos();
            cargarPlantillaAtletas();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recargar partidos cuando cambien los partidos en proceso de análisis global
    const prevPartidosEnProcesoRef = useRef(partidosEnProceso);
    useEffect(() => {
        const timer = setTimeout(() => {
            cargarPartidos();
        }, 0);
        
        const prev = prevPartidosEnProcesoRef.current;
        // Si teníamos un mensaje de procesando y el partido ya salió de la lista de "en proceso"
        if (mensajeSubida.tipo === 'procesando' && mensajeSubida.partidoId) {
            if (prev.includes(mensajeSubida.partidoId) && !partidosEnProceso.includes(mensajeSubida.partidoId)) {
                setMensajeSubida({ partidoId: null, texto: '', tipo: '' });
            }
        }
        prevPartidosEnProcesoRef.current = partidosEnProceso;

        return () => clearTimeout(timer);
    }, [partidosEnProceso, mensajeSubida]);

    // Actualizar el reporte en el modal en tiempo real si el partido sale de la lista de procesamiento
    useEffect(() => {
        if (mostrarReporteModal) {
            const partidoId = mostrarReporteModal.id;
            const enProceso = partidosEnProceso.includes(partidoId);
            const esReportePendiente = reporteIA && reporteIA.estado === 'pendiente_procesamiento';
            const sinReporte = !reporteIA && !cargandoReporte;
            
            if (!enProceso && (esReportePendiente || sinReporte)) {
                const refrescarReporte = async () => {
                    try {
                        const res = await api.get(`/partidos/${partidoId}/reporte`);
                        setReporteIA(res.data);
                        setErrorReporte('');
                    } catch (err) {
                        console.error("Error al refrescar reporte finalizado:", err);
                        if (err.response && err.response.status === 404) {
                            setErrorReporte('Aún no se ha subido ningún reporte PDF de estadísticas para este partido o la IA aún no termina de procesarlo.');
                        } else {
                            setErrorReporte('Error al cargar el análisis de IA de este partido.');
                        }
                    }
                };
                refrescarReporte();
            }
        }
    }, [partidosEnProceso, mostrarReporteModal, reporteIA, cargandoReporte]);

    // RE-INICIALIZAR CANVAS CUANDO SE ENTRA A LA VISTA DE PIZARRA
    useEffect(() => {
        if (subVista === 'pizarra' && canvasRef.current) {
            const canvas = canvasRef.current;
            if (canvas.width !== 1000) {
                canvas.width = 1000;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [subVista]);

    const cargarJugadas = async () => {
        try {
            setCargandoJugadas(true);
            const res = await api.get('/jugadas');
            setJugadas(res.data || []);
        } catch (err) {
            console.error("Error al cargar jugadas:", err);
        } finally {
            setCargandoJugadas(false);
        }
    };

    useEffect(() => {
        if (subVista === 'pizarra') {
            const timer = setTimeout(() => {
                cargarJugadas();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [subVista]);

    const formatearFecha = (fechaString) => {
        const opciones = { weekday: 'long', month: 'long', day: 'numeric' };
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-VE', opciones).replace(/^\w/, c => c.toUpperCase());
    };

    const formatearHora = (fechaString) => {
        const fecha = new Date(fechaString);
        return fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    const manejarCambioArchivo = (e, partidoId) => {
        setArchivoSeleccionado(e.target.files[0]);
        setMensajeSubida({ partidoId, texto: 'Archivo listo para subir', tipo: 'info' });
    };

    const manejarSubida = (partidoId) => {
        if (!archivoSeleccionado) {
            setMensajeSubida({ partidoId, texto: 'Por favor selecciona un archivo primero', tipo: 'error' });
            return;
        }

        setSubiendo(partidoId);
        setProgresoSubida(0);
        setMensajeSubida({ partidoId, texto: '', tipo: '' });

        const formData = new FormData();
        formData.append('file', archivoSeleccionado);

        const token = localStorage.getItem('token_valle');
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                setProgresoSubida(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                setProgresoSubida(100);
                setMensajeSubida({
                    partidoId,
                    texto: 'PDF enviado. La IA está analizando el reporte en segundo plano...',
                    tipo: 'procesando'
                });
                setArchivoSeleccionado(null);
                setSubiendo(null);
                // Registrar para polling en segundo plano
                registrarPartidoEnProceso(partidoId);
                // Mostrar toast informativo
                const partidoObj = partidos.find(p => p.id === partidoId) || { equipo_visitante: 'Rival' };
                agregarToast(
                    "Subida Exitosa",
                    `El reporte para el partido contra ${partidoObj.equipo_visitante} se está analizando con IA en segundo plano.`,
                    "info"
                );
            } else {
                setMensajeSubida({ partidoId, texto: 'Error al subir el reporte. Verifica el archivo.', tipo: 'error' });
                setSubiendo(null);
                setProgresoSubida(0);
            }
        });

        xhr.addEventListener('error', () => {
            setMensajeSubida({ partidoId, texto: 'Error de conexión al subir el reporte.', tipo: 'error' });
            setSubiendo(null);
            setProgresoSubida(0);
        });

        const apiBase = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        xhr.open('POST', `${apiBase}/partidos/${partidoId}/subir-reporte`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    };

    const pedirConfirmacion = (opciones) => {
        setConfirmacion(opciones);
    };

    const manejarEliminarPartido = (partidoId) => {
        pedirConfirmacion({
            title: '¿Eliminar partido?',
            message: '¿Estás seguro de que deseas eliminar este partido del calendario?',
            variant: 'danger',
            confirmText: 'Eliminar Partido',
            onConfirm: async () => {
                try {
                    const partidoEliminado = partidos.find(p => p.id === partidoId);
                    await api.delete(`/partidos/${partidoId}`);
                    agregarToast("Partido eliminado", `El partido contra ${partidoEliminado?.equipo_visitante || 'Rival'} fue eliminado.`, "info");
                    await cargarPartidos();
                } catch (err) {
                    console.error('Error al eliminar partido:', err);
                }
            }
        });
    };

    const manejarEliminarTorneo = (torneoId) => {
        pedirConfirmacion({
            title: '¿Eliminar Torneo?',
            message: 'Esta acción borrará el torneo y TODOS los partidos, reportes y estadísticas asociados a él. Esta acción es irreversible.\n\n¿Estás seguro?',
            variant: 'danger',
            confirmText: 'Sí, eliminar todo',
            onConfirm: async () => {
                try {
                    await api.delete(`/torneos/${torneoId}`);
                    agregarToast("Torneo eliminado", "El torneo y sus partidos han sido eliminados correctamente.", "info");
                    setTorneoIdPartido('');
                    await cargarTorneos();
                    await cargarPartidos();
                } catch (err) {
                    console.error('Error al eliminar torneo:', err);
                    agregarToast("Error", "No se pudo eliminar el torneo.", "error");
                }
            }
        });
    };

    const manejarFinalizarTorneo = (torneoId) => {
        pedirConfirmacion({
            title: '¿Finalizar Torneo?',
            message: '¿Estás seguro de que deseas marcar este torneo como finalizado?',
            variant: 'info',
            confirmText: 'Finalizar Torneo',
            onConfirm: async () => {
                try {
                    await api.put(`/torneos/${torneoId}/finalizar`);
                    agregarToast("Torneo finalizado", "El torneo ha sido marcado como finalizado.", "success");
                    await cargarTorneos();
                } catch (err) {
                    console.error('Error al finalizar torneo:', err);
                    agregarToast("Error", "No se pudo finalizar el torneo.", "error");
                }
            }
        });
    };

    const manejarCrearTorneo = async (e) => {
        e.preventDefault();
        if (!nombreTorneo || !temporadaTorneo || !fechaInicioTorneo || !fechaFinTorneo) return;
        setCreandoTorneo(true);
        try {
            await api.post('/torneos/', {
                nombre: nombreTorneo,
                temporada: temporadaTorneo,
                fecha_inicio: fechaInicioTorneo,
                fecha_fin: fechaFinTorneo
            });
            agregarToast("Torneo creado", `Se registró el torneo: ${nombreTorneo}`, "success");
            setNombreTorneo('');
            setTemporadaTorneo('');
            setFechaInicioTorneo('');
            setFechaFinTorneo('');
            setMostrarCrearTorneo(false);
            await cargarTorneos();
        } catch (err) {
            console.error("Error al crear torneo", err);
        } finally {
            setCreandoTorneo(false);
        }
    };

    const manejarProgramarPartido = async (e) => {
        e.preventDefault();
        if (!torneoIdPartido || !equipoLocalPartido || !equipoVisitantePartido || !fechaHoraPartido) return;
        setProgramandoPartido(true);
        try {
            if (editandoPartidoId) {
                // Modo Edición
                await api.put(`/partidos/${editandoPartidoId}`, {
                    goles_local: 0,
                    goles_visitante: 0,
                    estado: 'Programado',
                    jugadores_ids: jugadoresSeleccionados,
                    fecha_hora: new Date(fechaHoraPartido).toISOString()
                });
                agregarToast("Partido actualizado", `Convocatoria y/o fecha actualizada.`, "success");
            } else {
                // Modo Creación
                await api.post('/partidos/', {
                    torneo_id: parseInt(torneoIdPartido),
                    equipo_local: equipoLocalPartido,
                    equipo_visitante: equipoVisitantePartido,
                    fecha_hora: new Date(fechaHoraPartido).toISOString(),
                    jugadores_ids: jugadoresSeleccionados
                });
                agregarToast("Partido programado", `Partido contra ${equipoVisitantePartido} agendado.`, "success");
            }
            setTorneoIdPartido('');
            setEquipoLocalPartido('El Valle F.S.');
            setEquipoVisitantePartido('');
            setFechaHoraPartido('');
            setJugadoresSeleccionados([]);
            setEditandoPartidoId(null);
            setMostrarProgramarPartido(false);
            await cargarPartidos();
        } catch (err) {
            console.error("Error al programar partido", err);
        } finally {
            setProgramandoPartido(false);
        }
    };

    const manejarGuardarResultado = async (e) => {
        e.preventDefault();
        if (!mostrarFinalizarPartido) return;
        setGuardandoResultado(true);
        try {
            await api.put(`/partidos/${mostrarFinalizarPartido.id}`, {
                goles_local: golesLocalPartido,
                goles_visitante: golesVisitantePartido,
                estado: 'Finalizado',
                jugadores_ids: []
            });
            agregarToast("Partido finalizado", `Resultado guardado para el partido contra ${mostrarFinalizarPartido.equipo_visitante}.`, "success");
            setMostrarFinalizarPartido(null);
            setGolesLocalPartido(0);
            setGolesVisitantePartido(0);
            await cargarPartidos();
        } catch (err) {
            console.error("Error al finalizar partido", err);
        } finally {
            setGuardandoResultado(false);
        }
    };

    const abrirReporteIA = async (partido) => {
        setMostrarReporteModal(partido);
        setCargandoReporte(true);
        setErrorReporte('');
        setReporteIA(null);
        try {
            const res = await api.get(`/partidos/${partido.id}/reporte`);
            setReporteIA(res.data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                setErrorReporte('Aún no se ha subido ningún reporte PDF de estadísticas para este partido o la IA aún no termina de procesarlo.');
            } else {
                setErrorReporte('Error al cargar el análisis de IA de este partido.');
            }
        } finally {
            setCargandoReporte(false);
        }
    };

    const limpiarPizarra = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const guardarJugada = async (e) => {
        e.preventDefault();
        if (!nombreJugada.trim()) return alert("Por favor ingresa un título.");
        try {
            let trazosBase64 = null;
            if (canvasRef.current) {
                trazosBase64 = canvasRef.current.toDataURL("image/png");
            }
            await api.post('/jugadas', {
                titulo: nombreJugada,
                descripcion: descJugada,
                tokens_json: tokens,
                trazos_png: trazosBase64
            });
            agregarToast("Jugada guardada", `Se guardó la jugada táctica: ${nombreJugada}`, "success");
            setMostrarGuardarModal(false);
            setNombreJugada('');
            setDescJugada('');
            cargarJugadas();
        } catch (err) {
            console.error("Error al guardar jugada:", err);
            alert("No se pudo guardar la jugada táctica.");
        }
    };

    const cargarJugadaTactica = (jugada) => {
        if (!jugada) return;
        setTokens(jugada.tokens_json);
        
        if (canvasRef.current && jugada.trazos_png) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = jugada.trazos_png;
        }
    };

    const eliminarJugada = (id) => {
        pedirConfirmacion({
            title: '¿Eliminar jugada?',
            message: '¿Seguro que deseas eliminar esta jugada táctica?',
            variant: 'danger',
            confirmText: 'Sí, eliminar',
            onConfirm: async () => {
                try {
                    await api.delete(`/jugadas/${id}`);
                    agregarToast("Jugada eliminada", `La jugada táctica fue eliminada.`, "info");
                    cargarJugadas();
                } catch (err) {
                    console.error("Error al eliminar jugada:", err);
                }
            }
        });
    };

    const aplicarFormacion = (equipo, tipo) => {
        setTokens(prev => {
            return prev.map(t => {
                if (equipo === 'valle' && t.team === 'valle') {
                    if (tipo === '1-2-1') {
                        if (t.id === 'v1') return { ...t, x: 8, y: 50 };
                        if (t.id === 'v2') return { ...t, x: 25, y: 50 };
                        if (t.id === 'v3') return { ...t, x: 42, y: 22 };
                        if (t.id === 'v4') return { ...t, x: 42, y: 78 };
                        if (t.id === 'v5') return { ...t, x: 60, y: 50 };
                    } else if (tipo === '2-2') {
                        if (t.id === 'v1') return { ...t, x: 8, y: 50 };
                        if (t.id === 'v2') return { ...t, x: 28, y: 25 };
                        if (t.id === 'v3') return { ...t, x: 28, y: 75 };
                        if (t.id === 'v4') return { ...t, x: 58, y: 25 };
                        if (t.id === 'v5') return { ...t, x: 58, y: 75 };
                    } else if (tipo === '3-1') {
                        if (t.id === 'v1') return { ...t, x: 8, y: 50 };
                        if (t.id === 'v2') return { ...t, x: 20, y: 50 };
                        if (t.id === 'v3') return { ...t, x: 32, y: 25 };
                        if (t.id === 'v4') return { ...t, x: 32, y: 75 };
                        if (t.id === 'v5') return { ...t, x: 65, y: 50 };
                    }
                } else if (equipo === 'rival' && t.team === 'rival') {
                    if (tipo === '1-2-1') {
                        if (t.id === 'r1') return { ...t, x: 92, y: 50 };
                        if (t.id === 'r2') return { ...t, x: 75, y: 50 };
                        if (t.id === 'r3') return { ...t, x: 58, y: 22 };
                        if (t.id === 'r4') return { ...t, x: 58, y: 78 };
                        if (t.id === 'r5') return { ...t, x: 40, y: 50 };
                    } else if (tipo === '2-2') {
                        if (t.id === 'r1') return { ...t, x: 92, y: 50 };
                        if (t.id === 'r2') return { ...t, x: 72, y: 25 };
                        if (t.id === 'r3') return { ...t, x: 72, y: 75 };
                        if (t.id === 'r4') return { ...t, x: 42, y: 25 };
                        if (t.id === 'r5') return { ...t, x: 42, y: 75 };
                    } else if (tipo === '3-1') {
                        if (t.id === 'r1') return { ...t, x: 92, y: 50 };
                        if (t.id === 'r2') return { ...t, x: 80, y: 50 };
                        if (t.id === 'r3') return { ...t, x: 68, y: 25 };
                        if (t.id === 'r4') return { ...t, x: 68, y: 75 };
                        if (t.id === 'r5') return { ...t, x: 35, y: 50 };
                    }
                }
                return t;
            });
        });
    };

    const resetearFichas = () => {
        setTokens(initialTokens);
    };

    const headerConfig = subVista === 'pizarra' ? {
        title: "Pizarra Táctica",
        desc: "Diseña, dibuja y gestiona jugadas y estrategias tácticas para el equipo.",
        Icon: Pencil
    } : {
        title: "Partidos y Calendario",
        desc: "Gestión de encuentros oficiales, programación de partidos y análisis estadístico con IA.",
        Icon: Calendar
    };

    return (
        <div className="space-y-6 w-full mx-auto px-2 sm:px-4 lg:px-6">
            {/* Cabecera y Tabs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="text-left">
                    <h2 className="text-xl font-bold text-valle-black flex items-center">
                        <headerConfig.Icon className="text-valle-green mr-2.5" size={24} />
                        {headerConfig.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{headerConfig.desc}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Botones de Gestión (Solo Cuerpo Técnico) */}
                    {esCuerpoTecnico && subVista === 'calendario' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setMostrarCrearTorneo(true)}
                            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center shadow-xs cursor-pointer"
                          >
                            <PlusCircle className="mr-1.5 text-valle-green" size={14} /> Torneo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                                setEditandoPartidoId(null);
                                setTorneoIdPartido(torneos.length > 0 ? torneos[0].id.toString() : '');
                                setEquipoLocalPartido('El Valle F.S.');
                                setEquipoVisitantePartido('');
                                setFechaHoraPartido('');
                                setJugadoresSeleccionados([]);
                                setMostrarProgramarPartido(true);
                            }}
                            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-xl text-xs font-bold transition flex items-center justify-center shadow-md shadow-valle-green/10 cursor-pointer"
                          >
                            <Calendar className="mr-1.5" size={14} /> Programar Partido
                          </button>
                        </div>
                    )}
                </div>
            </div>

            {error && subVista === 'calendario' && (
                <div className="bg-valle-gold/10 border-l-4 border-valle-gold p-3.5 rounded-xl text-xs text-slate-700 font-bold text-left">
                    {error} Mostrando entorno de simulación táctica.
                </div>
            )}

            {/* ================= VISTA 1: CALENDARIO DE PARTIDOS ================= */}
            {subVista === 'calendario' && (
                <MatchCalendar
                    partidos={partidos}
                    torneos={torneos}
                    cargando={cargando}
                    esCuerpoTecnico={esCuerpoTecnico}
                    formatearFecha={formatearFecha}
                    formatearHora={formatearHora}
                    abrirReporteIA={abrirReporteIA}
                    setMostrarFinalizarPartido={setMostrarFinalizarPartido}
                    setGolesLocalPartido={setGolesLocalPartido}
                    setGolesVisitantePartido={setGolesVisitantePartido}
                    setJugadoresSeleccionados={setJugadoresSeleccionados}
                    manejarEliminarPartido={manejarEliminarPartido}
                    manejarEliminarTorneo={manejarEliminarTorneo}
                    manejarFinalizarTorneo={manejarFinalizarTorneo}
                    setEditandoPartidoId={setEditandoPartidoId}
                    setTorneoIdPartido={setTorneoIdPartido}
                    setEquipoLocalPartido={setEquipoLocalPartido}
                    setEquipoVisitantePartido={setEquipoVisitantePartido}
                    setFechaHoraPartido={setFechaHoraPartido}
                    setMostrarProgramarPartido={setMostrarProgramarPartido}
                    archivoSeleccionado={archivoSeleccionado}
                    mensajeSubida={mensajeSubida}
                    subiendo={subiendo}
                    progresoSubida={progresoSubida}
                    manejarCambioArchivo={manejarCambioArchivo}
                    manejarSubida={manejarSubida}
                />
            )}

            {/* ================= VISTA 2: PIZARRA TÁCTICA INTERACTIVA ================= */}
            {subVista === 'pizarra' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <TacticalCanvas
                            boardRef={boardRef}
                            canvasRef={canvasRef}
                            tokens={tokens}
                            setTokens={setTokens}
                            color={color}
                            setColor={setColor}
                            grosor={grosor}
                            setGrosor={setGrosor}
                            verFichas={verFichas}
                            setVerFichas={setVerFichas}
                            limpiarPizarra={limpiarPizarra}
                            resetearFichas={resetearFichas}
                            aplicarFormacion={aplicarFormacion}
                            isDrawing={isDrawing}
                            setIsDrawing={setIsDrawing}
                            setMostrarGuardarModal={setMostrarGuardarModal}
                            jugadas={jugadas}
                            cargarJugadaTactica={cargarJugadaTactica}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <PlaybookManager
                            cargandoJugadas={cargandoJugadas}
                            jugadas={jugadas}
                            cargarJugadaTactica={cargarJugadaTactica}
                            eliminarJugada={eliminarJugada}
                            setMostrarGuardarModal={setMostrarGuardarModal}
                        />
                    </div>
                </div>
            )}

            {/* ================= MODALES DE LA INTERFAZ ================= */}
            <GuardarJugadaModal
                isOpen={mostrarGuardarModal}
                onClose={() => setMostrarGuardarModal(false)}
                nombreJugada={nombreJugada}
                setNombreJugada={setNombreJugada}
                descJugada={descJugada}
                setDescJugada={setDescJugada}
                onSubmit={guardarJugada}
            />

            <CrearTorneoModal
                isOpen={mostrarCrearTorneo}
                onClose={() => setMostrarCrearTorneo(false)}
                nombreTorneo={nombreTorneo}
                setNombreTorneo={setNombreTorneo}
                temporadaTorneo={temporadaTorneo}
                setTemporadaTorneo={setTemporadaTorneo}
                fechaInicioTorneo={fechaInicioTorneo}
                setFechaInicioTorneo={setFechaInicioTorneo}
                fechaFinTorneo={fechaFinTorneo}
                setFechaFinTorneo={setFechaFinTorneo}
                creandoTorneo={creandoTorneo}
                onSubmit={manejarCrearTorneo}
            />

            <ProgramarPartidoModal
                isOpen={mostrarProgramarPartido}
                onClose={() => setMostrarProgramarPartido(false)}
                torneos={torneos}
                torneoIdPartido={torneoIdPartido}
                setTorneoIdPartido={setTorneoIdPartido}
                equipoLocalPartido={equipoLocalPartido}
                setEquipoLocalPartido={setEquipoLocalPartido}
                equipoVisitantePartido={equipoVisitantePartido}
                setEquipoVisitantePartido={setEquipoVisitantePartido}
                fechaHoraPartido={fechaHoraPartido}
                setFechaHoraPartido={setFechaHoraPartido}
                plantillaAtletas={plantillaAtletas}
                jugadoresSeleccionados={jugadoresSeleccionados}
                setJugadoresSeleccionados={setJugadoresSeleccionados}
                programandoPartido={programandoPartido}
                editandoPartidoId={editandoPartidoId}
                onAbrirCrearTorneo={() => {
                    setMostrarProgramarPartido(false);
                    setMostrarCrearTorneo(true);
                }}
                onSubmit={manejarProgramarPartido}
            />

            <FinalizarPartidoModal
                isOpen={!!mostrarFinalizarPartido}
                onClose={() => setMostrarFinalizarPartido(null)}
                partido={mostrarFinalizarPartido}
                golesLocalPartido={golesLocalPartido}
                setGolesLocalPartido={setGolesLocalPartido}
                golesVisitantePartido={golesVisitantePartido}
                setGolesVisitantePartido={setGolesVisitantePartido}
                guardandoResultado={guardandoResultado}
                onSubmit={manejarGuardarResultado}
            />

            <ReporteIAModal
                isOpen={!!mostrarReporteModal}
                onClose={() => setMostrarReporteModal(null)}
                partido={mostrarReporteModal}
                reporteIA={reporteIA}
                cargandoReporte={cargandoReporte}
                errorReporte={errorReporte}
                onRetry={() => abrirReporteIA(mostrarReporteModal)}
            />

            <ConfirmModal
                isOpen={!!confirmacion}
                onClose={() => setConfirmacion(null)}
                {...confirmacion}
            />
        </div>
    );
}