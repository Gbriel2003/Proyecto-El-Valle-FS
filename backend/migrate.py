import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE usuarios ADD COLUMN cedula VARCHAR(20) UNIQUE;")
    conn.commit()
    print('Columna cedula agregada a usuarios')
except Exception as e:
    print('Error:', e)
finally:
    cur.close()
    conn.close()
