import React, { useState, useEffect } from 'react';
import api from './api';
import { Calendar, MapPin, Clock, Flag, ChevronRight, Shield, FileText, Upload, Loader2, CheckCircle } from 'lucide-react';

export default function Tactica() {
    const [partidos, setPartidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    
    // Estados para la subida de archivos
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [subiendo, setSubiendo] = useState(null);
    const [mensajeSubida, setMensajeSubida] = useState({ partidoId: null, texto: '', tipo: '' });

    useEffect(() => {
        const obtenerPartidos = async () => {
            try {
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
                        goles_visitante: 0
                    },
                    {
                        id: 2,
                        equipo_local: "Futsal Nueva Esparta",
                        equipo_visitante: "El Valle F.S.",
                        fecha_hora: "2026-05-10T18:30:00",
                        estado: "Finalizado",
                        goles_local: 2,
                        goles_visitante: 4
                    }
                ]);
            } finally {
                setCargando(false);
            }
        };

        obtenerPartidos();
    }, []);

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

    const manejarSubida = async (partidoId) => {
        if (!archivoSeleccionado) {
            setMensajeSubida({ partidoId, texto: 'Por favor selecciona un archivo primero', tipo: 'error' });
            return;
        }

        setSubiendo(partidoId);
        setMensajeSubida({ partidoId, texto: '', tipo: '' });

        const formData = new FormData();
        formData.append('file', archivoSeleccionado);

        try {
            const respuesta = await api.post(`/partidos/${partidoId}/subir-reporte`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setMensajeSubida({ 
                partidoId, 
                texto: '¡Reporte enviado! La IA lo está procesando en segundo plano.', 
                tipo: 'exito' 
            });
            setArchivoSeleccionado(null);
            
            setTimeout(() => {
                setMensajeSubida({ partidoId: null, texto: '', tipo: '' });
            }, 5000);
            
        } catch (error) {
            console.error(error);
            setMensajeSubida({ 
                partidoId, 
                texto: 'Error al subir el reporte. Verifica tu conexión.', 
                tipo: 'error' 
            });
        } finally {
            setSubiendo(null);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Cabecera */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-valle-black flex items-center">
                        <Flag className="text-valle-green mr-2" size={24} />
                        Pizarra Táctica y Calendario
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Gestión de encuentros y análisis post-partido.</p>
                </div>
                <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition shadow-sm flex items-center">
                    <Calendar size={18} className="mr-2" /> Programar Partido
                </button>
            </div>

            {error && (
                <div className="bg-valle-gold-light/20 border-l-4 border-valle-gold p-3 rounded text-xs text-slate-800 font-medium">
                    {error} Mostrando entorno de simulación táctica.
                </div>
            )}

            {/* Cuadrícula de Partidos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {partidos.map((partido) => (
                    <div key={partido.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition">

                        {/* Estado del Partido */}
                        <div className={`px-4 py-2.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider ${partido.estado === 'Finalizado' ? 'bg-slate-100 text-slate-600' : 'bg-valle-green-light/20 text-valle-green-dark border-b border-valle-green-light/30'}`}>
                            <span className="flex items-center">
                                {partido.estado === 'Finalizado' ? <FileText size={14} className="mr-1.5" /> : <Clock size={14} className="mr-1.5" />}
                                {partido.estado}
                            </span>
                            <span>Jornada Oficial</span>
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

                        {/* Pie del partido (Fecha y Detalles) */}
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col justify-between gap-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                                <div className="flex flex-col text-xs text-slate-500 font-medium">
                                    <span className="flex items-center mb-1"><Calendar size={12} className="mr-1.5 text-valle-gold" /> {formatearFecha(partido.fecha_hora)}</span>
                                    <span className="flex items-center"><MapPin size={12} className="mr-1.5 text-valle-gold" /> {formatearHora(partido.fecha_hora)} - Cancha Local</span>
                                </div>

                                <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center shadow-sm w-full sm:w-auto justify-center">
                                    {partido.estado === 'Finalizado' ? 'Ver Reporte Táctico' : 'Detalles del Encuentro'}
                                    <ChevronRight size={14} className="ml-1" />
                                </button>
                            </div>
                            
                            {/* ZONA DE CARGA DE REPORTES */}
                            {partido.estado === 'Finalizado' && (
                                <div className="mt-3 pt-3 border-t border-slate-200 w-full">
                                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center">
                                        <FileText size={12} className="mr-1 text-valle-green" /> Análisis de IA Post-Partido
                                    </h4>
                                    
                                    {mensajeSubida.partidoId === partido.id && mensajeSubida.texto && (
                                        <div className={`mb-3 p-2 text-xs font-semibold rounded-md border flex items-center ${
                                            mensajeSubida.tipo === 'exito' ? 'bg-valle-green-light/20 text-valle-green-dark border-valle-green-light' :
                                            mensajeSubida.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                            {mensajeSubida.tipo === 'exito' ? <CheckCircle size={14} className="mr-1.5" /> : null}
                                            {mensajeSubida.texto}
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
                                            disabled={subiendo === partido.id || (mensajeSubida.partidoId === partido.id && !archivoSeleccionado)}
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
                ))}
            </div>
        </div>
    );
}