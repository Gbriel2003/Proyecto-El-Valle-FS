from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
import utils
from dependencies import get_db, verificar_cuerpo_tecnico, obtener_usuario_actual, verificar_cuerpo_o_nutricionista
from crud import atletas as crud_atletas
from crud import usuarios as crud_usuarios
from crud import entrenamientos as crud_entrenamientos

router = APIRouter(tags=["Atletas"])

@router.post("/atletas/", response_model=schemas.PerfilAtletaResponse)
def crear_perfil_atleta(
    perfil: schemas.PerfilAtletaCreate, 
    db: Session = Depends(get_db), 
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    usuario = crud_usuarios.obtener_usuario_por_id(db, perfil.atleta_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe. Regístralo primero en /usuarios/")
        
    perfil_existente = crud_atletas.obtener_perfil_atleta(db, perfil.atleta_id)
    if perfil_existente:
        raise HTTPException(status_code=400, detail="Este jugador ya tiene una ficha deportiva registrada")
        
    return crud_atletas.crear_perfil_atleta(db, perfil)

@router.get("/atletas/")
def obtener_plantilla_activa(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    atletas_db = crud_atletas.listar_perfiles_atletas(db, skip, limit)
    lista_formateada = []
    
    for atleta in atletas_db:
        usuario = crud_usuarios.obtener_usuario_por_id(db, atleta.atleta_id)
        # Buscar la última biometría registrada
        ultima_biometria = db.query(models.RegistroBiometrico).filter(
            models.RegistroBiometrico.atleta_id == atleta.atleta_id
        ).order_by(models.RegistroBiometrico.id.desc()).first()
        
        lista_formateada.append({
            "atleta_id": atleta.atleta_id,
            "nombre": usuario.nombre if usuario else "Jugador",
            "apellido": usuario.apellido if usuario else "Sin Registro",
            "posicion": atleta.posicion_especifica,
            "numero_camisa": "N/A",
            "estado_actual": "Activo",
            "detalles": f"Pierna hábil: {atleta.pierna_habil}",
            "peso_base": atleta.peso_base,
            "altura_base": atleta.altura_cm,
            "peso_actual": ultima_biometria.peso_kg if ultima_biometria else None,
            "imc_actual": ultima_biometria.imc if ultima_biometria else None
        })
        
    return lista_formateada

@router.put("/atletas/{atleta_id}", response_model=schemas.PerfilAtletaResponse)
def actualizar_perfil_atleta(
    atleta_id: int, 
    perfil_actualizado: schemas.PerfilAtletaUpdate, 
    db: Session = Depends(get_db), 
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    perfil = crud_atletas.actualizar_perfil_atleta(db, atleta_id, perfil_actualizado)
    if not perfil:
        raise HTTPException(status_code=404, detail="Ficha deportiva no encontrada")
    return perfil

@router.get("/atletas/{atleta_id}/analisis-fatiga")
def analizar_fatiga_atleta(
    atleta_id: int, 
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    # Buscamos las últimas 5 cargas físicas registradas para este atleta
    cargas = crud_entrenamientos.obtener_ultimas_cargas_atleta(db, atleta_id, 5)
    
    if not cargas:
        raise HTTPException(status_code=404, detail="No hay datos de entrenamiento suficientes para este atleta.")
        
    texto_cargas = f"Últimas {len(cargas)} sesiones registradas:\n"
    for c in cargas:
        rpe = c.rpe_esfuerzo if c.rpe_esfuerzo else "No medido"
        saltos = f"{c.saltos_cm} cm" if c.saltos_cm else "No medido"
        sprint = f"{c.tiempo_sprint_30m} s" if c.tiempo_sprint_30m else "No medido"
        texto_cargas += f"- Esfuerzo (RPE): {rpe}, Salto vertical: {saltos}, Sprint 30m: {sprint}\n"

    # Obtener biometría y nutrición para cruce inteligente
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    ultima_biometria = db.query(models.RegistroBiometrico).filter(
        models.RegistroBiometrico.atleta_id == atleta_id
    ).order_by(models.RegistroBiometrico.id.desc()).first()
    ultimo_habito = db.query(models.RegistroNutricional).filter(
        models.RegistroNutricional.atleta_id == atleta_id
    ).order_by(models.RegistroNutricional.id.desc()).first()

    texto_nutri = ""
    if atleta:
        texto_nutri += f"- Peso base (fichaje): {atleta.peso_base} kg\n"
    if ultima_biometria:
        texto_nutri += f"- Peso actual: {ultima_biometria.peso_kg} kg, IMC: {ultima_biometria.imc}\n"
        if atleta and atleta.peso_base and ultima_biometria.peso_kg:
            dif_peso = atleta.peso_base - ultima_biometria.peso_kg
            if dif_peso != 0:
                texto_nutri += f"- Cambio de peso: {'perdió' if dif_peso > 0 else 'ganó'} {abs(dif_peso):.1f} kg\n"
    if ultimo_habito:
        texto_nutri += f"- Hidratación diaria: {ultimo_habito.hidratacion_litros} litros\n"
        texto_nutri += f"- Calidad de descanso: {ultimo_habito.calidad_descanso}/10\n"
        texto_nutri += f"- Frecuencia de comidas: {ultimo_habito.frecuencia_comidas} al día\n"
        if ultimo_habito.suplementacion:
            texto_nutri += f"- Suplementación: {ultimo_habito.suplementacion}\n"
        if ultimo_habito.plan_alimentacion:
            texto_nutri += f"- Menú asignado: {ultimo_habito.plan_alimentacion}\n"

    analisis_preventivo = utils.analizar_fatiga_con_ia(texto_cargas, texto_nutri if texto_nutri else None)
    
    return {
        "atleta_id": atleta_id,
        "registros_analizados": len(cargas),
        "reporte_prevencion": analisis_preventivo
    }

@router.post("/atletas/{atleta_id}/biometria", response_model=schemas.RegistroBiometricoResponse)
def registrar_biometria_basica(
    atleta_id: int,
    biometria: schemas.RegistroBiometricoCreate,
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado en el sistema.")
    return crud_atletas.registrar_biometria(db, atleta_id, biometria)

@router.post("/atletas/{atleta_id}/habitos-nutricionales")
def registrar_habitos_diarios(
    atleta_id: int,
    registro: schemas.RegistroNutricionalCreate, 
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    return crud_atletas.registrar_habitos_nutricionales(db, atleta_id, registro)

@router.get("/atletas/{atleta_id}/habitos-nutricionales")
def obtener_habitos_diarios(
    atleta_id: int,
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    return crud_atletas.obtener_habitos_nutricionales(db, atleta_id)

@router.get("/atletas/{atleta_id}/biometria")
def obtener_biometria_atleta(
    atleta_id: int,
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    return db.query(models.RegistroBiometrico).filter(
        models.RegistroBiometrico.atleta_id == atleta_id
    ).order_by(models.RegistroBiometrico.fecha.desc()).all()

@router.get("/dietas/", response_model=list[schemas.PropuestaDietaResponse])
def listar_dietas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    dietas = db.query(models.PropuestaDieta).order_by(models.PropuestaDieta.id.asc()).all()
    if not dietas:
        # Pre-poblar
        default_menus = [
            {
                "nombre": "Menú pre-partido",
                "descripcion": "Alto en carbohidratos complejos (pasta o arroz integral), proteínas magras (pechuga de pollo/pavo) y muy bajo en grasas y fibra para optimizar la digestión y evitar molestias estomacales antes del partido. Consumir de 3 a 4 horas antes del encuentro.",
                "calorias": 750
            },
            {
                "nombre": "Menú post-partido",
                "descripcion": "Enfoque de rápida reposición de glucógeno y reconstrucción muscular. Incluye proteínas limpias de rápida absorción (pescado blanco, pollo) combinadas con carbohidratos simples (arroz blanco, puré de patata) y frutas (plátano o piña). Consumir en la ventana de 2 horas post-partido.",
                "calorias": 850
            },
            {
                "nombre": "Menú de recuperación",
                "descripcion": "Menú altamente antiinflamatorio y rico en antioxidantes. Incorpora grasas saludables (salmón, aguacate, frutos secos), carbohidratos complejos fibrosos (quinoa, verduras de hoja verde como espinacas) y bayas (arándanos o fresas) para acelerar la regeneración de tejidos.",
                "calorias": 650
            },
            {
                "nombre": "Plan de definición",
                "descripcion": "Déficit calórico controlado con alto aporte proteico (2.2g por kg de peso) para proteger la masa muscular. Reducción moderada de grasas y carbohidratos, concentrando los carbohidratos complejos en torno a las sesiones de entrenamiento. Hidratación abundante obligatoria.",
                "calorias": 1800
            },
            {
                "nombre": "Plan de volumen",
                "descripcion": "Superávit calórico limpio enfocado en la ganancia de masa muscular magra. Distribución de 5 a 6 comidas diarias con fuentes de carbohidratos de alto valor biológico (avena, pasta, camote) y proteínas completas (huevo, carne roja magra, pollo). Incluir batidos de avena y proteínas.",
                "calorias": 3200
            }
        ]
        for item in default_menus:
            db_dieta = models.PropuestaDieta(
                nombre=item["nombre"],
                descripcion=item["descripcion"],
                calorias=item["calorias"]
            )
            db.add(db_dieta)
        db.commit()
        dietas = db.query(models.PropuestaDieta).order_by(models.PropuestaDieta.id.asc()).all()
    return dietas

@router.post("/dietas/", response_model=schemas.PropuestaDietaResponse)
def guardar_o_actualizar_dieta(
    dieta: schemas.PropuestaDietaCreate,
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    # Intentar buscar por nombre para hacer upsert (case insensitive)
    db_dieta = db.query(models.PropuestaDieta).filter(
        models.PropuestaDieta.nombre.ilike(dieta.nombre)
    ).first()
    
    if db_dieta:
        db_dieta.descripcion = dieta.descripcion
        db_dieta.calorias = dieta.calorias
    else:
        db_dieta = models.PropuestaDieta(
            nombre=dieta.nombre,
            descripcion=dieta.descripcion,
            calorias=dieta.calorias
        )
        db.add(db_dieta)
        
    db.commit()
    db.refresh(db_dieta)
    return db_dieta

@router.delete("/dietas/{dieta_id}")
def eliminar_dieta(
    dieta_id: int,
    db: Session = Depends(get_db),
    usuario_autorizado: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    db_dieta = db.query(models.PropuestaDieta).filter(models.PropuestaDieta.id == dieta_id).first()
    if not db_dieta:
        raise HTTPException(status_code=404, detail="Dieta no encontrada.")
    db.delete(db_dieta)
    db.commit()
    return {"mensaje": "Dieta eliminada correctamente."}
