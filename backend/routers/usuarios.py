from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets
import boto3
import os
import uuid
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

@router.get("/usuarios/me", response_model=schemas.UsuarioResponse)
def obtener_mi_perfil(usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    return usuario_actual

@router.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    datos: schemas.UsuarioUpdate,
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    rol_actual = usuario_actual.rol.lower() if usuario_actual.rol else ""
    if rol_actual != "admin" and usuario_actual.id != usuario_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar este perfil")
    
    # Si es atleta y se intenta modificar a sí mismo (solo administradores pueden editar los datos personales)
    if rol_actual == "atleta" and usuario_actual.id == usuario_id:
        raise HTTPException(status_code=403, detail="Los atletas no pueden editar sus datos personales. Contacte al administrador.")
        
    usuario = crud_usuarios.actualizar_usuario(db, usuario_id, datos)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@router.delete("/usuarios/me/foto")
def eliminar_foto_perfil(
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    usuario_actual.foto_perfil = None
    db.commit()
    db.refresh(usuario_actual)
    return {"mensaje": "Foto de perfil eliminada exitosamente", "foto_perfil": None}

@router.post("/usuarios/me/foto")
def subir_foto_perfil(
    file: UploadFile = File(...),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
    import os
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_bucket = os.getenv("AWS_BUCKET_NAME")
    aws_region = os.getenv("AWS_REGION")
    
    if not all([aws_access_key, aws_secret_key, aws_bucket, aws_region]):
        raise HTTPException(status_code=500, detail="La configuración de AWS no está completa en el archivo .env del servidor.")
        
    file_bytes = file.file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede pesar más de 5MB")
        
    try:
        import boto3
        import uuid
        s3 = boto3.client('s3', aws_access_key_id=aws_access_key, aws_secret_access_key=aws_secret_key, region_name=aws_region)
        ext = file.filename.split('.')[-1]
        file_name = f"perfiles/{usuario_actual.id}_{uuid.uuid4().hex[:8]}.{ext}"
        
        s3.put_object(
            Bucket=aws_bucket,
            Key=file_name,
            Body=file_bytes,
            ContentType=file.content_type,
            ACL='public-read' # Hacemos la foto pública para que se pueda ver en la web
        )
        url_publica = f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{file_name}"
        
        crud_usuarios.actualizar_foto_perfil(db, usuario_actual.id, url_publica)
        
        return {"foto_perfil": url_publica}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen a AWS S3: {str(e)}\n(Verifica que el bucket permite ACLs públicas)")

@router.post("/usuarios/solicitud-password")
def solicitar_recuperacion(
    req: schemas.SolicitudPasswordCreate,
    db: Session = Depends(get_db)
):
    usuario = crud_usuarios.obtener_usuario_por_correo(db, req.correo)
    if not usuario:
        raise HTTPException(status_code=404, detail="El correo electrónico ingresado no está registrado en el sistema.")
    
    crud_usuarios.crear_solicitud_password(db, usuario.id)
    return {"mensaje": "Tu solicitud ha sido enviada al administrador. Una vez aprobada, se te asignará una contraseña temporal."}

@router.get("/usuarios/solicitudes-password", response_model=list[schemas.SolicitudPasswordResponse])
def listar_solicitudes_pendientes(
    db: Session = Depends(get_db), 
    admin: models.Usuario = Depends(verificar_admin)
):
    solicitudes = crud_usuarios.listar_solicitudes_pendientes(db)
    resultado = []
    for s in solicitudes:
        resultado.append({
            "id": s.id,
            "usuario_id": s.usuario_id,
            "estado": s.estado,
            "fecha_solicitud": s.fecha_solicitud,
            "usuario_nombre": s.usuario.nombre,
            "usuario_apellido": s.usuario.apellido,
            "usuario_correo": s.usuario.correo
        })
    return resultado

@router.put("/usuarios/solicitudes-password/{solicitud_id}/aprobar")
def aprobar_solicitud_password(
    solicitud_id: int,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(verificar_admin)
):
    solicitud = crud_usuarios.actualizar_estado_solicitud(db, solicitud_id, "Aprobada")
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    usuario = crud_usuarios.obtener_usuario_por_id(db, solicitud.usuario_id)
    
    # Asignar contraseña genérica 12345678 y obligar a cambiar
    crud_usuarios.actualizar_password_usuario(db, usuario, "12345678", primer_ingreso=False)
    usuario.debe_cambiar_password = True
    db.commit()
    
    return {"mensaje": "Solicitud aprobada y contraseña restablecida a 12345678"}

@router.put("/usuarios/solicitudes-password/{solicitud_id}/rechazar")
def rechazar_solicitud_password(
    solicitud_id: int,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(verificar_admin)
):
    solicitud = crud_usuarios.actualizar_estado_solicitud(db, solicitud_id, "Rechazada")
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return {"mensaje": "Solicitud rechazada"}

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
            "debe_cambiar_password": u.debe_cambiar_password,
            "cedula": u.cedula,
            "telefono": u.telefono,
            "foto_perfil": u.foto_perfil
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


