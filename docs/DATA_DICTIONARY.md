# SoporTI - Diccionario de Datos

Este documento define la estructura lógica y física de la base de datos de **SoporTI**, implementada en **PostgreSQL 16** con la extensión **pgvector**. Todas las tablas se encuentran normalizadas en **Tercera Forma Normal (3FN)**.

---

## 1. Justificación de Normalización (3FN)
* **Primera Forma Normal (1FN):** Todas las columnas contienen valores atómicos indivisibles; no existen arreglos embebidos no tipados ni campos con listas concatenadas de valores.
* **Segunda Forma Normal (2FN):** Toda la información de las tablas depende directamente de su clave primaria completa (`id` tipo UUID v4). No existen dependencias parciales.
* **Tercera Forma Normal (3FN):** No existen dependencias transitivas. Por ejemplo, los datos del departamento del empleado o del equipo no se repiten en el ticket, sino que se referencian mediante sus respectivas claves foráneas (`department_id`, `requester_id`, `asset_id`).

---

## 2. Especificación Detallada de Tablas

### 2.1. Tabla: `departments`
Almacena las áreas o departamentos de la empresa cliente (pyme).

| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador único del área. |
| `name` | `VARCHAR(100)` | No | UK | Único | Nombre del departamento (ej: "Finanzas", "TI"). |
| `code` | `VARCHAR(20)` | No | UK | Único | Código mnemotécnico (ej: "FIN", "SOP"). |
| `created_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha y hora de creación. |
| `updated_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha y hora de última modificación. |

---

### 2.2. Tabla: `users`
Contiene los usuarios del sistema clasificados mediante RBAC.

| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador único del usuario. |
| `email` | `VARCHAR(150)` | No | UK | Formato email | Correo corporativo del usuario. |
| `password_hash` | `VARCHAR(255)` | No | | Hash Argon2id | Contraseña cifrada de forma segura. |
| `full_name` | `VARCHAR(150)` | No | | | Nombre y apellido del usuario. |
| `role` | `VARCHAR(20)` | No | | `IN ('admin', 'technician', 'employee')` | Rol asignado en el sistema (RBAC). |
| `specialty` | `VARCHAR(50)` | Sí | | `IN ('redes', 'hardware', 'software', ...)` | Especialidad técnica (solo para técnicos). |
| `phone` | `VARCHAR(20)` | Sí | | | Teléfono de contacto o WhatsApp. |
| `department_id` | `UUID` | Sí | FK | `REFERENCES departments(id) ON DELETE SET NULL` | Área a la que pertenece el usuario. |
| `is_active` | `BOOLEAN` | No | | `DEFAULT TRUE` | Estado de la cuenta (activo/inactivo). |
| `last_login_at`| `TIMESTAMPTZ` | Sí | | | Último inicio de sesión registrado. |
| `created_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha de creación del registro. |
| `updated_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha de última actualización. |

---

### 2.3. Tabla: `user_data_consents` (Ley 1581 de 2012)
Registro inmutable de la autorización de tratamiento de datos personales.

| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador del consentimiento. |
| `user_id` | `UUID` | No | FK | `REFERENCES users(id) ON DELETE CASCADE` | Usuario que otorga el consentimiento. |
| `policy_version`| `VARCHAR(20)` | No | | `DEFAULT 'v1.0'` | Versión del aviso legal aceptado. |
| `accepted` | `BOOLEAN` | No | | `DEFAULT TRUE` | Confirmación afirmativa del titular. |
| `ip_address` | `VARCHAR(45)` | No | | | Dirección IP de captura del consentimiento. |
| `user_agent` | `TEXT` | Sí | | | Navegador/dispositivo emisor. |
| `accepted_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Marca temporal exacta de aceptación. |

---

### 2.4. Tabla: `audit_logs`
Trazabilidad de operaciones críticas (creación, edición, eliminación y exportación).

| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador del registro de auditoría. |
| `user_id` | `UUID` | Sí | FK | `REFERENCES users(id) ON DELETE SET NULL` | Usuario responsable de la acción. |
| `action` | `VARCHAR(50)` | No | | `CREATE`, `UPDATE`, `DELETE`, etc. | Verbo o acción ejecutada. |
| `entity` | `VARCHAR(50)` | No | | `TICKETS`, `ASSETS`, `USERS`, etc. | Nombre de la entidad afectada. |
| `entity_id` | `VARCHAR(100)`| No | | | Clave primaria del registro alterado. |
| `old_values` | `JSONB` | Sí | | | Fotografía del estado anterior (en UPDATE/DELETE). |
| `new_values` | `JSONB` | Sí | | | Fotografía del nuevo estado (en CREATE/UPDATE). |
| `ip_address` | `VARCHAR(45)` | Sí | | | Dirección IP del cliente. |
| `created_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha y hora del evento de auditoría. |

