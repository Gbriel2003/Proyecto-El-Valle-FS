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
        debe_cambiar_password=True # Por defecto debe cambiarla al entrar por primera vez
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

def listar_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).offset(skip).limit(limit).all()

def eliminar_usuario(db: Session, usuario_id: int):
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return None
    db.delete(usuario)
    db.commit()
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

