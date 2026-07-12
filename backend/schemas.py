from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, Any

# ==========================================
# ESQUEMAS DE USUARIO (REGISTRO)
# ==========================================

class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr  
    password: str
    rol: str
    telefono: str
    cedula: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: EmailStr
    rol: str
    debe_cambiar_password: bool
    fecha_registro: datetime
    telefono: Optional[str] = None
    cedula: Optional[str] = None
    foto_perfil: Optional[str] = None

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    cedula: Optional[str] = None
    rol: Optional[str] = None

    class Config:
        from_attributes = True

class UsuarioProfileUpdate(BaseModel):
    telefono: str

# ==========================================
# ESQUEMAS DE SEGURIDAD (LOGIN Y TOKENS)
# ==========================================

class UsuarioLogin(BaseModel):
    correo: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    debe_cambiar_password: bool = False

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    correo: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordAdminRequest(BaseModel):
    new_password: str

# ==========================================
# ESQUEMAS DE DIETAS Y NUTRICIÓN
# ==========================================

class PropuestaDietaCreate(BaseModel):
    nombre: str
    descripcion: str
    calorias: Optional[int] = None

class PropuestaDietaResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str
    calorias: Optional[int] = None
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE PERFIL DE ATLETA (JUGADORES)
# ==========================================

class PerfilAtletaCreate(BaseModel):
    atleta_id: int  
    fecha_nacimiento: date  
    peso_base: float
    altura_cm: int
    posicion_especifica: str  
    pierna_habil: str         
    numero_camisa: Optional[int] = None

class PerfilAtletaResponse(BaseModel):
    atleta_id: int
    fecha_nacimiento: Optional[date] = None
    peso_base: Optional[float] = None
    altura_cm: Optional[int] = None
    posicion_especifica: Optional[str] = None
    pierna_habil: Optional[str] = None
    numero_camisa: Optional[int] = None
    dieta_asignada_id: Optional[int] = None
    dieta_asignada: Optional[PropuestaDietaResponse] = None

    class Config:
        from_attributes = True

class PerfilAtletaUpdate(BaseModel):
    peso_base: Optional[float] = None
    altura_cm: Optional[int] = None
    posicion_especifica: Optional[str] = None
    pierna_habil: Optional[str] = None
    numero_camisa: Optional[int] = None

# ==========================================
# ESQUEMAS DE TORNEOS Y PARTIDOS
# ==========================================

class TorneoCreate(BaseModel):
    nombre: str
    temporada: str
    fecha_inicio: date
    fecha_fin: date
    estado: Optional[str] = "Activo"

class TorneoResponse(TorneoCreate):
    id: int
    class Config:
        from_attributes = True

class PartidoCreate(BaseModel):
    torneo_id: int
    equipo_local: str
    equipo_visitante: str
    fecha_hora: datetime
    jugadores_ids: list[int] = []

class PartidoResponse(PartidoCreate):
    id: int
    goles_local: int
    goles_visitante: int
    estado: str
    tiene_reporte: bool = False
    
    class Config:
        from_attributes = True

class PartidoUpdate(BaseModel):
    goles_local: int
    goles_visitante: int
    estado: str  # "Finalizado"
    jugadores_ids: list[int]

class EstadisticaPersonalAtleta(BaseModel):
    goles: int
    asistencias: int
    recuperaciones: int
    errores_posicionamiento: int
    minutos_jugados: int

class PartidoAtletaResponse(BaseModel):
    id: int
    torneo_id: int
    torneo_nombre: Optional[str] = None
    equipo_local: str
    equipo_visitante: str
    fecha_hora: datetime
    goles_local: int
    goles_visitante: int
    estado: str
    estadisticas_personales: Optional[EstadisticaPersonalAtleta] = None

# Esquema para crear la sesión general
class SesionEntrenamientoCreate(BaseModel):
    fecha: Optional[date] = None
    tipo_sesion: str
    descripcion: str
    duracion_min: int

