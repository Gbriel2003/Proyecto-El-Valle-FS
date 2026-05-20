from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm 
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import models
import schemas
import security
import shutil
import utils
import os
import boto3
import uuid



# Esto crea las tablas en PostgreSQL si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de El Valle F.S.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # El puerto de tu React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. DEPENDENCIAS BASE (El Bibliotecario)
# ==========================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. SEGURIDAD (El Portero VIP)
# ==========================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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

def verificar_admin(usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    if not usuario_actual.rol or usuario_actual.rol.lower() != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador")
    return usuario_actual

def verificar_cuerpo_tecnico(usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    if not usuario_actual.rol or usuario_actual.rol.lower() not in ["admin", "entrenador"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de cuerpo técnico")
    return usuario_actual



# ==========================================
# 3. RUTAS PÚBLICAS (No piden Token)
# ==========================================
@app.get("/")
def ruta_principal():
    return {"mensaje": "¡El servidor de El Valle F.S. está vivo y funcionando!"}

@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.correo == usuario.correo).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado en el sistema")
    
    clave_licuada = security.obtener_password_hash(usuario.password)
    
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        password_hash=clave_licuada, 
        rol=usuario.rol
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@app.post("/login", response_model=schemas.Token)
# Cambiamos "credenciales: schemas.UsuarioLogin" por "form_data: OAuth2PasswordRequestForm = Depends()"
def iniciar_sesion(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # IMPORTANTE: OAuth2PasswordRequestForm usa .username para el correo
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == form_data.username).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
    # Comparamos la contraseña usando form_data.password
    clave_correcta = security.verificar_password(form_data.password, usuario.password_hash)
    
    if not clave_correcta:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
    datos_token = {"sub": usuario.correo, "rol": usuario.rol}
    token_generado = security.crear_token_acceso(data=datos_token)
    
    return {"access_token": token_generado, "token_type": "bearer"}


# ==========================================
# 4. RUTAS PROTEGIDAS (Sí piden Token)
# ==========================================

@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), admin: models.Usuario = Depends(verificar_admin)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    db.delete(usuario)
    db.commit()
    return {"mensaje": f"El usuario {usuario.nombre} (ID: {usuario_id}) ha sido eliminado exitosamente del club."}

@app.get("/usuarios/")
def listar_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: models.Usuario = Depends(verificar_admin)):
    usuarios = db.query(models.Usuario).offset(skip).limit(limit).all()
    # Retornamos sin el password hash por seguridad
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

@app.post("/atletas/", response_model=schemas.PerfilAtletaResponse)
def crear_perfil_atleta(perfil: schemas.PerfilAtletaCreate, db: Session = Depends(get_db), admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == perfil.atleta_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe. Regístralo primero en /usuarios/")
        
    perfil_existente = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == perfil.atleta_id).first()
    if perfil_existente:
        raise HTTPException(status_code=400, detail="Este jugador ya tiene una ficha deportiva registrada")
        
    nuevo_perfil = models.PerfilAtleta(
        atleta_id=perfil.atleta_id,
        fecha_nacimiento=perfil.fecha_nacimiento,
        peso_base=perfil.peso_base,
        altura_cm=perfil.altura_cm,
        posicion_especifica=perfil.posicion_especifica,
        pierna_habil=perfil.pierna_habil
    )
    
    db.add(nuevo_perfil)
    db.commit()
    db.refresh(nuevo_perfil)
    return nuevo_perfil

