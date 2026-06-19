import { useState, useEffect } from 'react';
import api from './api';
import { Users, User, Shield, Target, Award, Search, Loader2, Eye, Pencil, X } from 'lucide-react';
import FichaTecnica from './FichaTecnica';

export default function Plantilla({ crearNotificacion = null, rolUsuario = '' }) {
    const [jugadores, setJugadores] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [selectedAtletaId, setSelectedAtletaId] = useState(null);
    const [editandoDorsal, setEditandoDorsal] = useState(null);
    const [nuevoDorsal, setNuevoDorsal] = useState('');
    const [guardandoDorsal, setGuardandoDorsal] = useState(false);

    const guardarDorsal = async (e) => {
        e.preventDefault();
        if (!editandoDorsal) return;
        setGuardandoDorsal(true);
        try {
            const valorDorsal = nuevoDorsal.trim() !== '' ? parseInt(nuevoDorsal) : null;
            await api.put(`/atletas/${editandoDorsal.atleta_id}`, {
                numero_camisa: valorDorsal
            });
            
            setJugadores(prev => prev.map(j => {
                if (j.atleta_id === editandoDorsal.atleta_id) {
                    return { ...j, numero_camisa: valorDorsal };
                }
                return j;
            }));
            
            if (crearNotificacion) {
                crearNotificacion(
                    "Dorsal Asignado",
                    `Se asignó el número #${valorDorsal !== null ? valorDorsal : '?'} a ${editandoDorsal.nombre || editandoDorsal.usuario?.nombre}`,
                    "success"
                );
            }
            setEditandoDorsal(null);
            setNuevoDorsal('');
        } catch (error) {
            console.error("Error al asignar dorsal:", error);
            const msg = error.response?.data?.detail || "No se pudo asignar el dorsal. Inténtalo de nuevo.";
            if (crearNotificacion) {
                crearNotificacion("Error", msg, "error");
            } else {
                alert(msg);
            }
        } finally {
            setGuardandoDorsal(false);
        }
    };

    useEffect(() => {
        const obtenerJugadores = async () => {
            try {
                const respuesta = await api.get('/atletas/');

                console.log("DATOS REALES DEL BACKEND:", respuesta.data);

                if (Array.isArray(respuesta.data)) {
                    setJugadores(respuesta.data);
                } else {
                    console.error("El backend no devolvió una lista:", respuesta.data);
                    setJugadores([]);
                }
            } catch (err) {
                console.error("Error al obtener jugadores:", err);
                setError('No se pudo conectar al endpoint de atletas de la API.');
                setJugadores([
                    { atleta_id: 1, nombre: "Carlos", apellido: "Mendoza", posicion: "Cierre", numero_camisa: 4, detalles: "Fichaje 2025" },
                    { atleta_id: 2, nombre: "Luis", apellido: "Gómez", posicion: "Ala", numero_camisa: 7, detalles: "Fichaje 2025" },
                ]);
            } finally {
                setCargando(false);
            }
        };

        obtenerJugadores();
    }, []);

    const jugadoresFiltrados = jugadores.filter(jugador => {
        const nombreCompleto = `${jugador.nombre || ''} ${jugador.apellido || ''}`.toLowerCase();
        const posicion = (jugador.posicion || '').toLowerCase();
        const termino = busqueda.toLowerCase();

        return nombreCompleto.includes(termino) || posicion.includes(termino);
    });

    const obtenerIconoPosicion = (posicion) => {
        switch ((posicion || '').toLowerCase()) {
            case 'portero': return <Shield className="text-valle-green" size={16} />;
            case 'cierre': return <Shield className="text-valle-gold" size={16} />;
            case 'ala': return <Target className="text-valle-green" size={16} />;
            case 'pívot': case 'pivot': return <Award className="text-valle-gold" size={16} />;
            default: return <User className="text-slate-500" size={16} />;
        }
    };

    const obtenerIniciales = (nombre, apellido) => {
        const inicialNombre = nombre ? nombre.charAt(0).toUpperCase() : 'U';
        const inicialApellido = apellido ? apellido.charAt(0).toUpperCase() : 'N';
        return `${inicialNombre}${inicialApellido}`;
    };

    if (selectedAtletaId) {
        return <FichaTecnica atletaId={selectedAtletaId} onBack={() => setSelectedAtletaId(null)} crearNotificacion={crearNotificacion} />;
    }

    return (
        <div className="space-y-6 w-full mx-auto pb-8 px-2 sm:px-4 lg:px-6">

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
                <div className="flex items-center space-x-3 text-valle-black">
                    <div className="w-10 h-10 rounded-xl bg-valle-green flex items-center justify-center shadow-md border border-valle-gold/20">
                        <Users size={20} className="text-valle-gold" />
                    </div>
                    <div>
                        <span className="font-bold text-sm font-display block">Fichas Técnicas de la Plantilla</span>
                        {rolUsuario === 'nutricionista' && (
                            <span className="text-xs text-valle-green font-bold uppercase tracking-wider block">Vista de Control Biométrico</span>
                        )}
                    </div>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o posición..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10 transition-all duration-200"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="bg-amber-50/80 backdrop-blur-sm border-l-4 border-amber-500 p-3.5 rounded-lg text-xs text-amber-800 font-semibold animate-fade-in-up">
                    ⚠ {error} Mostrando datos de demostración.
                </div>
            )}

            {cargando ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="animate-spin mb-2 text-valle-green" size={32} />
                    <p className="text-xs font-semibold">Sincronizando plantilla...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {jugadoresFiltrados.map((jugador, index) => {
                        const nombreReal = jugador.usuario?.nombre || jugador.nombre || 'Jugador';
                        const apellidoReal = jugador.usuario?.apellido || jugador.apellido || 'Desconocido';
                        const posicionReal = jugador.posicion_principal || jugador.posicion || 'Sin asignar';
                        const iniciales = obtenerIniciales(nombreReal, apellidoReal);

                        return (
                            <div
                                key={jugador.atleta_id || index}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md hover:border-valle-gold/30 transition-all duration-300 group flex flex-col justify-between cursor-pointer animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => setSelectedAtletaId(jugador.atleta_id)}
                            >
                                <div className="p-5 flex flex-col items-center text-center relative">
                                    {(rolUsuario === 'admin' || rolUsuario === 'entrenador') ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditandoDorsal(jugador);
                                                setNuevoDorsal(jugador.numero_camisa !== null && jugador.numero_camisa !== undefined ? String(jugador.numero_camisa) : '');
                                            }}
                                            className="absolute top-4 right-4 text-xs font-black text-valle-green hover:text-white bg-slate-100 hover:bg-valle-green border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 transition shadow-sm z-20 group/btn"
                                            title="Editar dorsal"
                                        >
                                            <span>#{jugador.numero_camisa !== null && jugador.numero_camisa !== undefined ? jugador.numero_camisa : '?'}</span>
                                            <Pencil size={10} className="text-slate-400 group-hover/btn:text-white shrink-0" />
                                        </button>
                                    ) : (
                                        <span className="absolute top-4 right-4 text-2xl font-black text-slate-300 select-none font-display">
                                            #{jugador.numero_camisa !== null && jugador.numero_camisa !== undefined ? jugador.numero_camisa : '?'}
                                        </span>
                                    )}

                                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100 text-slate-700 font-bold text-base group-hover:bg-valle-green group-hover:text-white transition duration-300 shadow-sm font-display">
                                        {iniciales}
                                    </div>

                                    <h4 className="font-bold text-slate-800 text-sm tracking-tight capitalize font-display">
                                        {nombreReal} {apellidoReal}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">ID del Atleta: {jugador.atleta_id}</p>
 
                                    {rolUsuario === 'nutricionista' ? (
                                        <div className="mt-4 w-full bg-slate-50 rounded-xl p-3 border border-slate-100/60 text-left text-xs space-y-1.5">
                                            <div className="flex justify-between text-slate-500 font-medium">
                                                <span>Peso Fichaje:</span>
                                                <span className="font-bold text-slate-700">{jugador.peso_base ? `${jugador.peso_base} kg` : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500 font-medium">
                                                <span>Peso Actual:</span>
                                                <span className="font-bold text-valle-green">{jugador.peso_actual ? `${jugador.peso_actual} kg` : 'Sin reg.'}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500 font-medium pt-1.5 border-t border-slate-200/60">
                                                <span>IMC Actual:</span>
                                                <span className={`font-bold ${
                                                    jugador.imc_actual && jugador.imc_actual >= 18.5 && jugador.imc_actual <= 24.9 
                                                        ? 'text-emerald-600' 
                                                        : jugador.imc_actual 
                                                            ? 'text-amber-600' 
                                                            : 'text-slate-400'
                                                }`}>
                                                    {jugador.imc_actual ? `${jugador.imc_actual}` : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex items-center space-x-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 group-hover:border-slate-200 transition">
                                            {obtenerIconoPosicion(posicionReal)}
                                            <span className="text-xs font-semibold text-slate-600 capitalize">{posicionReal}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 group-hover:bg-valle-green group-hover:text-white px-4 py-2.5 border-t border-slate-100 flex justify-between items-center text-xs transition-all duration-200">
                                    <span className="font-bold flex items-center">
                                        <Eye size={12} className="mr-1" /> Ver Ficha
                                    </span>
                                    <span className="font-bold">{jugador.estado_actual || 'Activo'}</span>
                                </div>
                            </div>
                        );
                    })}

                    {jugadoresFiltrados.length === 0 && (
                        <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400 text-sm animate-fade-in-up">
                            No se encontraron atletas registrados en el club.
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Edición de Dorsal */}
            {editandoDorsal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl overflow-hidden animate-fadeIn relative">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold rounded-t-xl">
                            <h3 className="font-black text-sm flex items-center">
                                <Shield className="mr-2" size={16} /> Asignar Dorsal
                            </h3>
                            <button onClick={() => setEditandoDorsal(null)} className="text-valle-gold/80 hover:text-white transition cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={guardarDorsal} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-2">
                                    Jugador: <span className="capitalize">{editandoDorsal.nombre} {editandoDorsal.apellido}</span>
                                </p>
                                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-xs font-bold">
                                    Número de Camisa (Dorsal)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    placeholder="Ej: 10"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium text-sm"
                                    value={nuevoDorsal}
                                    onChange={(e) => setNuevoDorsal(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Deja vacío si deseas retirar el dorsal asignado.</p>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditandoDorsal(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoDorsal}
                                    className="px-4 py-2 bg-valle-green text-valle-gold rounded-lg hover:bg-valle-green-dark transition shadow-md disabled:opacity-50 cursor-pointer"
                                >
                                    {guardandoDorsal ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}