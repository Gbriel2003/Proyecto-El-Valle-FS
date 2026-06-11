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

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: EmailStr
    rol: str
    debe_cambiar_password: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True

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

class PerfilAtletaResponse(BaseModel):
    atleta_id: int
    fecha_nacimiento: date
    peso_base: float
    altura_cm: int
    posicion_especifica: str
    pierna_habil: str
    dieta_asignada_id: Optional[int] = None
    dieta_asignada: Optional[PropuestaDietaResponse] = None

    class Config:
        from_attributes = True

class PerfilAtletaUpdate(BaseModel):
    peso_base: Optional[float] = None
    altura_cm: Optional[int] = None
    posicion_especifica: Optional[str] = None
    pierna_habil: Optional[str] = None

# ==========================================
# ESQUEMAS DE TORNEOS Y PARTIDOS
# ==========================================

class TorneoCreate(BaseModel):
    nombre: str
    temporada: str
    fecha_inicio: date
    fecha_fin: date

class TorneoResponse(TorneoCreate):
    id: int
    class Config:
        from_attributes = True

class PartidoCreate(BaseModel):
    torneo_id: int
    equipo_local: str
    equipo_visitante: str
    fecha_hora: datetime

class PartidoResponse(PartidoCreate):
    id: int
    goles_local: int
    goles_visitante: int
    estado: str
    class Config:
        from_attributes = True

class PartidoUpdate(BaseModel):
    goles_local: int
    goles_visitante: int
    estado: str  # "Finalizado"
    jugadores_ids: list[int]

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