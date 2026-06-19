from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas
import security

def obtener_usuario_por_correo(db: Session, correo: str):
    return db.query(models.Usuario).filter(models.Usuario.correo == correo).first()

def obtener_usuario_por_id(db: Session, usuario_id: int):
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

def crear_usuario(db: Session, usuario: schemas.UsuarioCreate):
    clave_licuada = security.obtener_password_hash(usuario.password)
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        password_hash=clave_licuada, 
        rol=usuario.rol,
        telefono=usuario.telefono,
        cedula=usuario.cedula,
        debe_cambiar_password=True # Por defecto debe cambiarla al entrar por primera vez
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Si es atleta, crear su ficha técnica (PerfilAtleta) vacía automáticamente
    if nuevo_usuario.rol == 'atleta':
        nuevo_perfil = models.PerfilAtleta(
            atleta_id=nuevo_usuario.id,
            peso_base=0.0,
            altura_cm=0,
            posicion_especifica="Sin asignar",
            pierna_habil="Derecha"
        )
        db.add(nuevo_perfil)
        db.commit()
        
    return nuevo_usuario

def listar_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).offset(skip).limit(limit).all()

def eliminar_usuario(db: Session, usuario_id: int):
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
        
    # Eliminar dependencias directas del usuario
    db.query(models.SolicitudPassword).filter(models.SolicitudPassword.usuario_id == usuario_id).delete(synchronize_session=False)
    db.query(models.RegistroIA).filter(models.RegistroIA.usuario_id == usuario_id).delete(synchronize_session=False)
    db.query(models.JugadaGuardada).filter(models.JugadaGuardada.usuario_id == usuario_id).delete(synchronize_session=False)
    
    # Eliminar dependencias del perfil del atleta
    perfil = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == usuario_id).first()
    if perfil:
        db.query(models.CargaAtleta).filter(models.CargaAtleta.atleta_id == usuario_id).delete(synchronize_session=False)
        db.query(models.EstadisticasTacticas).filter(models.EstadisticasTacticas.atleta_id == usuario_id).delete(synchronize_session=False)
        db.query(models.RegistroNutricional).filter(models.RegistroNutricional.atleta_id == usuario_id).delete(synchronize_session=False)
        db.query(models.RegistroBiometrico).filter(models.RegistroBiometrico.atleta_id == usuario_id).delete(synchronize_session=False)
        db.query(models.Lesion).filter(models.Lesion.atleta_id == usuario_id).delete(synchronize_session=False)
        db.query(models.RegistroIA).filter(models.RegistroIA.atleta_id == usuario_id).delete(synchronize_session=False)
        db.query(models.EventoPartido).filter(models.EventoPartido.atleta_id == usuario_id).delete(synchronize_session=False)
        db.delete(perfil)
        
    db.delete(usuario)
    db.commit()
    return usuario

def actualizar_usuario(db: Session, usuario_id: int, datos: schemas.UsuarioUpdate):
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
    
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(usuario, key, value)
        
    db.commit()
    db.refresh(usuario)
    return usuario

def actualizar_foto_perfil(db: Session, usuario_id: int, foto_url: str):
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
    usuario.foto_perfil = foto_url
    db.commit()
    db.refresh(usuario)
    return usuario

def actualizar_password_usuario(db: Session, usuario: models.Usuario, nueva_clave: str, primer_ingreso: bool = False):
    clave_licuada = security.obtener_password_hash(nueva_clave)
    usuario.password_hash = clave_licuada
    if primer_ingreso:
        usuario.debe_cambiar_password = False
    
    # Limpiar token si se cambia la clave exitosamente
    usuario.reset_token = None
    usuario.reset_token_expiration = None
    
    db.commit()
    db.refresh(usuario)
    return usuario

def guardar_token_recuperacion(db: Session, usuario: models.Usuario, token: str, expiracion: datetime):
    usuario.reset_token = token
    usuario.reset_token_expiration = expiracion
    db.commit()
    db.refresh(usuario)
    return usuario

def obtener_usuario_por_token(db: Session, token: str):
    return db.query(models.Usuario).filter(
        models.Usuario.reset_token == token,
        models.Usuario.reset_token_expiration > datetime.now()
    ).first()

# ==========================================
# SOLICITUDES DE CONTRASEÑA
# ==========================================

def crear_solicitud_password(db: Session, usuario_id: int):
    # Opcional: verificar si ya tiene una pendiente para no duplicar
    existente = db.query(models.SolicitudPassword).filter(
        models.SolicitudPassword.usuario_id == usuario_id,
        models.SolicitudPassword.estado == "Pendiente"
    ).first()
    
    if existente:
        return existente
        
    nueva_solicitud = models.SolicitudPassword(
        usuario_id=usuario_id,
        estado="Pendiente"
    )
    db.add(nueva_solicitud)
    db.commit()
    db.refresh(nueva_solicitud)
    return nueva_solicitud

def listar_solicitudes_pendientes(db: Session):
    return db.query(models.SolicitudPassword).filter(
        models.SolicitudPassword.estado == "Pendiente"
    ).order_by(models.SolicitudPassword.fecha_solicitud.desc()).all()

def actualizar_estado_solicitud(db: Session, solicitud_id: int, nuevo_estado: str):
    solicitud = db.query(models.SolicitudPassword).filter(models.SolicitudPassword.id == solicitud_id).first()
    if solicitud:
        solicitud.estado = nuevo_estado
        db.commit()
        db.refresh(solicitud)
    return solicitud