@app.get("/atletas/")
def obtener_plantilla_activa(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # 1. Buscamos todos los perfiles deportivos con paginación
    atletas_db = db.query(models.PerfilAtleta).offset(skip).limit(limit).all()
    
    lista_formateada = []
    
    # 2. Recorremos uno por uno para unir sus datos personales
    for atleta in atletas_db:
        # Buscamos al usuario dueño de esta ficha (usamos atleta_id como llave)
        usuario = db.query(models.Usuario).filter(models.Usuario.id == atleta.atleta_id).first()
        
        # 3. Empaquetamos todo en un diccionario exacto para que React lo lea sin esfuerzo
        lista_formateada.append({
            "atleta_id": atleta.atleta_id,
            "nombre": usuario.nombre if usuario else "Jugador",
            "apellido": usuario.apellido if usuario else "Sin Registro",
            "posicion": atleta.posicion_especifica,
            "numero_camisa": "N/A",  # PerfilAtleta no tiene numero_camisa
            "estado_actual": "Activo",
            "detalles": f"Pierna hábil: {atleta.pierna_habil}"
        })
        
    return lista_formateada

@app.put("/atletas/{atleta_id}", response_model=schemas.PerfilAtletaResponse)
def actualizar_perfil_atleta(atleta_id: int, perfil_actualizado: schemas.PerfilAtletaUpdate, db: Session = Depends(get_db), admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)):
    perfil = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Ficha deportiva no encontrada")
        
    if perfil_actualizado.peso_base is not None:
        perfil.peso_base = perfil_actualizado.peso_base
    if perfil_actualizado.altura_cm is not None:
        perfil.altura_cm = perfil_actualizado.altura_cm
    if perfil_actualizado.posicion_especifica is not None:
        perfil.posicion_especifica = perfil_actualizado.posicion_especifica
    if perfil_actualizado.pierna_habil is not None:
        perfil.pierna_habil = perfil_actualizado.pierna_habil

    db.commit()
    db.refresh(perfil)
    return perfil

# Tarea en segundo plano para procesar PDF con IA
def procesar_reporte_ia_background(file_path: str, partido_id: int):
    """Crea su propia sesión de BD para no depender de la sesión del request (que ya se cerró)."""
    db = SessionLocal()
    try:
        texto_extraido = utils.extraer_texto_pdf(file_path)
        analisis_ia = utils.analizar_estadisticas_con_ia(texto_extraido)
        
        # Buscar si ya existe un reporte para este partido (re-subida)
        reporte_existente = db.query(models.ReportePartido).filter(
            models.ReportePartido.partido_id == partido_id
        ).first()
        
        if reporte_existente:
            reporte_existente.analisis_ia = analisis_ia
            reporte_existente.ruta_archivo = file_path
        else:
            nuevo_reporte = models.ReportePartido(
                partido_id=partido_id, 
                ruta_archivo=file_path,
                analisis_ia=analisis_ia
            )
            db.add(nuevo_reporte)
        
        db.commit()
        print(f"[IA] Reporte del partido {partido_id} procesado correctamente.")
    except Exception as e:
        print(f"[IA ERROR] Error procesando reporte partido {partido_id}: {e}")
        db.rollback()
    finally:
        db.close()

