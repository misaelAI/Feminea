Publicado
TODO.md



Feminea — resultados del proyecto
 Portada e identidad: mensaje claro, directo e impactante; nombre Feminea; wordmark e ilustración botánica rosa basados en la imagen proporcionada; variación tipográfica y jerarquía expresiva; botón “Empezar a conocer”; imagen representativa; colores rosado pastel, blanco y lavanda; botones animados al entrar y con respuesta al clic; diseño adaptable y accesible.
 Seis accesos temáticos: botones con los textos “Saber cuándo me llegará el periodo”, “Comprender mejor mi cuerpo”, “Hacer un seguimiento de los síntomas”, “Listar síntomas para los médicos”, “Quedar en embarazo” y “Monitorear mi embarazo”; cada botón abre su sección en un panel superpuesto sin desplazar la página; los temas tienen iconografía y microinteracciones y se pueden cerrar con el botón o la tecla Escape.
 Instalación como aplicación: manifiesto PWA propio con nombre “Feminea”, modo independiente y un icono cuadrado que contiene sólo el símbolo floral rosa de la imagen de referencia, con variantes para Android, iOS, favicon y máscaras de icono.
 Calendario y registro menstrual: calendario mensual como herramienta central; selección de fechas; registro del primer y último día de sangrado; ajuste de duración habitual del ciclo; indicación del próximo periodo estimado; marcas visuales para fechas registradas, estimadas y ventana fértil orientativa; navegación entre meses.
 Educación sobre el cuerpo: explicación en lenguaje sencillo del día 1 y de las fases menstrual, folicular, ovulación y lútea; ilustración representativa; enlaces directos a fuentes institucionales.
 Registro de síntomas: registro por fecha de síntomas físicos y emocionales, intensidad de 1 a 5 y nota opcional; notas visibles y eliminables en el navegador.
 Lista para consulta médica: resumen con todas las notas guardadas, fechas, síntomas, intensidad y notas; periodo más reciente; botón de impresión que muestra solo la lista de consulta.
 Fertilidad y embarazo: orientación sobre la ventana fértil y estimación personal; aviso explícito de que Feminea no es un método anticonceptivo ni confirma ovulación; contenido por trimestres; fecha probable de parto opcional con estimación de semanas y advertencia de consultar con el equipo prenatal; orientación para contactar a urgencias ante síntomas preocupantes.
 Referencias y reseña: fuentes internacionales y profesionales (OMS, NHS, ACOG) y fuentes nacionales estadounidenses en español (MedlinePlus y HHS/Oficina para la Salud de la Mujer); nota aclaratoria de que no se especificó país; enlace visible a la encuesta de Google Forms proporcionada.
 Privacidad y accesibilidad: periodos, síntomas, duración de ciclo y fecha probable de parto se almacenan en localStorage del dispositivo, sin envío a cuenta o base de datos; control para borrar datos locales; encabezados etiquetados, controles por teclado, etiquetas y avisos accesibles, movimiento reducido y textos legibles.
Verificación
 pnpm check (TypeScript) y pnpm build:static.
 Ruta GET /manus-routes.json servida como JSON; página, manifiesto PWA y todos los iconos responden con HTTP 200.
 Interacción probada en los seis temas: el panel abre y cierra sin cambiar el desplazamiento; Escape y el botón de cierre funcionan, y el foco vuelve al control que abrió el panel.
 Revisión visual de la marca en escritorio y móvil.