class SesionEntrenamientoUpdate(BaseModel):
    fecha: Optional[date] = None
    tipo_sesion: Optional[str] = None
    descripcion: Optional[str] = None
    duracion_min: Optional[int] = None

class SesionEntrenamientoResponse(BaseModel):
    id: int
    fecha: date
    tipo_sesion: str
    descripcion: str
    duracion_min: int

    class Config:
        from_attributes = True

# Esquema para registrar a un jugador en esa sesión
class CargaAtletaCreate(BaseModel):
    atleta_id: int
    asistencia: bool = True
    rpe_esfuerzo: Optional[int] = None
    saltos_cm: Optional[float] = None
    tiempo_sprint_30m: Optional[float] = None

class RegistroBiometricoCreate(BaseModel):
    peso_kg: float
    altura_cm: float

class RegistroNutricionalCreate(BaseModel):
    frecuencia_comidas: int
    suplementacion: Optional[str] = "Ninguna"
    hidratacion_litros: float
    calidad_descanso: int # Por ejemplo, del 1 al 10
    plan_alimentacion: Optional[str] = "Ninguno"
    fecha: Optional[date] = None

class RegistroBiometricoResponse(BaseModel):
    id: int
    fecha: date
    peso_kg: float
    altura_cm: float
    imc: float # ¡Aquí el frontend recibe el cálculo mágico del backend!

    class Config:
        from_attributes = True

class RegistroNutricionalResponse(BaseModel):
    id: int
    fecha: date
    frecuencia_comidas: int
    suplementacion: Optional[str] = None
    hidratacion_litros: float
    calidad_descanso: int
    plan_alimentacion: Optional[str] = None

    class Config:
        from_attributes = True

class CargaAtletaResponse(BaseModel):
    id: int
    atleta_id: int
    asistencia: bool
    rpe_esfuerzo: Optional[int]
    saltos_cm: Optional[float]
    tiempo_sprint_30m: Optional[float]

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE LESIONES Y PIZARRAS GUARDADAS
# ==========================================

class LesionCreate(BaseModel):
    tipo_lesion: str
    gravedad: str
    fecha_inicio: date
    descripcion: Optional[str] = None
    rehabilitacion: Optional[str] = None

class LesionResponse(BaseModel):
    id: int
    atleta_id: int
    tipo_lesion: str
    gravedad: str
    fecha_inicio: date
    fecha_alta: Optional[date] = None
    descripcion: Optional[str] = None
    rehabilitacion: Optional[str] = None

    class Config:
        from_attributes = True

class LesionUpdate(BaseModel):
    fecha_alta: Optional[date] = None
    rehabilitacion: Optional[str] = None

class JugadaGuardadaCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    tokens_json: Any
    trazos_png: Optional[str] = None

class JugadaGuardadaResponse(BaseModel):
    id: int
    usuario_id: int
    titulo: str
    descripcion: Optional[str] = None
    tokens_json: Any
    trazos_png: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE ASISTENCIA MASIVA
# ==========================================

class AsistenciaItem(BaseModel):
    atleta_id: int
    asistencia: bool

class AsistenciaMasiva(BaseModel):
    asistencias: list[AsistenciaItem]

# ==========================================
# ESQUEMAS DE SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA
# ==========================================

class SolicitudPasswordCreate(BaseModel):
    correo: str

class SolicitudPasswordResponse(BaseModel):
    id: int
    usuario_id: int
    estado: str
    fecha_solicitud: datetime
    usuario_nombre: str
    usuario_apellido: str
    usuario_correo: str

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE NOTIFICACIONES
# ==========================================

class NotificacionBase(BaseModel):
    mensaje: str
    tipo: Optional[str] = "info"
    leido: Optional[bool] = False

class NotificacionCreate(NotificacionBase):
    usuario_id: int

class NotificacionResponse(NotificacionBase):
    id: int
    usuario_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True