# RUTA PARA SUBIR EL PDF DE ESTATS EL VALLE
@app.post("/partidos/{partido_id}/subir-reporte")
async def subir_reporte_pdf(
    partido_id: int, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    # Configuración AWS
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_bucket = os.getenv("AWS_BUCKET_NAME")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    
    file_path = ""
    file_id = uuid.uuid4().hex
    
    if aws_access_key and aws_bucket and aws_access_key != "tu_access_key_aqui":
        try:
            s3 = boto3.client('s3', aws_access_key_id=aws_access_key, aws_secret_access_key=aws_secret_key, region_name=aws_region)
            file_name = f"partidos/{partido_id}_{file_id}_{file.filename}"
            s3.upload_fileobj(file.file, aws_bucket, file_name)
            file_path = f"s3://{aws_bucket}/{file_name}"
            file.file.seek(0) # Reiniciamos el puntero para la copia local
        except Exception as e:
            print(f"Aviso S3: {e}")
            
    # Guardar copia local para procesamiento de PDF (o si S3 falla)
    upload_dir = "storage/reportes"
    os.makedirs(upload_dir, exist_ok=True)
    temp_file_path = os.path.join(upload_dir, f"partido_{partido_id}_{file_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if not file_path:
        file_path = temp_file_path

    # Enviar a background task (sin pasar la sesión del request)
    background_tasks.add_task(procesar_reporte_ia_background, temp_file_path, partido_id)
    
    return {
        "status": "Procesamiento iniciado en segundo plano",
        "partido_id": partido_id,
        "mensaje": "El reporte se está analizando con IA."
    }

@app.delete("/partidos/{partido_id}")
def eliminar_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    partido = db.query(models.Partido).filter(models.Partido.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    # Eliminar estadísticas tácticas relacionadas
    db.query(models.EstadisticasTacticas).filter(
        models.EstadisticasTacticas.partido_id == partido_id
    ).delete()
    
    # Eliminar reportes relacionados
    db.query(models.ReportePartido).filter(
        models.ReportePartido.partido_id == partido_id
    ).delete()
    
    db.delete(partido)
    db.commit()
    return {"mensaje": "Partido eliminado correctamente"}

# ==========================================
# RUTAS DE TORNEOS Y PARTIDOS
# ==========================================

@app.post("/torneos/", response_model=schemas.TorneoResponse)
def crear_torneo(torneo: schemas.TorneoCreate, db: Session = Depends(get_db), admin: models.Usuario = Depends(verificar_admin)):
    nuevo_torneo = models.Torneo(
        nombre=torneo.nombre,
        temporada=torneo.temporada,
        fecha_inicio=torneo.fecha_inicio,
        fecha_fin=torneo.fecha_fin
    )
    db.add(nuevo_torneo)
    db.commit()
    db.refresh(nuevo_torneo)
    return nuevo_torneo

@app.get("/torneos/", response_model=list[schemas.TorneoResponse])
def listar_torneos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Torneo).offset(skip).limit(limit).all()

@app.post("/partidos/", response_model=schemas.PartidoResponse)
def crear_partido(partido: schemas.PartidoCreate, db: Session = Depends(get_db), admin: models.Usuario = Depends(verificar_admin)):
    # Verificamos que el torneo exista
    torneo_existente = db.query(models.Torneo).filter(models.Torneo.id == partido.torneo_id).first()
    if not torneo_existente:
        raise HTTPException(status_code=404, detail="El torneo no existe")
        
    nuevo_partido = models.Partido(
        torneo_id=partido.torneo_id,
        equipo_local=partido.equipo_local,
        equipo_visitante=partido.equipo_visitante,
        fecha_hora=partido.fecha_hora
    )
    db.add(nuevo_partido)
    db.commit()
    db.refresh(nuevo_partido)
    return nuevo_partido

@app.get("/partidos/")
def obtener_partidos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    partidos = db.query(models.Partido).offset(skip).limit(limit).all()
    # Formatear partidos para coincidir con lo que espera el frontend
    return [
        {
            "id": p.id,
            "equipo_local": p.equipo_local,
            "equipo_visitante": p.equipo_visitante,
            "fecha_hora": p.fecha_hora.isoformat() if p.fecha_hora else None,
            "estado": p.estado,
            "goles_local": p.goles_local,
            "goles_visitante": p.goles_visitante,
            "torneo_nombre": p.torneo.nombre if p.torneo else "Torneo Desconocido",
            "jugadores_ids": [est.atleta_id for est in p.estadisticas]
        }
        for p in partidos
    ]

@app.put("/partidos/{partido_id}")
def actualizar_partido(
    partido_id: int,
    partido_data: schemas.PartidoUpdate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    partido = db.query(models.Partido).filter(models.Partido.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    partido.goles_local = partido_data.goles_local
    partido.goles_visitante = partido_data.goles_visitante
    partido.estado = partido_data.estado
    
    # Eliminar estadísticas tácticas antiguas asociadas a este partido
    db.query(models.EstadisticasTacticas).filter(models.EstadisticasTacticas.partido_id == partido_id).delete()
    
    # Guardar la nueva alineación en EstadisticasTacticas
    for atleta_id in partido_data.jugadores_ids:
        nueva_est = models.EstadisticasTacticas(
            partido_id=partido_id,
            atleta_id=atleta_id,
            goles=0,
            asistencias=0,
            recuperaciones=0,
            errores_posicionamiento=0,
            minutos_jugados=0
        )
        db.add(nueva_est)
    
    db.commit()
    db.refresh(partido)
    return {
        "mensaje": "Resultado e integrantes registrados exitosamente",
        "partido": {
            "id": partido.id,
            "equipo_local": partido.equipo_local,
            "equipo_visitante": partido.equipo_visitante,
            "estado": partido.estado,
            "goles_local": partido.goles_local,
            "goles_visitante": partido.goles_visitante,
            "jugadores_ids": partido_data.jugadores_ids
        }
    }

@app.get("/partidos/{partido_id}/reporte")
def obtener_reporte_partido(
    partido_id: int, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    reporte = db.query(models.ReportePartido).filter(models.ReportePartido.partido_id == partido_id).first()
    
    if not reporte:
        raise HTTPException(status_code=404, detail="No existe un reporte para este partido.")
    
    # Si la fila existe pero el JSON está vacío
    if reporte.analisis_ia is None:
        return {
            "partido_id": reporte.partido_id,
            "estado": "pendiente_procesamiento",
            "mensaje": "El archivo se subió pero aún no tiene un análisis de IA."
        }
    
    return {
        "partido_id": reporte.partido_id,
        "estado": "completado",
        "analisis_ia": reporte.analisis_ia
    }

# ==========================================
# MÓDULO DE ENTRENAMIENTOS
# ==========================================

@app.post("/entrenamientos/", response_model=schemas.SesionEntrenamientoResponse)
def crear_sesion_entrenamiento(
    sesion: schemas.SesionEntrenamientoCreate, # Ajusta a 'SesionEntrenamientoCreate' si no usas 'schemas.'
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    nueva_sesion = models.SesionEntrenamiento(
        fecha=sesion.fecha,
        tipo_sesion=sesion.tipo_sesion,
        descripcion=sesion.descripcion,
        duracion_min=sesion.duracion_min
    )
    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)
    
    return nueva_sesion

@app.get("/entrenamientos/")
def listar_sesiones_entrenamiento(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Devolver las sesiones ordenadas de más reciente a más antigua
    sesiones = db.query(models.SesionEntrenamiento).order_by(models.SesionEntrenamiento.fecha.desc(), models.SesionEntrenamiento.id.desc()).offset(skip).limit(limit).all()
    return sesiones

@app.put("/entrenamientos/{sesion_id}", response_model=schemas.SesionEntrenamientoResponse)
def editar_sesion_entrenamiento(
    sesion_id: int,
    sesion_update: schemas.SesionEntrenamientoUpdate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    sesion = db.query(models.SesionEntrenamiento).filter(models.SesionEntrenamiento.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
        
    if sesion_update.fecha is not None:
        sesion.fecha = sesion_update.fecha
    if sesion_update.tipo_sesion is not None:
        sesion.tipo_sesion = sesion_update.tipo_sesion
    if sesion_update.descripcion is not None:
        sesion.descripcion = sesion_update.descripcion
    if sesion_update.duracion_min is not None:
        sesion.duracion_min = sesion_update.duracion_min
        
    db.commit()
    db.refresh(sesion)
    return sesion

@app.delete("/entrenamientos/{sesion_id}")
def eliminar_sesion_entrenamiento(
    sesion_id: int,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    sesion = db.query(models.SesionEntrenamiento).filter(models.SesionEntrenamiento.id == sesion_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
        
    # Borrado en cascada manual de las cargas físicas
    cargas = db.query(models.CargaAtleta).filter(models.CargaAtleta.sesion_id == sesion_id).all()
    for carga in cargas:
        db.delete(carga)
        
    db.delete(sesion)
    db.commit()
    return {"mensaje": f"Sesión #{sesion_id} y sus cargas asociadas han sido eliminadas."}

@app.post("/entrenamientos/{sesion_id}/cargas/")
def registrar_carga_atleta(
    sesion_id: int,
    carga: schemas.CargaAtletaCreate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    # Verificamos que la sesión exista
    sesion_existente = db.query(models.SesionEntrenamiento).filter(models.SesionEntrenamiento.id == sesion_id).first()
    if not sesion_existente:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
        
    nueva_carga = models.CargaAtleta(
        sesion_id=sesion_id,
        atleta_id=carga.atleta_id,
        asistencia=carga.asistencia,
        rpe_esfuerzo=carga.rpe_esfuerzo,
        saltos_cm=carga.saltos_cm,
        tiempo_sprint_30m=carga.tiempo_sprint_30m
    )
    db.add(nueva_carga)
    db.commit()
    db.refresh(nueva_carga)
    
    return {"mensaje": "Carga registrada con éxito", "carga": nueva_carga}    

@app.get("/entrenamientos/{sesion_id}/cargas/")
def obtener_cargas_sesion(
    sesion_id: int,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    cargas = db.query(models.CargaAtleta).filter(models.CargaAtleta.sesion_id == sesion_id).all()
    # Devolver una lista simple de los IDs de los atletas que ya tienen carga en esta sesión
    atletas_evaluados = [c.atleta_id for c in cargas]
    return {"sesion_id": sesion_id, "cargas": cargas, "atletas_evaluados": atletas_evaluados}

@app.get("/atletas/{atleta_id}/analisis-fatiga")
def analizar_fatiga_atleta(
    atleta_id: int, 
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    # 1. Buscamos las últimas 5 cargas físicas registradas para este atleta
    cargas = db.query(models.CargaAtleta).filter(models.CargaAtleta.atleta_id == atleta_id).order_by(models.CargaAtleta.id.desc()).limit(5).all()
    
    if not cargas:
        raise HTTPException(status_code=404, detail="No hay datos de entrenamiento suficientes para este atleta.")
        
    # 2. Convertimos los datos de la base de datos a un texto fácil de leer para la IA
    texto_cargas = f"Últimas {len(cargas)} sesiones registradas:\n"
    for c in cargas:
        # Mostramos si el jugador percibe mucho esfuerzo (RPE), cuánto salta y su velocidad
        rpe = c.rpe_esfuerzo if c.rpe_esfuerzo else "No medido"
        saltos = f"{c.saltos_cm} cm" if c.saltos_cm else "No medido"
        sprint = f"{c.tiempo_sprint_30m} s" if c.tiempo_sprint_30m else "No medido"
        
        texto_cargas += f"- Esfuerzo (RPE): {rpe}, Salto vertical: {saltos}, Sprint 30m: {sprint}\n"
        
    # 3. Mandamos los datos históricos a Gemini
    analisis_preventivo = utils.analizar_fatiga_con_ia(texto_cargas)
    
    # 4. Devolvemos el veredicto final al frontend
    return {
        "atleta_id": atleta_id,
        "registros_analizados": len(cargas),
        "reporte_prevencion": analisis_preventivo
    }

@app.post("/atletas/{atleta_id}/biometria", response_model=schemas.RegistroBiometricoResponse)
def registrar_biometria_basica(
    atleta_id: int,
    biometria: schemas.RegistroBiometricoCreate, # Asegúrate de usar 'schemas.' si están en otro archivo
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    # Validamos que el atleta exista antes de pesar
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado en el sistema.")

    # El backend calcula el IMC automáticamente
    # Fórmula: Peso (kg) / Altura (m)^2
    altura_metros = biometria.altura_cm / 100
    imc_calculado = round(biometria.peso_kg / (altura_metros ** 2), 2)

    # Creamos el registro adaptado a la realidad del club
    nuevo_registro = models.RegistroBiometrico(
        atleta_id=atleta_id,
        peso_kg=biometria.peso_kg,
        altura_cm=biometria.altura_cm,
        imc=imc_calculado
        # Los campos de grasa y músculo quedan fuera o como nulos en models.py
    )
    
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    
    return nuevo_registro

# ==========================================
# MÓDULO DE NUTRICIÓN
# ==========================================

@app.post("/atletas/{atleta_id}/habitos-nutricionales")
def registrar_habitos_diarios(
    atleta_id: int,
    registro: schemas.RegistroNutricionalCreate, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    # Verificamos que el atleta exista
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")

    # Usamos tu clase exacta original
    nuevo_registro = models.RegistroNutricional(
        atleta_id=atleta_id,
        frecuencia_comidas=registro.frecuencia_comidas,
        suplementacion=registro.suplementacion,
        hidratacion_litros=registro.hidratacion_litros,
        calidad_descanso=registro.calidad_descanso
    )
    
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    
    return nuevo_registro


@app.get("/atletas/{atleta_id}/dashboard")
def obtener_dashboard_atleta(
    atleta_id: int, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    # 1. Información de Perfil
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")

    # 2. Última Biometría (Peso, Altura, IMC)
    ultima_biometria = db.query(models.RegistroBiometrico).filter(
        models.RegistroBiometrico.atleta_id == atleta_id
    ).order_by(models.RegistroBiometrico.id.desc()).first()

    # 3. Resumen de Hábitos (Últimos 3 registros para promediar hidratación y descanso)
    habitos = db.query(models.RegistroNutricional).filter(
        models.RegistroNutricional.atleta_id == atleta_id
    ).order_by(models.RegistroNutricional.id.desc()).limit(3).all()
    
    promedio_descanso = sum(h.calidad_descanso for h in habitos) / len(habitos) if habitos else 0
    promedio_hidratacion = sum(h.hidratacion_litros for h in habitos) / len(habitos) if habitos else 0

    # 4. Análisis de Fatiga por IA (Usando las últimas cargas físicas)
    cargas = db.query(models.CargaAtleta).filter(
        models.CargaAtleta.atleta_id == atleta_id
    ).order_by(models.CargaAtleta.id.desc()).limit(5).all()
    
    analisis_ia = None
    if cargas:
        texto_cargas = "\n".join([f"RPE: {c.rpe_esfuerzo}, Salto: {c.saltos_cm}" for c in cargas])
        analisis_ia = utils.analizar_fatiga_con_ia(texto_cargas)

    # 5. Respuesta Consolidada (Ajustada a tu modelo real)
    return {
        "perfil": {
            "atleta_id": atleta.atleta_id,
            "peso_fichaje": atleta.peso_base, # <-- ¡El dato con el que llegó al club!
            "altura_fichaje": atleta.altura_cm
        },
        "estado_fisico": {
            "peso_actual": ultima_biometria.peso_kg if ultima_biometria else atleta.peso_base,
            "imc_actual": ultima_biometria.imc if ultima_biometria else "N/A"
        },
        "habitos_semanales": {
            "promedio_descanso": round(promedio_descanso, 1),
            "promedio_hidratacion": round(promedio_hidratacion, 1)
        },
        "alerta_ia": analisis_ia,
        "cargas_historicas": [{"sesion": f"#{c.sesion_id}", "rpe": c.rpe_esfuerzo, "salto": c.saltos_cm} for c in reversed(cargas)] if cargas else []
    }

@app.get("/mi-dashboard")
def obtener_mi_dashboard(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    # Reutilizamos la lógica del dashboard, pero con el ID del usuario logueado
    return obtener_dashboard_atleta(atleta_id=usuario_actual.id, db=db, usuario_actual=usuario_actual)


# ==========================================
# REPARACIONES Y CIERRE DE BRECHAS
# ==========================================

@app.get("/atletas/{atleta_id}/habitos-nutricionales")
def obtener_habitos_diarios(
    atleta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    # Verificamos que el atleta exista
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    
    registros = db.query(models.RegistroNutricional).filter(
        models.RegistroNutricional.atleta_id == atleta_id
    ).order_by(models.RegistroNutricional.fecha.desc()).all()
    
    return registros

# ==========================================
# MÓDULO DE LESIONES
# ==========================================

@app.post("/atletas/{atleta_id}/lesiones", response_model=schemas.LesionResponse)
def registrar_lesion(
    atleta_id: int,
    lesion: schemas.LesionCreate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")

    nueva_lesion = models.Lesion(
        atleta_id=atleta_id,
        tipo_lesion=lesion.tipo_lesion,
        gravedad=lesion.gravedad,
        fecha_inicio=lesion.fecha_inicio,
        descripcion=lesion.descripcion,
        rehabilitacion=lesion.rehabilitacion
    )
    db.add(nueva_lesion)
    db.commit()
    db.refresh(nueva_lesion)
    return nueva_lesion

@app.get("/atletas/{atleta_id}/lesiones", response_model=list[schemas.LesionResponse])
def obtener_lesiones(
    atleta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")

    return db.query(models.Lesion).filter(models.Lesion.atleta_id == atleta_id).order_by(models.Lesion.fecha_inicio.desc()).all()

@app.put("/lesiones/{lesion_id}/alta", response_model=schemas.LesionResponse)
def dar_alta_lesion(
    lesion_id: int,
    alta_data: schemas.LesionUpdate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    lesion = db.query(models.Lesion).filter(models.Lesion.id == lesion_id).first()
    if not lesion:
        raise HTTPException(status_code=404, detail="Registro de lesión no encontrado.")

    lesion.fecha_alta = alta_data.fecha_alta
    if alta_data.rehabilitacion:
        lesion.rehabilitacion = alta_data.rehabilitacion

    db.commit()
    db.refresh(lesion)
    return lesion

# ==========================================
# MÓDULO DE PIZARRA TÁCTICA (PERSISTENCIA)
# ==========================================

@app.post("/jugadas", response_model=schemas.JugadaGuardadaResponse)
def guardar_jugada_tactica(
    jugada: schemas.JugadaGuardadaCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    nueva_jugada = models.JugadaGuardada(
        usuario_id=usuario_actual.id,
        titulo=jugada.titulo,
        descripcion=jugada.descripcion,
        tokens_json=jugada.tokens_json,
        trazos_png=jugada.trazos_png
    )
    db.add(nueva_jugada)
    db.commit()
    db.refresh(nueva_jugada)
    return nueva_jugada

@app.get("/jugadas", response_model=list[schemas.JugadaGuardadaResponse])
def obtener_jugadas_tacticas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return db.query(models.JugadaGuardada).filter(
        models.JugadaGuardada.usuario_id == usuario_actual.id
    ).order_by(models.JugadaGuardada.fecha_creacion.desc()).all()

@app.delete("/jugadas/{jugada_id}")
def eliminar_jugada_tactica(
    jugada_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    jugada = db.query(models.JugadaGuardada).filter(
        models.JugadaGuardada.id == jugada_id,
        models.JugadaGuardada.usuario_id == usuario_actual.id
    ).first()
    
    if not jugada:
        raise HTTPException(status_code=404, detail="Jugada no encontrada.")

    db.delete(jugada)
    db.commit()
    return {"message": "Jugada eliminada exitosamente"}


# ==========================================
# DASHBOARD DEL ENTRENADOR (Vista Ejecutiva)
# ==========================================

@app.get("/dashboard-entrenador/")
def obtener_dashboard_entrenador(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    # 1. RESUMEN DE PLANTILLA
    atletas_db = db.query(models.PerfilAtleta).all()
    total_atletas = len(atletas_db)

    resumen_atletas = []
    atletas_con_lesion = 0

    for atleta in atletas_db:
        usuario = db.query(models.Usuario).filter(models.Usuario.id == atleta.atleta_id).first()

        # Última carga (para RPE)
        ultima_carga = db.query(models.CargaAtleta).filter(
            models.CargaAtleta.atleta_id == atleta.atleta_id
        ).order_by(models.CargaAtleta.id.desc()).first()

        # Último hábito (para descanso/hidratación)
        ultimo_habito = db.query(models.RegistroNutricional).filter(
            models.RegistroNutricional.atleta_id == atleta.atleta_id
        ).order_by(models.RegistroNutricional.id.desc()).first()

        # Lesión activa (fecha_alta == None significa que sigue de baja)
        lesion_activa = db.query(models.Lesion).filter(
            models.Lesion.atleta_id == atleta.atleta_id,
            models.Lesion.fecha_alta == None
        ).first()

        if lesion_activa:
            atletas_con_lesion += 1

        # Cálculo de nivel de riesgo simple (basado en datos, sin IA)
        rpe = ultima_carga.rpe_esfuerzo if ultima_carga else None
        descanso = ultimo_habito.calidad_descanso if ultimo_habito else None

        if lesion_activa:
            nivel_riesgo = "De Baja"
            color_riesgo = "rojo"
        elif rpe is not None and rpe >= 9:
            nivel_riesgo = "Riesgo Alto"
            color_riesgo = "rojo"
        elif rpe is not None and rpe >= 7:
            nivel_riesgo = "Riesgo Medio"
            color_riesgo = "amarillo"
        elif rpe is not None and descanso is not None and descanso <= 4:
            nivel_riesgo = "Descanso Bajo"
            color_riesgo = "amarillo"
        else:
            nivel_riesgo = "Óptimo"
            color_riesgo = "verde"

        # Partidos jugados en la temporada
        partidos_jugados = db.query(models.EstadisticasTacticas).filter(
            models.EstadisticasTacticas.atleta_id == atleta.atleta_id
        ).count()

        resumen_atletas.append({
            "atleta_id": atleta.atleta_id,
            "nombre": usuario.nombre if usuario else "Jugador",
            "apellido": usuario.apellido if usuario else "",
            "posicion": atleta.posicion_especifica or "N/A",
            "ultimo_rpe": rpe,
            "ultimo_descanso": descanso,
            "lesion_activa": lesion_activa.tipo_lesion if lesion_activa else None,
            "nivel_riesgo": nivel_riesgo,
            "color_riesgo": color_riesgo,
            "partidos_jugados": partidos_jugados
        })

    # 2. ESTADÍSTICAS DE PARTIDOS
    todos_partidos = db.query(models.Partido).all()
    finalizados = [p for p in todos_partidos if p.estado == "Finalizado"]

    ganados = 0
    perdidos = 0
    empatados = 0

    for p in finalizados:
        es_local = "Valle" in p.equipo_local
        if es_local:
            goles_valle = p.goles_local
            goles_rival = p.goles_visitante
        else:
            goles_valle = p.goles_visitante
            goles_rival = p.goles_local

        if goles_valle > goles_rival:
            ganados += 1
        elif goles_valle < goles_rival:
            perdidos += 1
        else:
            empatados += 1

    # 3. PRÓXIMOS PARTIDOS (Programados)
    proximos = db.query(models.Partido).filter(
        models.Partido.estado == "Programado"
    ).order_by(models.Partido.fecha_hora.asc()).limit(3).all()

    proximos_formateados = []
    for p in proximos:
        torneo_nombre = p.torneo.nombre if p.torneo else "Sin Torneo"
        proximos_formateados.append({
            "id": p.id,
            "equipo_local": p.equipo_local,
            "equipo_visitante": p.equipo_visitante,
            "fecha_hora": p.fecha_hora.isoformat() if p.fecha_hora else None,
            "torneo_nombre": torneo_nombre
        })

    # 4. CARGA PROMEDIO DEL EQUIPO (Últimas 5 sesiones)
    ultimas_sesiones = db.query(models.SesionEntrenamiento).order_by(
        models.SesionEntrenamiento.id.desc()
    ).limit(5).all()

    tendencia_carga = []
    for sesion in reversed(ultimas_sesiones):
        cargas_sesion = db.query(models.CargaAtleta).filter(
            models.CargaAtleta.sesion_id == sesion.id
        ).all()

        if cargas_sesion:
            rpe_promedio = sum(c.rpe_esfuerzo for c in cargas_sesion if c.rpe_esfuerzo) / len(cargas_sesion)
            salto_promedio = sum(c.saltos_cm for c in cargas_sesion if c.saltos_cm) / len([c for c in cargas_sesion if c.saltos_cm]) if any(c.saltos_cm for c in cargas_sesion) else 0
            tendencia_carga.append({
                "sesion": f"Ses. #{sesion.id}",
                "tipo": sesion.tipo_sesion or "Entrenamiento",
                "rpe_promedio": round(rpe_promedio, 1),
                "salto_promedio": round(salto_promedio, 1),
                "participantes": len(cargas_sesion)
            })

    return {
        "resumen_equipo": {
            "total_atletas": total_atletas,
            "atletas_con_lesion": atletas_con_lesion,
            "atletas_disponibles": total_atletas - atletas_con_lesion,
            "partidos_ganados": ganados,
            "partidos_perdidos": perdidos,
            "partidos_empatados": empatados,
            "total_partidos_jugados": len(finalizados)
        },
        "plantilla_estado": resumen_atletas,
        "proximos_partidos": proximos_formateados,
        "tendencia_carga_equipo": tendencia_carga
    }