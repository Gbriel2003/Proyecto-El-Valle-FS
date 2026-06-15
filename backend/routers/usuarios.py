from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets
from datetime import datetime, timedelta
import schemas
import models
import security
from dependencies import get_db, verificar_admin, obtener_usuario_actual, verificar_cuerpo_tecnico
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
        
    datos_token = {
        "sub": usuario.correo, 
        "rol": usuario.rol, 
        "debe_cambiar_password": usuario.debe_cambiar_password
    }
    token_generado = security.crear_token_acceso(data=datos_token)
    return {
        "access_token": token_generado, 
        "token_type": "bearer", 
        "debe_cambiar_password": usuario.debe_cambiar_password
    }

@router.put("/usuarios/me/password")
def cambiar_password(
    req: schemas.ChangePasswordRequest,
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    if not security.verificar_password(req.current_password, usuario_actual.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    
    # Cambiar clave y marcar que ya no debe cambiarla
    crud_usuarios.actualizar_password_usuario(db, usuario_actual, req.new_password, primer_ingreso=True)
    return {"mensaje": "Contraseña actualizada exitosamente"}

@router.post("/usuarios/forgot-password")
def solicitar_recuperacion(
    req: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    usuario = crud_usuarios.obtener_usuario_por_correo(db, req.correo)
    if not usuario:
        # Retorno amigable e igual para evitar enumeración de correos
        return {"mensaje": "Si el correo está registrado, se enviará un enlace de restablecimiento"}
    
    token = secrets.token_urlsafe(32)
    expiracion = datetime.now() + timedelta(hours=1)
    
    crud_usuarios.guardar_token_recuperacion(db, usuario, token, expiracion)
    
    # Impresión en consola (luego se cambiará a SMTP de Gmail)
    reset_link = f"http://localhost:5173/reset-password/{token}"
    print("\n" + "="*80)
    print(f"CORREO DE RECUPERACIÓN PARA: {usuario.correo}")
    print(f"Enlace de restablecimiento: {reset_link}")
    print("="*80 + "\n")
    
    return {"mensaje": "Si el correo está registrado, se enviará un enlace de restablecimiento"}

@router.post("/usuarios/reset-password")
def restablecer_password(
    req: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    usuario = crud_usuarios.obtener_usuario_por_token(db, req.token)
    if not usuario:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
        
    crud_usuarios.actualizar_password_usuario(db, usuario, req.new_password, primer_ingreso=True)
    return {"mensaje": "Tu contraseña ha sido restablecida correctamente"}

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
            "rol": u.rol,
            "debe_cambiar_password": u.debe_cambiar_password
        }
        for u in usuarios
    ]

@router.get("/usuarios/me", response_model=schemas.UsuarioResponse)
def obtener_perfil_usuario_actual(usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    return usuario_actual

@router.put("/usuarios/{usuario_id}/reset-password")
def admin_reset_password(
    usuario_id: int,
    req: schemas.ResetPasswordAdminRequest,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    usuario = crud_usuarios.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    crud_usuarios.actualizar_password_usuario(db, usuario, req.new_password, primer_ingreso=False)
    usuario.debe_cambiar_password = True
    db.commit()
    db.refresh(usuario)
    return {"mensaje": f"Contraseña de {usuario.nombre} restablecida con éxito"}

@router.put("/usuarios/me/profile", response_model=schemas.UsuarioResponse)
def actualizar_perfil_usuario_actual(
    req: schemas.UsuarioProfileUpdate,
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    if req.telefono:
        prefijos = ["0424", "0414", "0416", "0426", "0412", "0422"]
        if len(req.telefono) != 11:
            raise HTTPException(status_code=400, detail="El número de teléfono debe tener exactamente 11 dígitos.")
        
        prefijo = req.telefono[:4]
        restante = req.telefono[4:]
        if prefijo not in prefijos:
            raise HTTPException(status_code=400, detail=f"Operador no válido. Debe comenzar con: {', '.join(prefijos)}")
        if not restante.isdigit() or len(restante) != 7:
            raise HTTPException(status_code=400, detail="Los últimos 7 dígitos deben ser numéricos.")
            
    usuario_actual.telefono = req.telefono
    db.commit()
    db.refresh(usuario_actual)
    return usuario_actual


