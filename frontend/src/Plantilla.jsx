import React, { useState, useEffect } from 'react';
import api from './api';
import { Users, User, Shield, Target, Award, Search, Loader2 } from 'lucide-react';

export default function Plantilla() {
    const [jugadores, setJugadores] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 text-valle-black">
                    <div className="w-10 h-10 rounded-full bg-valle-green flex items-center justify-center shadow-sm">
                        <Users size={20} className="text-valle-gold" />
                    </div>
                    <span className="font-bold text-sm">Fichas Técnicas de la Plantilla</span>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o posición..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green transition"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-800 font-medium">
                    {error} Mostrando datos de demostración.
                </div>
            )}

            {cargando ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="animate-spin mb-2 text-valle-green" size={32} />
                    <p className="text-xs">Sincronizando plantilla...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {jugadoresFiltrados.map((jugador) => {
                        const nombreReal = jugador.usuario?.nombre || jugador.nombre || 'Jugador';
                        const apellidoReal = jugador.usuario?.apellido || jugador.apellido || 'Desconocido';
                        const posicionReal = jugador.posicion_principal || jugador.posicion || 'Sin asignar';
                        const iniciales = obtenerIniciales(nombreReal, apellidoReal);

                        return (
                            <div
                                key={jugador.atleta_id || Math.random()}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition duration-300 group flex flex-col justify-between"
                            >
                                <div className="p-5 flex flex-col items-center text-center relative">
                                    <span className="absolute top-4 right-4 text-2xl font-black text-slate-100 group-hover:text-slate-200 transition select-none">
                                        #{jugador.numero_camisa || '?'}
                                    </span>

                                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100 text-slate-700 font-bold text-base group-hover:bg-valle-green group-hover:text-white transition duration-300 shadow-sm">
                                        {iniciales}
                                    </div>

                                    <h4 className="font-bold text-slate-800 text-sm tracking-tight capitalize">
                                        {nombreReal} {apellidoReal}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">ID del Atleta: {jugador.atleta_id}</p>

                                    <div className="mt-4 flex items-center space-x-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 group-hover:border-slate-200 transition">
                                        {obtenerIconoPosicion(posicionReal)}
                                        <span className="text-xs font-semibold text-slate-600 capitalize">{posicionReal}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] transition">
                                    <span className="text-slate-500">Estado:</span>
                                    <span className="font-bold text-valle-green">{jugador.estado_actual || 'Activo'}</span>
                                </div>
                            </div>
                        );
                    })}

                    {jugadoresFiltrados.length === 0 && (
                        <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400 text-sm">
                            No se encontraron atletas registrados en el club.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}