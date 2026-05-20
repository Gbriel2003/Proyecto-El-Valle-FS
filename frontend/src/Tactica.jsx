import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Flag, 
  ChevronRight, 
  Shield, 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  FolderOpen,
  X,
  PlusCircle,
  Plus,
  Award,
  List,
  Sparkles,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';

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

export default function Tactica({ esCuerpoTecnico = false }) {
    const [subVista, setSubVista] = useState('calendario'); // 'calendario' | 'pizarra'
    const [partidos, setPartidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    
    // Estados para la subida de archivos
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [subiendo, setSubiendo] = useState(null);
    const [progresoSubida, setProgresoSubida] = useState(0);
    const [mensajeSubida, setMensajeSubida] = useState({ partidoId: null, texto: '', tipo: '' });

    // NUEVOS ESTADOS PARA TORNEOS, PARTIDOS Y REPORTE IA
    const [torneos, setTorneos] = useState([]);
    const [plantillaAtletas, setPlantillaAtletas] = useState([]);
    
    // Modales
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
    const [dragTokenId, setDragTokenId] = useState(null);
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
        cargarPartidos();
        cargarTorneos();
        cargarPlantillaAtletas();
    }, []);

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
            cargarJugadas();
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

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        xhr.open('POST', `${apiBase}/partidos/${partidoId}/subir-reporte`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    };

    const manejarEliminarPartido = async (partidoId) => {
        if (!window.confirm('¿Eliminar este partido del calendario?')) return;
        try {
            await api.delete(`/partidos/${partidoId}`);
            await cargarPartidos();
        } catch (err) {
            console.error('Error al eliminar partido:', err);
        }
    };

    // NUEVOS MANEJADORES DE ACCIÓN
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
            await api.post('/partidos/', {
                torneo_id: parseInt(torneoIdPartido),
                equipo_local: equipoLocalPartido,
                equipo_visitante: equipoVisitantePartido,
                fecha_hora: new Date(fechaHoraPartido).toISOString()
            });
            setTorneoIdPartido('');
            setEquipoLocalPartido('El Valle F.S.');
            setEquipoVisitantePartido('');
            setFechaHoraPartido('');
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
                jugadores_ids: jugadoresSeleccionados
            });
            setMostrarFinalizarPartido(null);
            setGolesLocalPartido(0);
            setGolesVisitantePartido(0);
            setJugadoresSeleccionados([]);
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

    // --- FUNCIONES DE DIBUJO ---
    const startDrawing = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = grosor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const limpiarPizarra = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // --- PERSISTENCIA (GUARDADO Y CARGA) DE JUGADAS ---
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
        // Restaurar tokens
        setTokens(jugada.tokens_json);
        
        // Restaurar trazos en canvas
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

    const eliminarJugada = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta jugada?")) return;
        try {
            await api.delete(`/jugadas/${id}`);
            cargarJugadas();
        } catch (err) {
            console.error("Error al eliminar jugada:", err);
        }
    };

    // --- DRAG AND DROP DE FICHAS ---
    const handleTokenPointerDown = (e, id) => {
        e.preventDefault();
        e.stopPropagation(); // Detener propagación para evitar que comience a dibujar en la cancha
        setDragTokenId(id);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleTokenPointerMove = (e, id) => {
        if (dragTokenId !== id) return;
        e.preventDefault();
        
        const board = boardRef.current;
        if (!board) return;
        const rect = board.getBoundingClientRect();
        
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Mantener dentro del campo visual
        x = Math.max(1, Math.min(99, x));
        y = Math.max(1, Math.min(99, y));
        
        setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    };

    const handleTokenPointerUp = (e, id) => {
        if (dragTokenId === id) {
            setDragTokenId(null);
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    // --- FORMACIONES DE FUTSAL ---
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

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Cabecera y Tabs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-valle-black flex items-center">
                        <Flag className="text-valle-green mr-2" size={24} />
                        Pizarra Táctica y Calendario
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Gestión de encuentros, análisis post-partido y simulación táctica.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Botones de Gestión (Solo Cuerpo Técnico) */}
                    {esCuerpoTecnico && subVista === 'calendario' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setMostrarCrearTorneo(true)}
                                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center shadow-sm"
                            >
                                <PlusCircle className="mr-1.5 text-valle-green" size={14} /> Torneo
                            </button>
                            <button
                                onClick={() => setMostrarProgramarPartido(true)}
                                className="flex-1 sm:flex-initial px-3.5 py-2 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-bold transition flex items-center justify-center shadow-sm"
                            >
                                <Calendar className="mr-1.5" size={14} /> Programar Partido
                            </button>
                        </div>
                    )}

                    <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 flex-1 lg:flex-initial">
                        <button
                            onClick={() => setSubVista('calendario')}
                            className={`flex-1 lg:flex-initial px-4 py-2 rounded-md text-xs font-bold transition flex items-center justify-center ${
                                subVista === 'calendario' 
                                    ? 'bg-white text-valle-green shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Calendar size={14} className="mr-1.5" /> Partidos
                        </button>
                        <button
                            onClick={() => setSubVista('pizarra')}
                            className={`flex-1 lg:flex-initial px-4 py-2 rounded-md text-xs font-bold transition flex items-center justify-center ${
                                subVista === 'pizarra' 
                                    ? 'bg-white text-valle-green shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Pencil size={14} className="mr-1.5" /> Pizarra Táctica
                        </button>
                    </div>
                </div>
            </div>

            {error && subVista === 'calendario' && (
                <div className="bg-valle-gold-light/20 border-l-4 border-valle-gold p-3 rounded text-xs text-slate-800 font-medium">
                    {error} Mostrando entorno de simulación táctica.
                </div>
            )}

            {/* ================= VISTA 1: CALENDARIO DE PARTIDOS ================= */}
            {subVista === 'calendario' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {cargando ? (
                        <div className="col-span-2 text-center p-12 text-slate-500">Cargando partidos...</div>
                    ) : partidos.length === 0 ? (
                        <div className="col-span-2 text-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200">No hay partidos programados.</div>
                    ) : (
                        partidos.map((partido) => (
                            <div key={partido.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition">
                                {/* Estado del Partido */}
                                <div className={`px-4 py-2.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider ${partido.estado === 'Finalizado' ? 'bg-slate-100 text-slate-600' : 'bg-valle-green-light/20 text-valle-green-dark border-b border-valle-green-light/30'}`}>
                                    <span className="flex items-center">
                                        {partido.estado === 'Finalizado' ? <FileText size={14} className="mr-1.5" /> : <Clock size={14} className="mr-1.5" />}
                                        {partido.estado}
                                    </span>
                                    <span>{partido.torneo_nombre || "Jornada Oficial"}</span>
                                </div>

                                {/* Marcador y Equipos */}
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3 shadow-sm ${partido.equipo_local.includes("Valle") ? "bg-slate-50 border-valle-green" : "bg-slate-50 border-slate-200"}`}>
                                            <Shield size={28} className={partido.equipo_local.includes("Valle") ? "text-valle-green" : "text-slate-400"} />
                                        </div>
                                        <span className="font-bold text-slate-800 text-sm text-center line-clamp-1">{partido.equipo_local}</span>
                                    </div>

                                    <div className="flex flex-col items-center px-4">
                                        {partido.estado === 'Finalizado' ? (
                                            <div className="text-3xl font-black text-slate-800 tracking-widest bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                {partido.goles_local} - {partido.goles_visitante}
                                            </div>
                                        ) : (
                                            <div className="text-xl font-bold text-slate-400 px-4 py-1">VS</div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-3 shadow-sm ${partido.equipo_visitante.includes("Valle") ? "bg-slate-50 border-valle-green" : "bg-slate-50 border-slate-200"}`}>
                                            <Shield size={28} className={partido.equipo_visitante.includes("Valle") ? "text-valle-green" : "text-slate-400"} />
                                        </div>
                                        <span className="font-bold text-slate-800 text-sm text-center line-clamp-1">{partido.equipo_visitante}</span>
                                    </div>
                                </div>

                                {/* Pie del partido */}
                                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col justify-between gap-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                                        <div className="flex flex-col text-xs text-slate-500 font-medium">
                                            <span className="flex items-center mb-1"><Calendar size={12} className="mr-1.5 text-valle-gold" /> {formatearFecha(partido.fecha_hora)}</span>
                                            <span className="flex items-center"><MapPin size={12} className="mr-1.5 text-valle-gold" /> {formatearHora(partido.fecha_hora)} - Cancha Local</span>
                                        </div>

                                        {partido.estado === 'Finalizado' ? (
                                            <button 
                                                onClick={() => abrirReporteIA(partido)}
                                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center shadow-sm w-full sm:w-auto justify-center"
                                            >
                                                Ver Reporte Táctico
                                                <ChevronRight size={14} className="ml-1" />
                                            </button>
                                        ) : esCuerpoTecnico ? (
                                            <button 
                                                onClick={() => {
                                                    setMostrarFinalizarPartido(partido);
                                                    setGolesLocalPartido(partido.goles_local || 0);
                                                    setGolesVisitantePartido(partido.goles_visitante || 0);
                                                    setJugadoresSeleccionados(partido.jugadores_ids || []);
                                                }}
                                                className="px-4 py-2 bg-valle-gold hover:bg-valle-gold/90 text-valle-black rounded-lg text-xs font-bold transition flex items-center shadow-sm w-full sm:w-auto justify-center"
                                            >
                                                Registrar Marcador & Plantilla
                                                <Plus size={14} className="ml-1" />
                                            </button>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg text-[10px] font-bold">
                                                Programado
                                            </span>
                                        )}

                                        {/* Botón Eliminar para partidos programados (cuerpo técnico) */}
                                        {partido.estado !== 'Finalizado' && esCuerpoTecnico && (
                                            <button
                                                onClick={() => manejarEliminarPartido(partido.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Eliminar partido"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Zona de subida de reportes tácticos */}
                                    {partido.estado === 'Finalizado' && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 w-full">
                                            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center">
                                                <FileText size={12} className="mr-1 text-valle-green" /> Análisis de IA Post-Partido
                                            </h4>
                                            
                                            {/* Mensaje de estado de subida */}
                                            {mensajeSubida.partidoId === partido.id && mensajeSubida.texto && (
                                                <div className={`mb-2 p-2 text-xs font-semibold rounded-md border flex items-center ${
                                                    mensajeSubida.tipo === 'procesando' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    mensajeSubida.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {mensajeSubida.tipo === 'procesando' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
                                                    {mensajeSubida.texto}
                                                </div>
                                            )}

                                            {/* Barra de progreso de subida */}
                                            {subiendo === partido.id && (
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                                                        <span>Subiendo PDF...</span>
                                                        <span>{progresoSubida}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-2 bg-valle-green rounded-full transition-all duration-200"
                                                            style={{ width: `${progresoSubida}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                                <label className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-valle-green hover:bg-valle-green-light/10 bg-white rounded-lg p-3 text-center cursor-pointer transition">
                                                    <input 
                                                        type="file" 
                                                        accept=".pdf" 
                                                        className="hidden" 
                                                        onChange={(e) => manejarCambioArchivo(e, partido.id)}
                                                        disabled={subiendo === partido.id}
                                                    />
                                                    <div className="flex items-center justify-center text-slate-600 text-xs font-bold">
                                                        <Upload size={14} className="mr-2 text-valle-gold" />
                                                        {archivoSeleccionado && mensajeSubida.partidoId === partido.id 
                                                            ? archivoSeleccionado.name 
                                                            : 'Seleccionar PDF de Estadísticas'}
                                                    </div>
                                                </label>
                                                
                                                <button 
                                                    onClick={() => manejarSubida(partido.id)}
                                                    disabled={subiendo === partido.id || !(archivoSeleccionado && mensajeSubida.partidoId === partido.id)}
                                                    className="w-full sm:w-auto px-4 py-3 sm:py-0 sm:h-11 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-60 flex items-center justify-center"
                                                >
                                                    {subiendo === partido.id ? (
                                                        <><Loader2 size={14} className="animate-spin mr-1.5" /> Subiendo...</>
                                                    ) : (
                                                        'Enviar a IA'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ================= VISTA 2: PIZARRA TÁCTICA INTERACTIVA ================= */}
            <div style={{ display: subVista === 'pizarra' ? 'block' : 'none' }}>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Barra de Herramientas Lateral */}
                    <div className="lg:col-span-1 space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="space-y-5">
                            {/* Herramientas de Dibujo */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 text-sm mb-2.5">Dibujo & Notas</h3>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color de Tiza</h4>
                                    <div className="flex space-x-2.5">
                                        {[
                                            { hex: '#ffffff', name: 'Blanco' },
                                            { hex: '#fbbf24', name: 'Oro/Amarillo' },
                                            { hex: '#f87171', name: 'Rojo' },
                                            { hex: '#60a5fa', name: 'Azul' }
                                        ].map(c => (
                                            <button
                                                key={c.hex}
                                                onClick={() => setColor(c.hex)}
                                                className={`w-8 h-8 rounded-full border-2 transition transform hover:scale-110 shadow-sm ${
                                                    color === c.hex ? 'ring-2 ring-valle-green ring-offset-2 scale-105 border-transparent' : 'border-slate-200'
                                                }`}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                                        <span>Grosor de Línea</span>
                                        <span className="font-mono text-[10px] text-slate-400">{grosor}px</span>
                                    </h4>
                                    <input
                                        type="range"
                                        min="2"
                                        max="8"
                                        className="w-full accent-valle-green"
                                        value={grosor}
                                        onChange={(e) => setGrosor(parseInt(e.target.value))}
                                    />
                                </div>
                                
                                <button
                                    onClick={limpiarPizarra}
                                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-xs font-bold transition flex items-center justify-center shadow-sm"
                                >
                                    <Trash2 size={13} className="mr-1.5" /> Limpiar Dibujos
                                </button>
                            </div>

                            {/* Controles de Fichas */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 text-sm">Fichas de Jugadores</h3>
                                    <button
                                        onClick={() => setVerFichas(!verFichas)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 text-slate-600 transition"
                                        title={verFichas ? 'Ocultar fichas' : 'Mostrar fichas'}
                                    >
                                        {verFichas ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Formación El Valle</h4>
                                    <select
                                        onChange={(e) => aplicarFormacion('valle', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-700"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Selecciona esquema --</option>
                                        <option value="1-2-1">Diamante (1-2-1)</option>
                                        <option value="2-2">Cuadrado (2-2)</option>
                                        <option value="3-1">Defensiva (3-1)</option>
                                    </select>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Formación Rival</h4>
                                    <select
                                        onChange={(e) => aplicarFormacion('rival', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-700"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Selecciona esquema --</option>
                                        <option value="1-2-1">Diamante (1-2-1)</option>
                                        <option value="2-2">Cuadrado (2-2)</option>
                                        <option value="3-1">Defensiva (3-1)</option>
                                    </select>
                                </div>

                                <button
                                    onClick={resetearFichas}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center shadow-sm"
                                >
                                    <RefreshCw size={13} className="mr-1.5" /> Reestablecer Fichas
                                </button>
                            </div>

                            {/* Playbook / Jugadas Guardadas */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                                    <FolderOpen size={16} className="text-valle-gold mr-1.5" />
                                    Playbook / Guardados
                                </h3>

                                <button
                                    onClick={() => setMostrarGuardarModal(true)}
                                    className="w-full py-2 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-black transition flex items-center justify-center shadow-md"
                                >
                                    <Save size={13} className="mr-1.5" /> Guardar Jugada Actual
                                </button>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {cargandoJugadas ? (
                                        <p className="text-[11px] text-slate-400 text-center py-2">Sincronizando playbook...</p>
                                    ) : jugadas.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 text-center py-4">No tienes jugadas guardadas.</p>
                                    ) : (
                                        jugadas.map((j) => (
                                            <div key={j.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start text-left group">
                                                <button
                                                    onClick={() => cargarJugadaTactica(j)}
                                                    className="flex-1 text-left text-[11px]"
                                                >
                                                    <p className="font-bold text-slate-800 line-clamp-1">{j.titulo}</p>
                                                    {j.descripcion && <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{j.descripcion}</p>}
                                                </button>
                                                <button
                                                    onClick={() => eliminarJugada(j.id)}
                                                    className="text-red-500 hover:text-red-700 opacity-80 hover:opacity-100 p-0.5"
                                                    title="Eliminar jugada"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Leyenda Táctica de Marca */}
                        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                            <p className="flex items-center mb-1"><span className="w-2.5 h-2.5 bg-valle-green border border-valle-gold rounded-full mr-2"></span> El Valle F.S.</p>
                            <p className="flex items-center mb-1"><span className="w-2.5 h-2.5 bg-red-600 border border-slate-900 rounded-full mr-2"></span> Equipo Rival</p>
                            <p className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-400 border border-slate-900 rounded-full mr-2 flex items-center justify-center text-[5px]">⚽</span> Balón Oficial</p>
                        </div>
                    </div>

                    {/* El Campo de Futsal */}
                    <div className="lg:col-span-3">
                        <div 
                            ref={boardRef}
                            className="relative w-full aspect-[5/3] bg-[#19331e] rounded-xl overflow-hidden shadow-2xl border border-valle-green/30 select-none cursor-crosshair touch-none"
                            onPointerDown={startDrawing}
                            onPointerMove={draw}
                            onPointerUp={stopDrawing}
                            onPointerLeave={stopDrawing}
                        >
                            {/* Cancha de Futsal SVG en Fondo */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
                                {/* Fondo Césped */}
                                <rect width="1000" height="600" fill="#1b3120" />
                                
                                {/* Rayas alternas de pasto */}
                                <g opacity="0.05">
                                    <rect x="0" width="100" height="600" fill="#ffffff" />
                                    <rect x="200" width="100" height="600" fill="#ffffff" />
                                    <rect x="400" width="100" height="600" fill="#ffffff" />
                                    <rect x="600" width="100" height="600" fill="#ffffff" />
                                    <rect x="800" width="100" height="600" fill="#ffffff" />
                                </g>
                                
                                {/* Líneas Limites */}
                                <rect x="25" y="25" width="950" height="550" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                
                                {/* Medio Campo */}
                                <line x1="500" y1="25" x2="500" y2="575" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                <circle cx="500" cy="300" r="75" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                <circle cx="500" cy="300" r="5" fill="rgba(255, 255, 255, 0.45)" />
                                
                                {/* D-Zone Izquierda (Área Penal Futsal) */}
                                <path d="M 25,120 A 150,150 0 0,1 175,220 L 175,380 A 150,150 0 0,1 25,480" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                <circle cx="175" cy="300" r="4" fill="rgba(255, 255, 255, 0.45)" />
                                <line x1="275" y1="295" x2="275" y2="305" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                
                                {/* D-Zone Derecha (Área Penal Futsal) */}
                                <path d="M 975,120 A 150,150 0 0,0 825,220 L 825,380 A 150,150 0 0,0 975,480" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                <circle cx="825" cy="300" r="4" fill="rgba(255, 255, 255, 0.45)" />
                                <line x1="725" y1="295" x2="725" y2="305" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" />
                                
                                {/* Porterías */}
                                <rect x="5" y="240" width="20" height="120" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="4" />
                                <rect x="975" y="240" width="20" height="120" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="4" />
                            </svg>

                            {/* Canvas del Lápiz */}
                            <canvas 
                                ref={canvasRef} 
                                className="absolute inset-0 w-full h-full pointer-events-auto"
                            />

                            {/* Capa de Fichas Deportivas (Drag-and-Drop) */}
                            {verFichas && tokens.map(t => (
                                <div
                                    key={t.id}
                                    onPointerDown={(e) => handleTokenPointerDown(e, t.id)}
                                    onPointerMove={(e) => handleTokenPointerMove(e, t.id)}
                                    onPointerUp={(e) => handleTokenPointerUp(e, t.id)}
                                    className={`absolute w-[4%] aspect-square rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-lg cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 select-none z-20 ${
                                        t.team === 'valle' 
                                            ? 'bg-valle-green border-2 border-valle-gold text-valle-gold font-bold' 
                                            : t.team === 'rival' 
                                            ? 'bg-red-600 border-2 border-slate-900 text-white' 
                                            : 'bg-amber-400 border-2 border-slate-900 text-slate-950 text-xs sm:text-sm p-0.5' // Balón
                                    }`}
                                    style={{ 
                                        left: `${t.x}%`, 
                                        top: `${t.y}%`,
                                        touchAction: 'none',
                                        transition: dragTokenId === t.id ? 'none' : 'left 0.2s ease-out, top 0.2s ease-out'
                                    }}
                                >
                                    {t.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Guardar Jugada */}
            {mostrarGuardarModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
                            <h3 className="font-black text-xs flex items-center">
                                <Save className="mr-1.5" size={14} /> Guardar Jugada Táctica
                            </h3>
                            <button onClick={() => setMostrarGuardarModal(false)} className="text-valle-gold/80 hover:text-white transition">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={guardarJugada} className="p-4 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Título de la Jugada</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Salida de Presión 2-2, Córner A..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green"
                                    value={nombreJugada}
                                    onChange={(e) => setNombreJugada(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción / Notas</label>
                                <textarea
                                    placeholder="Movimiento del ala izquierda y pase largo al pivot..."
                                    rows="2"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green resize-none"
                                    value={descJugada}
                                    onChange={(e) => setDescJugada(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2 bg-valle-green text-valle-gold rounded-lg text-xs font-black hover:bg-valle-green-dark transition shadow-md"
                            >
                                Guardar en Playbook
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Crear Torneo */}
            {mostrarCrearTorneo && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
                            <h3 className="font-black text-xs flex items-center">
                                <PlusCircle className="mr-1.5" size={14} /> Registrar Nuevo Torneo
                            </h3>
                            <button onClick={() => setMostrarCrearTorneo(false)} className="text-valle-gold/80 hover:text-white transition">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={manejarCrearTorneo} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Torneo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Liga Universitaria de Futsal"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                    value={nombreTorneo}
                                    onChange={(e) => setNombreTorneo(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Temporada</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 2026-I"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                        value={temporadaTorneo}
                                        onChange={(e) => setTemporadaTorneo(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                        value={fechaInicioTorneo}
                                        onChange={(e) => setFechaInicioTorneo(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                        value={fechaFinTorneo}
                                        onChange={(e) => setFechaFinTorneo(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={creandoTorneo}
                                className="w-full py-2.5 bg-valle-green text-valle-gold rounded-lg text-xs font-black hover:bg-valle-green-dark transition shadow-md disabled:opacity-50"
                            >
                                {creandoTorneo ? 'Guardando Torneo...' : 'Crear Torneo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Programar Partido */}
            {mostrarProgramarPartido && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
                            <h3 className="font-black text-xs flex items-center">
                                <Calendar className="mr-1.5" size={14} /> Programar Nuevo Partido
                            </h3>
                            <button onClick={() => setMostrarProgramarPartido(false)} className="text-valle-gold/80 hover:text-white transition">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={manejarProgramarPartido} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                            {torneos.length === 0 ? (
                                <div className="text-center p-4 bg-slate-50 border rounded-lg">
                                    <p className="text-slate-500 mb-2">Debes registrar al menos un Torneo primero.</p>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setMostrarProgramarPartido(false);
                                            setMostrarCrearTorneo(true);
                                        }}
                                        className="px-4 py-2 bg-valle-green text-valle-gold font-bold rounded-lg"
                                    >
                                        Crear Torneo Ahora
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Torneo</label>
                                        <select
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                            value={torneoIdPartido}
                                            onChange={(e) => setTorneoIdPartido(e.target.value)}
                                            required
                                        >
                                            {torneos.map(t => (
                                                <option key={t.id} value={t.id}>{t.nombre} ({t.temporada})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Equipo Local</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                                value={equipoLocalPartido}
                                                onChange={(e) => setEquipoLocalPartido(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Equipo Visitante</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Futsal Margarita"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                                value={equipoVisitantePartido}
                                                onChange={(e) => setEquipoVisitantePartido(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha y Hora</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                            value={fechaHoraPartido}
                                            onChange={(e) => setFechaHoraPartido(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={programandoPartido}
                                        className="w-full py-2.5 bg-valle-green text-valle-gold rounded-lg text-xs font-black hover:bg-valle-green-dark transition shadow-md disabled:opacity-50"
                                    >
                                        {programandoPartido ? 'Agendando...' : 'Programar Partido'}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Finalizar Partido & Registrar Plantilla */}
            {mostrarFinalizarPartido && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
                            <h3 className="font-black text-xs flex items-center">
                                <Award className="mr-1.5" size={14} /> Registrar Marcador y Plantilla Convocada
                            </h3>
                            <button onClick={() => setMostrarFinalizarPartido(null)} className="text-valle-gold/80 hover:text-white transition">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={manejarGuardarResultado} className="p-5 space-y-5 text-xs font-semibold text-slate-700">
                            {/* Marcador */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Resultado Final</h4>
                                <div className="flex items-center justify-between gap-4 max-w-xs mx-auto">
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] font-bold text-slate-600 line-clamp-1 mb-1 text-center">{mostrarFinalizarPartido.equipo_local}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-16 text-center py-2 bg-white border border-slate-200 rounded-lg text-lg font-black focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                            value={golesLocalPartido}
                                            onChange={(e) => setGolesLocalPartido(parseInt(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <span className="text-xl font-bold text-slate-400 self-end mb-2">-</span>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] font-bold text-slate-600 line-clamp-1 mb-1 text-center">{mostrarFinalizarPartido.equipo_visitante}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-16 text-center py-2 bg-white border border-slate-200 rounded-lg text-lg font-black focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-800"
                                            value={golesVisitantePartido}
                                            onChange={(e) => setGolesVisitantePartido(parseInt(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Plantilla / Jugadores Convocados */}
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                                    <span>Convocados del Partido</span>
                                    <span className="text-slate-400 font-mono">{jugadoresSeleccionados.length} seleccionados</span>
                                </h4>
                                {plantillaAtletas.length === 0 ? (
                                    <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-lg border">No hay atletas registrados en el club.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {plantillaAtletas.map(atleta => {
                                            const seleccionado = jugadoresSeleccionados.includes(atleta.atleta_id);
                                            return (
                                                <label 
                                                    key={atleta.atleta_id}
                                                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition ${
                                                        seleccionado 
                                                            ? 'bg-valle-green/5 border-valle-green/30 text-valle-green-dark' 
                                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-valle-green focus:ring-valle-green border-slate-300 w-4 h-4 cursor-pointer"
                                                        checked={seleccionado}
                                                        onChange={() => {
                                                            if (seleccionado) {
                                                                setJugadoresSeleccionados(prev => prev.filter(id => id !== atleta.atleta_id));
                                                            } else {
                                                                setJugadoresSeleccionados(prev => [...prev, atleta.atleta_id]);
                                                            }
                                                        }}
                                                    />
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold leading-tight line-clamp-1">{atleta.nombre} {atleta.apellido}</p>
                                                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">{atleta.posicion}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={guardandoResultado}
                                className="w-full py-2.5 bg-valle-green text-valle-gold rounded-lg text-xs font-black hover:bg-valle-green-dark transition shadow-md disabled:opacity-50"
                            >
                                {guardandoResultado ? 'Guardando Registro...' : 'Guardar y Finalizar Partido'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Reporte de IA Analítico */}
            {mostrarReporteModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
                        {/* Cabecera */}
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
                            <div className="flex items-center gap-2">
                                <Sparkles className="animate-pulse" size={18} />
                                <div>
                                    <h3 className="font-black text-sm">Análisis Táctico Inteligente (IA)</h3>
                                    <p className="text-[10px] text-valle-gold/75 mt-0.5 leading-none">Generado por Gemini/Groq a partir de El Valle Stats PDF</p>
                                </div>
                            </div>
                            <button onClick={() => setMostrarReporteModal(null)} className="text-valle-gold/80 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Contenido */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {cargandoReporte ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                    <Loader2 className="animate-spin text-valle-green" size={32} />
                                    <p className="text-xs text-slate-500 font-medium">Consultando reporte de IA...</p>
                                </div>
                            ) : reporteIA && reporteIA.estado === 'pendiente_procesamiento' ? (
                                <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <Loader2 className="animate-spin text-blue-500" size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 mb-1">La IA está procesando el reporte</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">El PDF fue subido correctamente. El análisis se está generando en segundo plano. Espera unos momentos y vuelve a consultar.</p>
                                    </div>
                                    <button
                                        onClick={() => abrirReporteIA(mostrarReporteModal)}
                                        className="px-5 py-2 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-bold transition flex items-center gap-2 mx-auto"
                                    >
                                        <Loader2 size={13} /> Consultar de nuevo
                                    </button>
                                </div>
                            ) : errorReporte ? (
                                <div className="text-center py-10 space-y-4 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <AlertTriangle className="text-amber-500" size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 mb-1">Sin reporte disponible</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">{errorReporte}</p>
                                    </div>
                                    <button 
                                        onClick={() => abrirReporteIA(mostrarReporteModal)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                                    >
                                        Volver a intentar
                                    </button>
                                </div>
                            ) : reporteIA && (
                                <>
                                    {/* Resumen del Partido */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dinámica del Encuentro</h4>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                                            "{reporteIA.analisis_ia?.resumen_partido || 'Análisis de partido no especificado.'}"
                                        </p>
                                    </div>

                                    {/* MVP Destacado */}
                                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 flex items-start gap-4 text-left">
                                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Jugador Destacado (MVP)</h4>
                                            <p className="text-sm font-black text-slate-800">
                                                {reporteIA.analisis_ia?.mvp ? reporteIA.analisis_ia.mvp.split(' - ')[0] : 'No asignado'}
                                            </p>
                                            <p className="text-xs text-slate-600 font-semibold mt-1">
                                                {reporteIA.analisis_ia?.mvp && reporteIA.analisis_ia.mvp.includes(' - ') 
                                                    ? reporteIA.analisis_ia.mvp.split(' - ').slice(1).join(' - ')
                                                    : reporteIA.analisis_ia?.mvp || ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Puntos Fuertes vs Mejorar */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                                            <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <ThumbsUp size={12} /> Fortalezas del Equipo
                                            </h4>
                                            <ul className="space-y-2 text-xs font-semibold text-slate-600">
                                                {Array.isArray(reporteIA.analisis_ia?.puntos_fuertes) && reporteIA.analisis_ia.puntos_fuertes.map((pf, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                        <span>{pf}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-red-50/20 p-5 rounded-2xl border border-red-100/30">
                                            <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <AlertTriangle size={12} /> Áreas a Corregir
                                            </h4>
                                            <ul className="space-y-2 text-xs font-semibold text-slate-600">
                                                {Array.isArray(reporteIA.analisis_ia?.puntos_a_mejorar) && reporteIA.analisis_ia.puntos_a_mejorar.map((pam, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                                        <span>{pam}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Análisis Táctico e Individual */}
                                    {reporteIA.analisis_ia?.analisis_individual && (
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <List size={12} /> Análisis de Desempeño y Recomendación Táctica
                                            </h4>
                                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
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
                                onClick={() => setMostrarReporteModal(null)} 
                                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition"
                            >
                                Cerrar Reporte
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}