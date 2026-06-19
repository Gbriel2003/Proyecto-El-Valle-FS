import json
import pdfplumber
import requests
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# --- JUGADOR 1: EL LECTOR DE PDF ---
def extraer_texto_pdf(ruta_archivo: str):
    texto_completo = ""
    try:
        with pdfplumber.open(ruta_archivo) as pdf:
            for pagina in pdf.pages:
                texto = pagina.extract_text()
                if texto:
                    texto_completo += texto + "\n"
        
        texto_completo = texto_completo.strip()
        if not texto_completo:
            return "Error al leer el PDF: El archivo PDF no contiene texto seleccionable/legible. Por favor, sube un PDF con texto digital (no escaneado como imagen)."
        return texto_completo
    except Exception as e:
        return f"Error al leer el PDF: {str(e)}"

# --- JUGADOR 2: EL ANALISTA TÁCTICO CON IA ---
def analizar_estadisticas_con_ia(texto_reporte: str):
    if texto_reporte.startswith("Error al leer el PDF:"):
        return {"error": "Error al leer el archivo PDF", "detalle_tecnico": texto_reporte}

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "Error de configuración en el servidor", "detalle_tecnico": "Falta la variable de entorno GROQ_API_KEY."}
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    prompt = f"""
    Eres un analista táctico de Futsal. Tu estilo es directo, telegráfico y al grano.
    Basado en el siguiente reporte de estadísticas, genera un análisis táctico en formato JSON.
    
    REGLA ESTRICTA: Sé extremadamente conciso. Usa máximo una o dos oraciones cortas por campo.
    
    Reporte:
    {texto_reporte}
    
    El JSON debe tener esta estructura exacta:
    {{
        "resumen_partido": "1 sola oración resumiendo la dinámica del juego.",
        "mvp": "Nombre del jugador y 1 sola razón corta de su impacto.",
        "puntos_fuertes": ["Una frase corta", "Una frase corta"],
        "puntos_a_mejorar": ["Una frase corta", "Una frase corta"],
        "analisis_individual": "Mención telegráfica de 1 o 2 jugadores clave máximo.",
        "estadisticas_jugadores": [
            {{
                "nombre": "Nombre del jugador extraído del texto",
                "goles": 0,
                "asistencias": 0,
                "recuperaciones": 0,
                "errores": 0
            }}
        ]
    }}
    Extrae las estadísticas de TODOS los jugadores mencionados en el texto. Si un dato no existe, pon 0.
    Nota: "recuperaciones" incluye robos, quites o intercepciones. "errores" incluye pérdidas de balón o errores de posicionamiento.
    Responde ÚNICAMENTE el objeto JSON puro sin ningún texto adicional.
    """
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        # NUEVO: Agregado timeout de 15 segundos para evitar cuelgues del servidor
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            texto_res = data['choices'][0]['message']['content'].strip()
            
            if "```json" in texto_res:
                texto_res = texto_res.split("```json")[1].split("```")[0]
            elif "```" in texto_res:
                texto_res = texto_res.split("```")[1].split("```")[0]
                
            # NUEVO: Captura específica por si la IA devuelve un JSON roto
            try:
                return json.loads(texto_res.strip())
            except json.JSONDecodeError:
                return {"error": "Formato de respuesta inválido", "detalle_tecnico": "La IA no devolvió un JSON compatible con el formato requerido."}
        else:
            return {"error": "El servidor de IA rechazó la petición", "detalle_tecnico": response.text}
            
    # NUEVO: Captura específica si se acaba el tiempo de espera
    except requests.exceptions.Timeout:
        return {"error": "Tiempo de espera agotado", "detalle_tecnico": "La IA tardó más de 15 segundos en responder."}
    except Exception as e:
        return {"error": "Fallo en la comunicación HTTP", "detalle_tecnico": str(e)}

