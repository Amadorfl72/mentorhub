# MentorHub - Resumen del Proyecto

## Narrativa de la Aplicación
MentorHub es una plataforma diseñada para conectar mentores y mentees. El objetivo principal es facilitar la transferencia de conocimiento y habilidades entre expertos (mentores) y personas en desarrollo (mentees) mediante sesiones organizadas en la plataforma. 

La aplicación proporcionará una experiencia fluida desde la inscripción hasta el seguimiento, destacándose por su facilidad de uso y su enfoque en la personalización.

---

## Actores y Assets Principales

### Actores
- **Mentores**: Profesionales con experiencia en diferentes áreas que ofrecen sesiones para compartir conocimientos.
- **Mentees**: Usuarios interesados en aprender y mejorar sus habilidades mediante mentorías.

### Assets
- **Perfiles de Usuarios**: Incluyen información básica y preferencias de mentores y mentees.
- **Sesiones de Mentoría**: Eventos programados donde los mentees pueden registrarse y participar.
- **Sistema de Retroalimentación**: Permite a los mentees calificar y comentar sobre las sesiones.
- **Sistema de Notificaciones**: Enviar recordatorios y notificaciones relevantes a los usuarios.

---

## Principales Features y Decisiones Técnicas

1. **Inicio de sesión con Single Sign-On (SSO)**:
   - Integración con Google para simplificar el acceso y aumentar la seguridad.

2. **Gestor de Sesiones**:
   - Los usuarios pueden explorar sesiones abiertas y registrarse directamente desde la aplicación.
   - Confirmaciones de inscripción enviadas vía correo electrónico.

3. **Retroalimentación**:
   - Sistema de calificaciones y comentarios por parte de los mentees después de cada sesión.

4. **Notificaciones Personalizadas (Futuro)**:
   - Notificaciones sobre sesiones que coincidan con los intereses del usuario.

5. **Estructura Modular**:
   - Backend con Flask para manejar APIs.
   - Frontend con React para una interfaz de usuario dinámica.

6. **Base de Datos**:
   - PostgreSQL para gestión de datos relacionales y escalabilidad.

---

## Stack Tecnológico

- **Backend**: Python con Flask.
- **Frontend**: React.
- **Base de Datos**: PostgreSQL.
- **Gestor de Dependencias**: Pip para Python, npm/yarn para React.
- **Control de Versiones**: Git y GitHub.
- **Contenerización** (Opcional): Docker para gestión de despliegue.
- **Sistema de Notificaciones**: Email con integraciones de servicios como SendGrid o SMTP (por definir).

---

## Guía de Inicio
Este documento servirá como referencia para el desarrollo inicial y futuras iteraciones de MentorHub. Las decisiones técnicas y las funcionalidades pueden ajustarse a medida que avanzamos en el proyecto.
