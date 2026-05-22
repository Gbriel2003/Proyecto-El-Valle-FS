from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
import utils
from dependencies import get_db, verificar_cuerpo_tecnico, obtener_usuario_actual
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
        lista_formateada.append({
            "atleta_id": atleta.atleta_id,
            "nombre": usuario.nombre if usuario else "Jugador",
            "apellido": usuario.apellido if usuario else "Sin Registro",
            "posicion": atleta.posicion_especifica,
            "numero_camisa": "N/A",
            "estado_actual": "Activo",
            "detalles": f"Pierna hábil: {atleta.pierna_habil}"
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
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
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
        
    analisis_preventivo = utils.analizar_fatiga_con_ia(texto_cargas)
    
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
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
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
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    return crud_atletas.registrar_habitos_nutricionales(db, atleta_id, registro)

@router.get("/atletas/{atleta_id}/habitos-nutricionales")
def obtener_habitos_diarios(
    atleta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    return crud_atletas.obtener_habitos_nutricionales(db, atleta_id)
