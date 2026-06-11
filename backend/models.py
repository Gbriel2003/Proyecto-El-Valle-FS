from sqlalchemy import Column, Integer, String, Boolean, Float, Date, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func
from database import Base

# ==========================================
# MÓDULO DE USUARIOS Y PERFILES
# ==========================================

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    rol = Column(String(20))
    fecha_registro = Column(DateTime, server_default=func.now())
    debe_cambiar_password = Column(Boolean, default=True, nullable=False)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiration = Column(DateTime, nullable=True)

    # Relación uno a uno con el perfil del atleta
    perfil = relationship("PerfilAtleta", back_populates="usuario", uselist=False)
    registros_ia_creados = relationship("RegistroIA", foreign_keys='RegistroIA.usuario_id', back_populates="usuario")

class PerfilAtleta(Base):
    __tablename__ = "perfil_atleta"

    atleta_id = Column(Integer, ForeignKey("usuarios.id"), primary_key=True, index=True)
    fecha_nacimiento = Column(Date)
    peso_base = Column(Float) # Float maneja los valores numeric(5,2)
    altura_cm = Column(Integer)
    posicion_especifica = Column(String(50))
    pierna_habil = Column(String(10))
    dieta_asignada_id = Column(Integer, ForeignKey("propuestas_dieta.id"), nullable=True)

    # Relaciones hacia arriba (Usuario) y hacia abajo (Estadísticas, Nutrición, etc)
    usuario = relationship("Usuario", back_populates="perfil")
    cargas = relationship("CargaAtleta", back_populates="atleta")
    estadisticas = relationship("EstadisticasTacticas", back_populates="atleta")
    registros_nutricionales = relationship("RegistroNutricional", back_populates="atleta")
    registros_biometricos = relationship("RegistroBiometrico", back_populates="atleta")
    registros_ia = relationship("RegistroIA", foreign_keys='RegistroIA.atleta_id', back_populates="atleta")
    lesiones = relationship("Lesion", back_populates="atleta")
    dieta_asignada = relationship("PropuestaDieta")

# ==========================================
# MÓDULO DE ENTRENAMIENTOS
# ==========================================

class SesionEntrenamiento(Base):
    __tablename__ = "sesiones_entrenamiento"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, server_default=func.current_date())
    tipo_sesion = Column(String(50))
    descripcion = Column(Text)
    duracion_min = Column(Integer)

    cargas = relationship("CargaAtleta", back_populates="sesion")

class CargaAtleta(Base):
    __tablename__ = "carga_atleta"

    id = Column(Integer, primary_key=True, index=True)
    sesion_id = Column(Integer, ForeignKey("sesiones_entrenamiento.id"))
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id"))
    asistencia = Column(Boolean, default=True)
    rpe_esfuerzo = Column(Integer)
    saltos_cm = Column(Float)
    tiempo_sprint_30m = Column(Float)

    sesion = relationship("SesionEntrenamiento", back_populates="cargas")
    atleta = relationship("PerfilAtleta", back_populates="cargas")

# ==========================================
# MÓDULO DE PARTIDOS Y TÁCTICA
# ==========================================
class Partido(Base):
    __tablename__ = "partidos"

    id = Column(Integer, primary_key=True, index=True)
    torneo_id = Column(Integer, ForeignKey("torneos.id"))
    equipo_local = Column(String)       
    equipo_visitante = Column(String)   
    fecha_hora = Column(DateTime)
    goles_local = Column(Integer, default=0)
    goles_visitante = Column(Integer, default=0)
    estado = Column(String, default="Programado")

    # 🔌 ¡AQUÍ ESTÁ EL CABLE REPARADO!
    estadisticas = relationship("EstadisticasTacticas", back_populates="partido")
    torneo = relationship("Torneo", back_populates="partidos")
    reportes = relationship("ReportePartido", back_populates="partido")

