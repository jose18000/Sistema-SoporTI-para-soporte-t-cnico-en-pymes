# SoporTI - Plataforma de Mesa de Ayuda y Gestión de Activos TI para Pymes con Asistente Conversacional (RAG)

> **Proyecto de Grado de Ingeniería de Sistemas (9.º semestre)**  
> **Arquitectura:** Monolito Modular | **Coste de Infraestructura:** $0 USD (100 % Open Source & Free Tier) | **Cumplimiento Legal:** Ley 1581 de 2012 (Colombia - Protección de Datos Personales).

---

## 1. Problema y Solución

* **Problema:** En las pequeñas y medianas empresas (pymes) sin un departamento de TI formal, las solicitudes de soporte técnico se gestionan de manera informal (vía WhatsApp, llamadas, pasillo o correos no clasificados), provocando pérdida de trazabilidad, demoras prolongadas y saturación de los técnicos en problemas repetitivos básicos.
* **Solución:** **SoporTI** centraliza el ciclo de vida de los incidentes en un sistema de tickets estructurado con métricas de SLA, vincula los problemas al inventario físico de activos (CMDB) mediante códigos QR y automatiza la resolución de fallas frecuentes de primer nivel mediante un **asistente conversacional inteligente con RAG (Retrieval-Augmented Generation)**.

---

## 2. Pila Tecnológica ($0 Cost)

| Capa | Tecnología | Justificación y Costo |
| :--- | :--- | :--- |
| **Backend** | Node.js + NestJS + TypeScript | Monolito modular con tipado estricto y arquitectura empresarial. ($0) |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS | Interfaz moderna, reactiva, accesible y de alta velocidad. ($0) |
| **Base de Datos** | PostgreSQL 16 + extensión `pgvector` | Modelo relacional en 3FN y almacenamiento vectorial nativo. ($0) |
| **Colas y Tareas** | Redis 7 + BullMQ | Procesamiento asíncrono de correos, alertas y verificación periódica de SLA. ($0) |
| **Inteligencia Artificial** | Google Gemini API (Gemini 1.5 Flash + text-embedding-004) | Nivel gratuito oficial de Google AI Studio sin tarjeta de crédito. ($0) |
| **Correos de Prueba** | Mailpit (SMTP + Web UI) | Interfaz local para inspeccionar correos generados sin pasarelas de pago. ($0) |
| **Contenedores** | Docker & Docker Compose | Entorno reproducible y despliegue con un solo comando. ($0) |

---

## 3. Estado de Ejecución por Fases

- [x] **Fase 1: Arquitectura, Estructura del Repositorio y Modelo de Datos (3FN)**
  - [x] Justificación técnica de Monolito Modular vs. Microservicios.
  - [x] Estrategia de IA $0 Cost (Google Gemini Free Tier + fallback opcional a Ollama).
  - [x] Definición del modelo entidad-relación en Tercera Forma Normal (3FN).
  - [x] Script DDL de inicialización con extensión vectorial `pgvector` (`docker/postgres/init.sql`).
  - [x] Orquestación local en `docker-compose.yml` (PostgreSQL, Redis, Mailpit).
  - [x] Documentación de grado: [Arquitectura](docs/ARCHITECTURE.md) y [Diccionario de Datos](docs/DATA_DICTIONARY.md).
- [x] **Fase 2: Autenticación, Roles (RBAC) y Base del Backend (NestJS)**
  - [x] Configuración modular y tipado estricto con NestJS, TypeScript y TypeORM.
  - [x] Hashing criptográfico con **Argon2id** (estándar OWASP contra ataques de GPU).
  - [x] Autenticación con **JWT**: Access Token (15 min) y Refresh Token (7 días) para rotación segura.
  - [x] Control de Acceso Basado en Roles (**RBAC**) con `@Roles('admin', 'technician', 'employee')` y `RolesGuard`.
  - [x] Registro inmutable de consentimiento para la **Ley 1581 de 2012** (IP, fecha, versión de política).
  - [x] Servicio global de **Auditoría (`AuditLog`)** para trazabilidad de acciones críticas.
  - [x] Documentación interactiva Swagger / OpenAPI integrada en `/api/docs`.
- [ ] **Fase 3: Mesa de Ayuda (Tickets, Estrategias de Asignación, SLA y Notificaciones)**
- [ ] **Fase 4: Inventario Tecnológico (CMDB), Ciclo de Vida y Códigos QR**
- [ ] **Fase 5: Asistente Conversacional RAG, Base de Conocimiento y Extracción JSON**
- [ ] **Fase 6: Frontend SPA (React + Tailwind) y Dashboard de Métricas**
- [ ] **Fase 7: Pruebas Unitarias/Integración, Seguridad, Dockerfile y CI/CD**

---

## 4. Guía de Ejecución de la Fase 1 (Entorno Local)

### Requisitos Previos
* [Docker Desktop](https://www.docker.com/) instalado y en ejecución.
* [Node.js](https://nodejs.org/) v18+ y npm instalados.
* Git.

### Paso 1: Configurar Variables de Entorno
Copia el archivo de plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```
*(En Windows PowerShell: `Copy-Item .env.example .env`)*

### Paso 2: Iniciar la Infraestructura Base en Docker
Levanta los contenedores de PostgreSQL con `pgvector`, Redis y Mailpit:
```bash
docker compose up -d
```

### Paso 3: Verificar los Servicios Activos
* **PostgreSQL 16 + pgvector:** Puerto `localhost:5432` (Base de datos: `soporti_db`).
* **Redis 7:** Puerto `localhost:6379`.
* **Mailpit (Visor de Correos Web):** Abre en tu navegador `http://localhost:8025`.

---

## 5. Documentación Adicional
* [Especificación de Arquitectura y Diagramas UML](docs/ARCHITECTURE.md)
* [Diccionario de Datos Completo (3FN)](docs/DATA_DICTIONARY.md)
