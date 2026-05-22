from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import models
import security
from database import SessionLocal

# Portero VIP - Definición del esquema OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# El Bibliotecario - Sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Obtener usuario autenticado actual
def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credenciales_excepcion = HTTPException(
        status_code=401,
        detail="No tienes permiso o tu sesión ha expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credenciales_excepcion
    except JWTError:
        raise credenciales_excepcion
        
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()
    if usuario is None:
        raise credenciales_excepcion
        
    return usuario

# Verificar rol administrador
def verificar_admin(usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    if not usuario_actual.rol or usuario_actual.rol.lower() != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador")
    return usuario_actual

# Verificar rol cuerpo técnico (admin o entrenador)
def verificar_cuerpo_tecnico(usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    if not usuario_actual.rol or usuario_actual.rol.lower() not in ["admin", "entrenador"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de cuerpo técnico")
    return usuario_actual
