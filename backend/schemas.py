from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional

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

    class Config:
        from_attributes = True

class CargaAtletaResponse(BaseModel):
    id: int
    asistencia: bool
    rpe_esfuerzo: Optional[int]
    saltos_cm: Optional[float]
    tiempo_sprint_30m: Optional[float]

    class Config:
        from_attributes = True