# --- JUGADOR 3: EL ANALISTA DE FATIGA CON IA ---
def analizar_fatiga_con_ia(datos_cargas: str, datos_nutricionales: str = None, temporalidad: str = "diario"):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "Error de configuración en el servidor", "detalle": "Falta la variable de entorno GROQ_API_KEY."}

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    # Adaptamos las instrucciones del prompt según la temporalidad
    contexto_temporal = ""
    if temporalidad == "diario":
        contexto_temporal = "Analiza el impacto del entrenamiento del día de hoy. Evalúa la fatiga inmediata y prescribe recomendaciones de recuperación para las próximas 24 horas."
    elif temporalidad == "semanal":
        contexto_temporal = "Evalúa la fatiga acumulada a lo largo de esta semana (últimos 7 días). Identifica si hay sobrecarga por entrenamientos consecutivos y si es necesario dosificar el esfuerzo o cambiar hábitos para evitar lesiones."
    elif temporalidad == "mensual":
        contexto_temporal = "Analiza la tendencia de carga y fatiga de los últimos 30 días. Evalúa la adaptación física del atleta a este volumen de trabajo mensual y la consistencia de sus hábitos a mediano plazo."
    elif temporalidad == "anual":
        contexto_temporal = "Realiza un análisis macroscópico del comportamiento físico y nutricional del atleta a lo largo del último año. Identifica patrones estacionales, consistencia del estado físico y recomendaciones preventivas a largo plazo."
    else:
        contexto_temporal = "Evalúa la fatiga, riesgo de lesión y hábitos del atleta."

    prompt = f"""
    Eres un fisioterapeuta, nutricionista deportivo y preparador físico de Futsal de élite. Tu estilo es médico, directo, preventivo y profesional.
    {contexto_temporal}
    
    Datos de Cargas Físicas (RPE es esfuerzo del 1 al 10):
    {datos_cargas}
    """
    
    if datos_nutricionales:
        prompt += f"""
    Datos Nutricionales y Biométricos del periodo:
    {datos_nutricionales}
    
    IMPORTANTE: Si el esfuerzo físico es alto (RPE >= 8, sprints o saltos) y se reporta una hidratación baja (litros < 2) o una pérdida de peso relevante, cruza estos datos. La deshidratación combinada con esfuerzos explosivos multiplica el riesgo de calambres musculares y lesiones. Advierte sobre esto y recomienda suplementación con electrolitos de forma inmediata si se detectan estos factores.
        """
        
    prompt += """
    REGLA ESTRICTA: Sé extremadamente conciso.
    El JSON debe tener esta estructura exacta:
    {
        "nivel_fatiga": "Bajo, Medio, Alto o Crítico",
        "riesgo_lesion": "Bajo, Medio o Alto",
        "analisis": "1 sola oración explicando la tendencia cruzada de los datos físicos, hidratación y peso.",
        "recomendacion": "1 sola oración con la recomendación física y nutricional exacta."
    }
    Responde ÚNICAMENTE el objeto JSON puro.
    """
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        # NUEVO: Agregado timeout de 10 segundos (esta petición es más ligera)
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            texto_res = data['choices'][0]['message']['content'].strip()
            
            if "```json" in texto_res:
                texto_res = texto_res.split("```json")[1].split("```")[0]
            elif "```" in texto_res:
                texto_res = texto_res.split("```")[1].split("```")[0]
                
            try:
                return json.loads(texto_res.strip())
            except json.JSONDecodeError:
                return {"error": "Formato inválido", "detalle": "La IA no generó un JSON válido."}
        else:
            return {"error": "Fallo en IA", "detalle": response.text}
            
    # NUEVO: Captura específica si se acaba el tiempo de espera
    except requests.exceptions.Timeout:
        return {"error": "Timeout", "detalle": "La IA tardó demasiado en responder."}
    except Exception as e:
        return {"error": "Fallo HTTP", "detalle": str(e)}

# --- JUGADOR 4: EL ANALISTA DE ENTRENAMIENTO GRUPAL CON IA ---
def analizar_entrenamientos_equipo_con_ia(datos_sesiones: str, temporalidad: str = "diario"):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "Error de configuración en el servidor", "detalle": "Falta la variable de entorno GROQ_API_KEY."}

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    contexto_temporal = ""
    if temporalidad == "diario":
        contexto_temporal = "Analiza el rendimiento del equipo en la sesión de entrenamiento de HOY. Enfócate en la carga global, picos de intensidad y si el objetivo de la sesión se cumplió de forma equilibrada."
    elif temporalidad == "semanal":
        contexto_temporal = "Evalúa la tendencia de carga del equipo en esta semana (últimos 7 días). Identifica si hay sobrecarga acumulada o si la distribución física fue óptima para llegar al partido."
    elif temporalidad == "mensual":
        contexto_temporal = "Realiza un análisis macroscópico del equipo en los últimos 30 días. Evalúa la consistencia de asistencia, evolución del RPE promedio y picos de rendimiento físico colectivo."
    elif temporalidad == "anual":
        contexto_temporal = "Analiza la temporada del equipo en el último año. Identifica patrones estacionales de desgaste, meses de máxima carga y la estabilidad física general de la plantilla."

    prompt = f"""
    Eres el Científico del Deporte y Preparador Físico Jefe de un equipo de Futsal de élite. Tu estilo es táctico, biomecánico, analítico y altamente profesional.
    {contexto_temporal}
    
    Analiza la relación entre el esfuerzo subjetivo (RPE de 1 a 10), la cantidad de jugadores en riesgo de sobrecarga (RPE > 8) y las métricas físicas objetivas (salto vertical y velocidad en sprint) si están presentes.
    
    Datos de Entrenamientos y Cargas Grupales:
    {datos_sesiones}
    
    REGLA ESTRICTA: Sé extremadamente conciso. Si observas RPE altos constantes o caídas en el rendimiento físico (saltos/sprints), advierte sobre riesgo de lesión o fatiga del Sistema Nervioso Central. No inventes datos.
    El JSON debe tener esta estructura exacta:
    {{
        "carga_global": "Baja, Media, Alta o Crítica",
        "tendencia": "1 sola oración resumiendo la tendencia de carga cruzando el RPE y el rendimiento físico.",
        "puntos_fuertes": ["Una frase corta sobre adaptación física o consistencia", "Una frase corta"],
        "puntos_a_mejorar": ["Una frase corta sobre riesgo de lesiones, fatiga o desequilibrios", "Una frase corta"],
        "recomendacion_tecnica": "1 sola oración con una recomendación de biomecánica o recuperación para la próxima sesión."
    }}
    Responde ÚNICAMENTE el objeto JSON puro sin markdown envolvente.
    """
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            texto_res = data['choices'][0]['message']['content'].strip()
            
            if "```json" in texto_res:
                texto_res = texto_res.split("```json")[1].split("```")[0]
            elif "```" in texto_res:
                texto_res = texto_res.split("```")[1].split("```")[0]
                
            try:
                return json.loads(texto_res.strip())
            except json.JSONDecodeError:
                return {"error": "Formato inválido", "detalle": "La IA no generó un JSON válido."}
        else:
            return {"error": "Fallo en IA", "detalle": response.text}
            
    except requests.exceptions.Timeout:
        return {"error": "Timeout", "detalle": "La IA tardó demasiado en responder."}
    except Exception as e:
        return {"error": "Fallo HTTP", "detalle": str(e)}