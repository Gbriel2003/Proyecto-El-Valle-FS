from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import schemas
import models
import security
from dependencies import get_db, verificar_admin
from crud import usuarios as crud_usuarios

router = APIRouter(tags=["Usuarios & Autenticación"])

@router.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = crud_usuarios.obtener_usuario_por_correo(db, usuario.correo)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado en el sistema")
    return crud_usuarios.crear_usuario(db, usuario)

@router.post("/login", response_model=schemas.Token)
def iniciar_sesion(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = crud_usuarios.obtener_usuario_por_correo(db, form_data.username)
    if not usuario:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
    clave_correcta = security.verificar_password(form_data.password, usuario.password_hash)
    if not clave_correcta:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
    datos_token = {"sub": usuario.correo, "rol": usuario.rol}
    token_generado = security.crear_token_acceso(data=datos_token)
    return {"access_token": token_generado, "token_type": "bearer"}

@router.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), admin: models.Usuario = Depends(verificar_admin)):
    usuario = crud_usuarios.eliminar_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"mensaje": f"El usuario {usuario.nombre} (ID: {usuario_id}) ha sido eliminado exitosamente del club."}

@router.get("/usuarios/")
def listar_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: models.Usuario = Depends(verificar_admin)):
    usuarios = crud_usuarios.listar_usuarios(db, skip, limit)
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "correo": u.correo,
            "rol": u.rol
        }
        for u in usuarios
    ]