class EstadisticasTacticas(Base):
    __tablename__ = "estadisticas_tacticas"

    id = Column(Integer, primary_key=True, index=True)
    partido_id = Column(Integer, ForeignKey("partidos.id"))
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id"))
    goles = Column(Integer, default=0)
    asistencias = Column(Integer, default=0)
    recuperaciones = Column(Integer, default=0)
    errores_posicionamiento = Column(Integer, default=0)
    minutos_jugados = Column(Integer)

    partido = relationship("Partido", back_populates="estadisticas")
    atleta = relationship("PerfilAtleta", back_populates="estadisticas")

# ==========================================
# MÓDULO NUTRICIONAL Y BIOMÉTRICO
# ==========================================

class RegistroNutricional(Base):
    __tablename__ = "registro_nutricional"

    id = Column(Integer, primary_key=True, index=True)
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id"))
    fecha = Column(Date, server_default=func.current_date())
    frecuencia_comidas = Column(Integer)
    suplementacion = Column(String(255))
    hidratacion_litros = Column(Float)
    calidad_descanso = Column(Integer)
    plan_alimentacion = Column(String(255), nullable=True)

    atleta = relationship("PerfilAtleta", back_populates="registros_nutricionales")

# ==========================================
# MÓDULO DE INTELIGENCIA ARTIFICIAL
# ==========================================

class RegistroIA(Base):
    __tablename__ = "registro_ia"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id"), nullable=False)
    modulo = Column(String(50), nullable=False)
    prompt = Column(Text, nullable=False)
    respuesta = Column(Text, nullable=False)
    proveedor = Column(String(50), nullable=False)
    modelo = Column(String(100), nullable=False)
    fecha_registro = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="registros_ia_creados")
    atleta = relationship("PerfilAtleta", foreign_keys=[atleta_id], back_populates="registros_ia")

class ReportePartido(Base):
    __tablename__ = "reportes_pdf"

    id = Column(Integer, primary_key=True, index=True)
    partido_id = Column(Integer, ForeignKey("partidos.id"))
    ruta_archivo = Column(String) 
    analisis_ia = Column(JSON, nullable=True) 
    fecha_subida = Column(DateTime, default=datetime.now)

    partido = relationship("Partido", back_populates="reportes")

# ==========================================
# MÓDULO DE TORNEOS Y EVENTOS
# ==========================================

class Torneo(Base):
    __tablename__ = "torneos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True) 
    temporada = Column(String)          
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)

    partidos = relationship("Partido", back_populates="torneo")

class EventoPartido(Base):
    __tablename__ = "eventos_partido"

    id = Column(Integer, primary_key=True, index=True)
    partido_id = Column(Integer, ForeignKey("partidos.id"))
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id")) 
    tipo_evento = Column(String) 
    minuto = Column(Integer)

class RegistroBiometrico(Base):
    __tablename__ = "registro_biometrico"

    id = Column(Integer, primary_key=True, index=True)
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id"))
    fecha = Column(Date, server_default=func.current_date())
    peso_kg = Column(Float)
    altura_cm = Column(Float)
    imc = Column(Float)

    atleta = relationship("PerfilAtleta", back_populates="registros_biometricos")

class Lesion(Base):
    __tablename__ = "lesiones"

    id = Column(Integer, primary_key=True, index=True)
    atleta_id = Column(Integer, ForeignKey("perfil_atleta.atleta_id"), nullable=False)
    tipo_lesion = Column(String(100), nullable=False)
    gravedad = Column(String(20), nullable=False) # Leve, Media, Grave
    fecha_inicio = Column(Date, nullable=False, server_default=func.current_date())
    fecha_alta = Column(Date, nullable=True)
    descripcion = Column(Text, nullable=True)
    rehabilitacion = Column(Text, nullable=True)

    atleta = relationship("PerfilAtleta", back_populates="lesiones")

class JugadaGuardada(Base):
    __tablename__ = "jugadas_guardadas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    tokens_json = Column(JSON, nullable=False)
    trazos_png = Column(Text, nullable=True) # Guardará la imagen en base64 para poder recrear los trazos
    fecha_creacion = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario")

class PropuestaDieta(Base):
    __tablename__ = "propuestas_dieta"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    calorias = Column(Integer, nullable=True)
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())