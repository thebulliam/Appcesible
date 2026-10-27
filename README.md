# Accesible Desk

App web solo frontend (React + JSX, estructura Create React App) guiada por voz y con teclado.
Pensada para personas con discapacidad visual y otras discapacidades que trabajan, por ejemplo, en service desk.

## Qué hace

- **Perfil para Copilot**: cuestionario pregunta a pregunta (voz o teclado) que genera un texto de instrucciones para pegar en un agente de Copilot u otra IA. También exporta un `.json` para volver a cargar y editar las respuestas.
- **Asistente de tickets**: guía la documentación de un ticket (tipo, resumen, prioridad, descripción, pasos, solución...) y guarda un historial en el navegador.
- **Dictar documento**: texto libre con dictado, lectura en voz alta y compartir.
- **Compartir**: copiar, descargar `.txt`, compartir con el sistema (Web Share), enviar por correo y lectura en voz alta.
- **Ajustes**: tema (claro, oscuro, alto contraste), tamaño de texto, voz de la app o lector de pantalla, idioma, velocidad, órdenes de voz y atajos.

## Arrancar

```bash
npm install
npm start          # desarrollo en http://localhost:3000
npm run build      # producción en /build
```

## Desplegar en Netlify

- Build command: `npm run build`
- Publish directory: `build`

Si Netlify falla por avisos de ESLint (CI trata los avisos como errores), el proyecto ya compila sin avisos; si añades código y aparecen, corrígelos o usa `CI=false npm run build`.

## Estructura

```
src/
  context/AppContext.jsx        ajustes, avisos y voz de la app
  hooks/useSpeechRecognition.jsx  dictado (Web Speech API)
  hooks/useFocusOnMount.jsx
  components/
    VoiceField.jsx              campo con dictado (Alt+M)
    VoiceChoice.jsx             opciones por voz (número o nombre)
    Wizard.jsx                  asistente pregunta a pregunta
    ShareBar.jsx                copiar, descargar, compartir, leer
    PageTitle.jsx
  pages/                        Inicio, PerfilCopilot, TicketAssistant, Documento, Ajustes
  utils/
    buildInstructions.js        respuestas -> instrucciones para Copilot
    buildTicket.js              respuestas -> documento de ticket
    speech.js, speechCommands.js, download.js, storage.js
```

## Atajos y órdenes de voz

| Atajo | Acción |
|---|---|
| Alt+M | Activar o desactivar el micrófono en el campo actual |
| Alt+S | Siguiente pregunta |
| Alt+A | Pregunta anterior |
| Alt+R | Repetir la pregunta |

Al dictar: «siguiente», «atrás», «repetir», «borrar». En preguntas de opciones, di el número o el nombre.
Los atajos se pueden desactivar en Ajustes si chocan con los de tu lector de pantalla o navegador.

## Limitaciones conocidas

- El dictado funciona en Chrome y Edge (Web Speech API). En Firefox no hay dictado; el resto de la app funciona con teclado. Alternativa de Windows: tecla Windows + H.
- El audio del dictado lo procesa el servicio de voz del navegador (puede ser externo). Avisar a quien lo use.
- No hay servidor: los datos (perfiles, tickets, documentos) viven en `localStorage` del navegador. Hay botón para borrarlos en Ajustes.
- No se conecta con ServiceNow, Jira ni Copilot: genera el texto para copiarlo.
- Los ajustes de voz y el resto de la interfaz deben probarse con NVDA y JAWS reales y con personas usuarias antes de darlos por buenos.