---

### 2.5. Tabla: `assets` (CMDB Básica)
Control de hardware y equipos tecnológicos de la pyme.

| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador interno del activo. |
| `code` | `VARCHAR(50)` | No | UK | Placa única (ej. "ACT-0012") | Identificador físico visible en el equipo. |
| `name` | `VARCHAR(150)` | No | | | Nombre descriptivo del activo. |
| `category` | `VARCHAR(30)` | No | | `IN ('computer', 'printer', 'license', ...)` | Categoría del equipo. |
| `brand` | `VARCHAR(80)` | Sí | | | Marca fabricante (ej: Dell, HP, Lenovo). |
| `model` | `VARCHAR(80)` | Sí | | | Modelo comercial. |
| `serial_number`| `VARCHAR(100)`| Sí | UK | | Número de serie del fabricante. |
| `status` | `VARCHAR(20)` | No | | `IN ('in_stock', 'assigned', 'maintenance', 'decommissioned')` | Estado del ciclo de vida del activo. |
| `purchase_date`| `DATE` | Sí | | | Fecha de adquisición. |
| `warranty_expiration`| `DATE` | Sí | | | Fecha de vencimiento de garantía. |
| `assigned_to_user_id`| `UUID` | Sí | FK | `REFERENCES users(id) ON DELETE SET NULL` | Empleado custodio del equipo. |
| `department_id`| `UUID` | Sí | FK | `REFERENCES departments(id) ON DELETE SET NULL` | Ubicación departamental del equipo. |
| `qr_token` | `VARCHAR(100)`| No | UK | `gen_random_uuid()::text` | Token seguro para escaneo QR. |
| `created_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha de alta en inventario. |
| `updated_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Última actualización del registro. |

---

### 2.6. Tabla: `tickets` (Mesa de Ayuda)
Registro principal de solicitudes e incidencias técnicas.

| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador único interno. |
| `code` | `VARCHAR(20)` | No | UK | Código legible (ej. "SOP-0001") | Código para consulta del usuario. |
| `title` | `VARCHAR(200)` | No | | | Resumen corto del incidente. |
| `description` | `TEXT` | No | | | Detalle completo de la solicitud o falla. |
| `type` | `VARCHAR(20)` | No | | `IN ('network', 'software', 'hardware', 'access')` | Clasificación técnica del problema. |
| `priority` | `VARCHAR(20)` | No | | `IN ('low', 'medium', 'high', 'critical')` | Criticidad calculada según impacto. |
| `status` | `VARCHAR(20)` | No | | `IN ('new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed')` | Estado en el flujo de trabajo. |
| `requester_id` | `UUID` | No | FK | `REFERENCES users(id) ON DELETE RESTRICT` | Empleado que originó el ticket. |
| `assigned_technician_id`| `UUID`| Sí | FK | `REFERENCES users(id) ON DELETE SET NULL` | Técnico asignado para resolución. |
| `asset_id` | `UUID` | Sí | FK | `REFERENCES assets(id) ON DELETE SET NULL` | Equipo tecnológico asociado a la falla. |
| `parent_incident_id` | `UUID` | Sí | FK | `REFERENCES tickets(id) ON DELETE SET NULL` | Ticket padre si es incidente masivo. |
| `sla_first_response_deadline`| `TIMESTAMPTZ`| No | | | Fecha/hora máxima para primera atención. |
| `sla_resolution_deadline` | `TIMESTAMPTZ`| No | | | Fecha/hora máxima para resolución final. |
| `first_response_at` | `TIMESTAMPTZ` | Sí | | | Momento real de la primera respuesta. |
| `resolved_at` | `TIMESTAMPTZ` | Sí | | | Momento en que el técnico resolvió el caso. |
| `closed_at` | `TIMESTAMPTZ` | Sí | | | Cierre administrativo definitivo. |
| `sla_status` | `VARCHAR(20)` | No | | `IN ('on_time', 'warning', 'breached')` | Indicador de cumplimiento del SLA. |
| `created_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Fecha de creación del ticket. |
| `updated_at` | `TIMESTAMPTZ` | No | | `CURRENT_TIMESTAMP` | Última actualización. |

---

### 2.7. Tabla: `knowledge_articles` y `knowledge_chunks` (Base RAG)
Almacenan la documentación de soporte y los vectores numéricos para búsqueda semántica.

#### `knowledge_articles`
| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador del artículo. |
| `title` | `VARCHAR(200)` | No | | | Título del artículo (ej. "Cómo configurar VPN"). |
| `slug` | `VARCHAR(220)` | No | UK | Formato URL-friendly | Identificador amigable. |
| `category` | `VARCHAR(50)` | No | | | Categoría temática. |
| `content` | `TEXT` | No | | Formato Markdown | Texto íntegro del artículo. |
| `is_published` | `BOOLEAN` | No | | `DEFAULT TRUE` | Visibilidad para el chatbot/empleados. |
| `view_count` | `INT` | No | | `DEFAULT 0` | Métrica de lecturas. |
| `author_id` | `UUID` | Sí | FK | `REFERENCES users(id) ON DELETE SET NULL` | Técnico o administrador creador. |

#### `knowledge_chunks`
| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador del fragmento. |
| `article_id` | `UUID` | No | FK | `REFERENCES knowledge_articles(id) ON DELETE CASCADE` | Artículo al que pertenece. |
| `chunk_index` | `INT` | No | | Orden correlativo del fragmento | Posición dentro del artículo. |
| `chunk_content`| `TEXT` | No | | ~300 a 500 tokens | Fragmento textual de contexto. |
| `embedding` | `VECTOR(768)` | No | | Extensión pgvector (Google Gemini) | Representación vectorial semántica. |
| `token_count` | `INT` | No | | `DEFAULT 0` | Número de tokens en el chunk. |

---

### 2.8. Tabla: `chat_sessions` y `chat_messages`
Registran las interacciones del empleado con el asistente con IA y sus métricas de efectividad.

#### `chat_sessions`
| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador de la sesión de chat. |
| `user_id` | `UUID` | Sí | FK | `REFERENCES users(id) ON DELETE SET NULL` | Usuario si interactúa logueado. |
| `channel` | `VARCHAR(20)` | No | | `IN ('web_portal', 'qr_scan')` | Origen de la sesión. |
| `asset_id` | `UUID` | Sí | FK | `REFERENCES assets(id) ON DELETE SET NULL` | Equipo preidentificado (vía QR). |
| `status` | `VARCHAR(30)` | No | | `IN ('active', 'resolved_by_bot', 'escalated_to_ticket')` | Resultado de la conversación. |
| `derived_ticket_id`| `UUID` | Sí | FK | `REFERENCES tickets(id) ON DELETE SET NULL` | Ticket creado si hubo escalación. |

#### `chat_messages`
| Columna | Tipo de Dato | Nulo | Clave | Restricción / Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | PK | `gen_random_uuid()` | Identificador del mensaje. |
| `session_id` | `UUID` | No | FK | `REFERENCES chat_sessions(id) ON DELETE CASCADE` | Sesión contenedora. |
| `sender` | `VARCHAR(10)` | No | | `IN ('user', 'assistant', 'system')` | Emisor del mensaje. |
| `content` | `TEXT` | No | | | Texto del mensaje. |
| `sources_used`| `JSONB` | Sí | | JSON con artículos citados | Artículos de la base de conocimiento usados. |
| `confidence_score`| `FLOAT` | Sí | | Rango [0.0 - 1.0] | Nivel de similitud semántica. |
| `was_helpful` | `BOOLEAN` | Sí | | Registro del botón "¿Te sirvió?" | Métrica de resolución autónoma. |
| `extracted_ticket_data`| `JSONB`| Sí | | Esquema estructurado extraído | Datos detectados para precargar ticket. |
