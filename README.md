# PIENSA+ — versión conectada a IA

Aplicación web educativa que utiliza la API de OpenAI desde un servidor. La clave API se mantiene en el servidor y nunca se escribe en el navegador.

## Requisitos
- Node.js 18 o superior.
- Una clave de API de OpenAI con acceso y facturación configurados. La API puede tener costos; revisa las condiciones con tu docente o un adulto responsable.

## Ejecutar localmente
1. Descomprime el proyecto.
2. En una terminal, entra a la carpeta `piensa_plus_ai`.
3. Configura la variable de entorno `OPENAI_API_KEY` con tu clave. **No la compartas por chat, no la publiques y no la pegues en `index.html`.**
   - macOS/Linux: `export OPENAI_API_KEY="tu_clave"`
   - Windows PowerShell: `$env:OPENAI_API_KEY="tu_clave"`
4. Ejecuta `npm start`.
5. Abre `http://localhost:3000` en el navegador.

## Publicarla para que otros la usen
Despliega esta carpeta en un servicio que permita ejecutar Node.js. Configura `OPENAI_API_KEY` como variable secreta del servidor en el panel del proveedor. No uses una clave dentro del HTML ni en GitHub. Comparte la URL pública solo después de probarla.

## Qué hace
- Recibe la pregunta, materia y nivel del estudiante.
- Envía el historial al modelo para adaptar la siguiente pregunta orientadora.
- Mantiene la clave de API en el servidor.
- Instruye al tutor para que guíe sin entregar directamente la solución.

## Nota
Esta es una base funcional lista para conectar con una cuenta de API. No incluye una clave ni un servicio de alojamiento; por eso, sin configurar `OPENAI_API_KEY` y ejecutar/desplegar el servidor, la IA no podrá responder.
