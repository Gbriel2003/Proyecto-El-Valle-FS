import React, { useState, useEffect } from 'react';
import api from './api';
import { Activity, Timer, Save, Users, PlusCircle, CheckCircle, ArrowLeft, Trash2, Edit2, ChevronRight } from 'lucide-react';

export default function RegistroEntrenamiento() {
    const [vista, setVista] = useState('lista');
    
    const [sesiones, setSesiones] = useState([]);
    const [jugadores, setJugadores] = useState([]);
    
    const [sesionActiva, setSesionActiva] = useState(null);
    const [atletasEvaluados, setAtletasEvaluados] = useState([]);
    
    const [sesionForm, setSesionForm] = useState({ tipo_sesion: 'Físico', descripcion: '', duracion_min: 90 });
    const [cargaForm, setCargaForm] = useState({ atleta_id: '', rpe_esfuerzo: 5, saltos_cm: '', tiempo_sprint_30m: '' });
    
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [cargando, setCargando] = useState(false);

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
            mostrarMensaje('error', 'Error al cargar los datos del servidor.');
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const mostrarMensaje = (tipo, texto) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    };

    const crearSesion = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const res = await api.post('/entrenamientos/', sesionForm);
            mostrarMensaje('exito', '¡Sesión creada exitosamente!');
            setSesionActiva(res.data);
            setAtletasEvaluados([]);
            setVista('detalle');
            cargarDatos();
        } catch (error) {
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
            cargarDatos();
        } catch (error) {
            mostrarMensaje('error', 'Error al eliminar la sesión.');
        }
    };

    const abrirDetalle = async (sesion) => {
        setCargando(true);
        try {
            const resCargas = await api.get(`/entrenamientos/${sesion.id}/cargas/`);
            setAtletasEvaluados(resCargas.data.atletas_evaluados);
            setSesionActiva(sesion);
            setVista('detalle');
        } catch (error) {
            mostrarMensaje('error', 'Error al abrir la sesión.');
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
            await api.post(`/entrenamientos/${sesionActiva.id}/cargas/`, cargaForm);
            mostrarMensaje('exito', 'Carga registrada correctamente.');
            
            setAtletasEvaluados([...atletasEvaluados, parseInt(cargaForm.atleta_id)]);
            setCargaForm({ atleta_id: '', rpe_esfuerzo: 5, saltos_cm: '', tiempo_sprint_30m: '' });
        } catch (error) {
            mostrarMensaje('error', 'Error al registrar la carga del atleta.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            
            {mensaje.texto && (
                <div className={`p-4 rounded-lg text-sm font-medium border-l-4 ${mensaje.tipo === 'exito' ? 'bg-green-50 border-valle-green text-valle-green-dark' : 'bg-red-50 border-red-500 text-red-800'}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* VISTA 1: LISTA HISTÓRICA */}
            {vista === 'lista' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50 gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-valle-black flex items-center">
                                <Activity className="mr-2 text-valle-green" size={20} /> Historial de Entrenamientos
                            </h2>
                            <p className="text-sm text-slate-500">Administra las sesiones globales del equipo.</p>
                        </div>
                        <button 
                            onClick={() => { setSesionForm({ tipo_sesion: 'Físico', descripcion: '', duracion_min: 90 }); setVista('crear'); }}
                            className="bg-valle-green hover:bg-valle-green-dark text-valle-gold px-4 py-2 rounded-lg text-sm font-bold flex items-center transition justify-center shadow-sm"
                        >
                            <PlusCircle size={18} className="mr-2" /> Nueva Sesión
                        </button>
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
                                {sesiones.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">No hay sesiones registradas. Crea la primera.</td>
                                    </tr>
                                ) : (
                                    sesiones.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 font-medium text-slate-700 whitespace-nowrap">{s.fecha}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                                                    s.tipo_sesion === 'Físico' ? 'bg-orange-100 text-orange-700' :
                                                    s.tipo_sesion === 'Táctico' ? 'bg-valle-green-light text-white' :
                                                    s.tipo_sesion === 'Recuperación' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-valle-gold-light text-valle-black'
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
                                                <button onClick={() => abrirDetalle(s)} className="p-2 text-slate-400 hover:text-valle-green hover:bg-slate-100 rounded-lg transition" title="Registrar Cargas">
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
                            <select
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                value={sesionForm.tipo_sesion}
                                onChange={(e) => setSesionForm({ ...sesionForm, tipo_sesion: e.target.value })}
                            >
                                <option>Físico</option>
                                <option>Táctico</option>
                                <option>Recuperación</option>
                                <option>Partido Amistoso</option>
                            </select>
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* RESUMEN DE LA SESIÓN */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                                <div className="flex items-center mb-4">
                                    <CheckCircle className="text-valle-green mr-2" size={20} />
                                    <h3 className="font-bold text-lg text-slate-800">Sesión Activa</h3>
                                </div>
                                <div className="space-y-3 text-sm text-slate-600">
                                    <p><strong className="text-slate-800">Fecha:</strong> {sesionActiva.fecha}</p>
                                    <p><strong className="text-slate-800">Tipo:</strong> {sesionActiva.tipo_sesion}</p>
                                    <p><strong className="text-slate-800">Duración:</strong> {sesionActiva.duracion_min} min</p>
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="italic text-slate-500">"{sesionActiva.descripcion}"</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Estadísticas rápidas */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jugadores Evaluados</p>
                                    <p className="text-2xl font-black text-valle-black mt-1">{atletasEvaluados.length} <span className="text-sm font-medium text-slate-400">/ {jugadores.length}</span></p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <Users className="text-valle-green" size={24} />
                                </div>
                            </div>
                        </div>

                        {/* FORMULARIO DE CARGAS INDIVIDUALES */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                            <div className="flex items-center mb-8">
                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mr-3">
                                    <Activity size={20} className="text-valle-green" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Carga Física Individual</h3>
                                    <p className="text-sm text-slate-500 hidden sm:block">Selecciona al jugador de la lista y registra sus métricas.</p>
                                </div>
                            </div>

                            <form onSubmit={registrarCarga} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar Jugador</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green font-medium text-slate-700"
                                        value={cargaForm.atleta_id}
                                        onChange={(e) => setCargaForm({ ...cargaForm, atleta_id: e.target.value })}
                                    >
                                        <option value="">-- Elige un jugador de la plantilla --</option>
                                        {jugadores.map(j => {
                                            const evaluado = atletasEvaluados.includes(j.atleta_id);
                                            return (
                                                <option key={j.atleta_id} value={j.atleta_id} disabled={evaluado}>
                                                    {j.nombre} {j.apellido} {evaluado ? ' ✅ (Evaluado)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                                    <label className="flex justify-between text-sm font-semibold text-slate-700 mb-3">
                                        <span>Percepción de Esfuerzo (RPE)</span>
                                        <span className="text-valle-green font-bold bg-white px-3 py-1 rounded shadow-sm border border-slate-200">{cargaForm.rpe_esfuerzo} / 10</span>
                                    </label>
                                    <input
                                        type="range" min="1" max="10"
                                        className="w-full accent-valle-green"
                                        value={cargaForm.rpe_esfuerzo}
                                        onChange={(e) => setCargaForm({ ...cargaForm, rpe_esfuerzo: e.target.value })}
                                    />
                                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 mt-2 uppercase font-bold tracking-wider">
                                        <span>1 - Suave</span>
                                        <span>10 - Extremo</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Salto Vertical (cm)</label>
                                        <input
                                            type="number" step="0.1" placeholder="Ej: 45.5"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                            value={cargaForm.saltos_cm}
                                            onChange={(e) => setCargaForm({ ...cargaForm, saltos_cm: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sprint 30m (segs)</label>
                                        <input
                                            type="number" step="0.1" placeholder="Ej: 4.2"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-valle-green focus:border-valle-green"
                                            value={cargaForm.tiempo_sprint_30m}
                                            onChange={(e) => setCargaForm({ ...cargaForm, tiempo_sprint_30m: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button type="submit" disabled={cargando} className="w-full py-3.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-sm font-bold transition shadow-sm flex justify-center items-center">
                                        <Save size={18} className="mr-2" /> Guardar Carga
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}