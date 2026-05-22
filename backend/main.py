from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

# Importar sub-routers
from routers import usuarios, atletas, partidos, entrenamientos, lesiones, jugadas, dashboards

# Importar manejadores globales y configuración de logs
from exceptions import registrar_manejadores_excepciones
from logging_config import logger

# Crear tablas en PostgreSQL al arrancar si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de El Valle F.S.",
    description="Backend modularizado y optimizado para la gestión del club deportivo El Valle F.S."
)

# Configuración de CORS para comunicarse con el frontend de React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://192.168.9.108:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar manejadores de excepciones globales (resiliencia del backend)
registrar_manejadores_excepciones(app)

# Estado básico de salud del servidor
@app.get("/", tags=["General"])
def ruta_principal():
    logger.info("Consulta al estado de salud del servidor realizada.")
    return {"mensaje": "¡El servidor de El Valle F.S. está vivo, modularizado y funcionando!"}

# Incluir sub-routers organizados
app.include_router(usuarios.router)
app.include_router(atletas.router)
app.include_router(partidos.router)
app.include_router(entrenamientos.router)
app.include_router(lesiones.router)
app.include_router(jugadas.router)
app.include_router(dashboards.router)