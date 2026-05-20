from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# 1. La "dirección" de nuestra base de datos (usuario:clave@servidor:puerto/nombre_bd)
URL_BASE_DATOS = os.getenv("DATABASE_URL")

# 2. El motor que se encarga de enchufarse a esa dirección
engine = create_engine(URL_BASE_DATOS)

# 3. La fábrica de sesiones (cada vez que queramos guardar a un jugador, abrimos una "sesión" temporal)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. La clase base: ¡ESTA ES LA QUE EL SERVIDOR NO ESTÁ ENCONTRANDO!
Base = declarative_base()