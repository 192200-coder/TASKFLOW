-- =====================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- PROYECTO: PLATAFORMA DE GESTIÓN DE TAREAS COLABORATIVAS
-- BASADO EN: ACTIVIDAD 4 - SIMULACIÓN DE SPRINT (XP)
-- AUTORES: ROY, YAISON, YHEFERSON
-- FECHA: 2026
-- =====================================================
-- CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
--   [FIX-1] Columna 'updated_by' añadida directamente en 'tasks'
--           (el trigger after_task_update la referenciaba sin que existiera)
--   [FIX-2] Bug tipográfico en trigger after_task_update:
--           el 4° argumento del INSERT de due_date decía NEW.due_date
--           en lugar del alias de columna 'new_value'. Corregido.
--   [FIX-3] task_comments.user_id cambiado a ON DELETE SET NULL
--           para coherencia con la auditoría (evitar inconsistencia con
--           tasks.created_by que es ON DELETE RESTRICT).
--           user_id pasa a ser NULLable en dicha tabla.
--   [FIX-4] Eliminados COMMENT en FOREIGN KEY, PRIMARY KEY y UNIQUE KEY.
--           MySQL no admite esa sintaxis en constraints; se movieron a
--           comentarios SQL (--).
--   [FIX-5] Tabla 'columns' ahora incluye created_at y updated_at
--           (Sequelize los requería en el INSERT y fallaba con
--            ER_BAD_FIELD_ERROR al crear un tablero).
--   [MEJORA] FULLTEXT index en tasks(title, description) para
--            búsquedas por texto (HU-012).
-- =====================================================

CREATE DATABASE IF NOT EXISTS taskflow_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskflow_db;


-- =====================================================
-- TABLA: users (HU-013: Gestión de perfil, HU-001: Registro)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Identificador único del usuario',
    name                VARCHAR(100)  NOT NULL                   COMMENT 'Nombre completo del usuario',
    email               VARCHAR(150)  NOT NULL UNIQUE            COMMENT 'Correo electrónico (único, usado para login)',
    password_hash       VARCHAR(255)  NOT NULL                   COMMENT 'Hash de la contraseña (bcrypt)',
    avatar_url          VARCHAR(500)  NULL                       COMMENT 'URL de la imagen de perfil',
    email_verified_at   TIMESTAMP     NULL                       COMMENT 'Marca de tiempo cuando se verificó el email',
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT 'Fecha de registro',
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP         COMMENT 'Última actualización del perfil',

    INDEX idx_users_email (email)
) ENGINE=InnoDB COMMENT='Almacena la información de los usuarios registrados.';


-- =====================================================
-- TABLA: boards (HU-001: Crear tablero)
-- =====================================================
CREATE TABLE IF NOT EXISTS boards (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(255) NOT NULL                  COMMENT 'Nombre del tablero',
    description       TEXT         NULL                      COMMENT 'Descripción detallada del proyecto',
    cover_image_url   VARCHAR(500) NULL                      COMMENT 'URL de la imagen/color de portada',
    owner_id          INT UNSIGNED NOT NULL                  COMMENT 'ID del usuario que creó el tablero',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Si el dueño se elimina, sus tableros también.
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_boards_owner_id (owner_id)
) ENGINE=InnoDB COMMENT='Almacena los tableros/proyectos.';


-- =====================================================
-- TABLA: board_members (HU-002: Invitar miembros)
-- =====================================================
CREATE TABLE IF NOT EXISTS board_members (
    board_id    INT UNSIGNED NOT NULL,
    user_id     INT UNSIGNED NOT NULL,
    role        ENUM('admin', 'member', 'viewer') DEFAULT 'member' COMMENT 'Rol del usuario en el tablero',
    joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Un usuario no puede estar dos veces en el mismo tablero.
    PRIMARY KEY (board_id, user_id),
    -- Si se elimina el tablero, se eliminan los miembros.
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    -- Si un usuario se elimina, se le quita de todos los tableros.
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    INDEX idx_board_members_user_id (user_id)
) ENGINE=InnoDB COMMENT='Relación muchos a muchos: Usuarios miembros de un tablero.';


-- =====================================================
-- TABLA: columns (HU-003: Gestionar columnas)
-- [FIX-5] Agregadas created_at y updated_at (requeridas por Sequelize)
-- =====================================================
CREATE TABLE IF NOT EXISTS columns (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL                COMMENT 'Nombre de la columna (Ej: "Por Hacer", "En Progreso")',
    position    INT UNSIGNED NOT NULL DEFAULT 0      COMMENT 'Orden de la columna en el tablero (0, 1, 2...)',
    board_id    INT UNSIGNED NOT NULL,
    -- [FIX-5] Sequelize inserta estos campos automáticamente; sin ellos falla con ER_BAD_FIELD_ERROR
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Si se elimina el tablero, se eliminan sus columnas.
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    -- No pueden existir dos columnas con la misma posición en un tablero.
    UNIQUE KEY uk_columns_board_position (board_id, position),
    INDEX idx_columns_board_id (board_id)
) ENGINE=InnoDB COMMENT='Columnas personalizables dentro de un tablero.';


-- =====================================================
-- TABLA: tasks (HU-004, HU-005, HU-006, HU-008)
-- [FIX-1] Se agrega 'updated_by' que el trigger after_task_update
--         necesitaba pero no existía en la versión anterior.
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(500)                      NOT NULL  COMMENT 'Título de la tarea',
    description     TEXT                              NULL      COMMENT 'Descripción detallada',
    priority        ENUM('Alta', 'Media', 'Baja')     NOT NULL  DEFAULT 'Media' COMMENT 'Prioridad (HU-008)',
    due_date        DATE                              NULL      COMMENT 'Fecha límite (HU-008)',
    position        INT UNSIGNED                      NOT NULL  DEFAULT 0 COMMENT 'Orden dentro de la columna',
    column_id       INT UNSIGNED                      NOT NULL  COMMENT 'Columna a la que pertenece',
    assigned_to     INT UNSIGNED                      NULL      COMMENT 'Usuario responsable (HU-006)',
    created_by      INT UNSIGNED                      NOT NULL  COMMENT 'Usuario que creó la tarea',
    -- [FIX-1] Requerida por el trigger after_task_update
    updated_by      INT UNSIGNED                      NULL      COMMENT 'Último usuario que modificó la tarea',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Si se elimina la columna, se eliminan sus tareas.
    FOREIGN KEY (column_id)   REFERENCES columns(id) ON DELETE CASCADE,
    -- Si el usuario asignado se elimina, la tarea queda sin asignar.
    FOREIGN KEY (assigned_to) REFERENCES users(id)   ON DELETE SET NULL,
    -- No se puede eliminar un usuario que haya creado tareas (auditoría).
    FOREIGN KEY (created_by)  REFERENCES users(id)   ON DELETE RESTRICT,
    -- Si el último editor se elimina, se anula la referencia.
    FOREIGN KEY (updated_by)  REFERENCES users(id)   ON DELETE SET NULL,

    INDEX idx_tasks_column_position (column_id, position) COMMENT 'Optimiza ordenamiento por columna',
    INDEX idx_tasks_assigned_to     (assigned_to)         COMMENT 'Optimiza filtrado por responsable (HU-012)',
    INDEX idx_tasks_due_date        (due_date)            COMMENT 'Optimiza filtros por fecha y calendario (HU-011)',
    INDEX idx_tasks_priority        (priority)            COMMENT 'Optimiza filtrado por prioridad (HU-012)',
    -- [MEJORA] Búsqueda de texto completo en título y descripción (HU-012)
    FULLTEXT INDEX ft_tasks_search (title, description)   COMMENT 'Permite búsquedas de texto en tareas'
) ENGINE=InnoDB COMMENT='Almacena las tareas/tarjetas del sistema.';


-- =====================================================
-- TABLA: task_comments (HU-009: Comentar y mencionar)
-- [FIX-3] user_id es ahora NULLable con ON DELETE SET NULL
-- =====================================================
CREATE TABLE IF NOT EXISTS task_comments (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    content     TEXT         NOT NULL COMMENT 'Contenido del comentario (puede incluir @menciones)',
    task_id     INT UNSIGNED NOT NULL,
    -- [FIX-3] El comentario permanece aunque el usuario se elimine
    user_id     INT UNSIGNED NULL     COMMENT 'Usuario que hizo el comentario (NULL si fue eliminado)',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_task_comments_task_id (task_id)
) ENGINE=InnoDB COMMENT='Comentarios en las tareas.';


-- =====================================================
-- TABLA: task_attachments (HU-015: Adjuntar archivos)
-- Nota: Estructura lista aunque la HU esté pospuesta.
-- =====================================================
CREATE TABLE IF NOT EXISTS task_attachments (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name     VARCHAR(255)  NOT NULL COMMENT 'Nombre original del archivo',
    file_path     VARCHAR(500)  NOT NULL COMMENT 'Ruta en el servidor/S3',
    file_size     INT UNSIGNED  NOT NULL COMMENT 'Tamaño del archivo en bytes',
    mime_type     VARCHAR(100)  NOT NULL COMMENT 'Tipo MIME (ej: image/png, application/pdf)',
    task_id       INT UNSIGNED  NOT NULL,
    uploaded_by   INT UNSIGNED  NOT NULL COMMENT 'Usuario que subió el archivo',
    uploaded_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_attachments_task_id (task_id)
) ENGINE=InnoDB COMMENT='Archivos adjuntos a una tarea.';


-- =====================================================
-- TABLA: task_history (HU-015: Historial de cambios)
-- =====================================================
CREATE TABLE IF NOT EXISTS task_history (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id         INT UNSIGNED  NOT NULL,
    user_id         INT UNSIGNED  NULL    COMMENT 'Usuario que realizó el cambio (NULL si fue eliminado)',
    action          VARCHAR(50)   NOT NULL COMMENT 'Tipo: UPDATE, MOVE, ASSIGN, CREATE, etc.',
    field_changed   VARCHAR(100)  NULL    COMMENT 'Campo modificado (ej: title, column_id, priority)',
    old_value       TEXT          NULL    COMMENT 'Valor anterior',
    new_value       TEXT          NULL    COMMENT 'Valor nuevo',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento del cambio',

    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_task_history_task_id    (task_id),
    INDEX idx_task_history_created_at (created_at)
) ENGINE=InnoDB COMMENT='Registro de auditoría para todos los cambios en las tareas.';


-- =====================================================
-- TABLA: notifications (HU-010: Notificaciones en tiempo real)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL COMMENT 'Usuario destinatario',
    type        VARCHAR(50)  NOT NULL COMMENT 'Tipo: mention, task_assigned, due_date_approaching, etc.',
    data        JSON         NOT NULL COMMENT 'Datos específicos (ej: {"task_id": 5, "comment_id": 10})',
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Si el usuario ya la leyó',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB COMMENT='Sistema de notificaciones internas de la aplicación.';


-- =====================================================
-- TRIGGERS: Automatización del Historial (HU-015)
-- =====================================================
DELIMITER $$

-- -------------------------------------------------
-- TRIGGER: Capturar creación de tareas
-- -------------------------------------------------
CREATE TRIGGER after_task_insert
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    INSERT INTO task_history (task_id, user_id, action, field_changed, new_value)
    VALUES (NEW.id, NEW.created_by, 'CREATE', 'task',
            CONCAT('Tarea "', NEW.title, '" creada.'));
END$$


-- -------------------------------------------------
-- TRIGGER: Capturar actualizaciones de tareas
-- [FIX-1] Usa NEW.updated_by (columna ya existente en tasks)
-- [FIX-2] Corregido bug en INSERT de due_date
-- -------------------------------------------------
CREATE TRIGGER after_task_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    -- Cambio de título
    IF OLD.title != NEW.title THEN
        INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.updated_by, 'UPDATE', 'title', OLD.title, NEW.title);
    END IF;

    -- Cambio de descripción
    IF NOT (OLD.description <=> NEW.description) THEN
        INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.updated_by, 'UPDATE', 'description', OLD.description, NEW.description);
    END IF;

    -- Cambio de prioridad (HU-008)
    IF OLD.priority != NEW.priority THEN
        INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.updated_by, 'UPDATE', 'priority', OLD.priority, NEW.priority);
    END IF;

    -- Cambio de fecha de vencimiento (HU-008)
    IF NOT (OLD.due_date <=> NEW.due_date) THEN
        INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.updated_by, 'UPDATE', 'due_date', OLD.due_date, NEW.due_date);
    END IF;

    -- Cambio de columna / Drag & Drop (HU-007)
    IF OLD.column_id != NEW.column_id THEN
        INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.updated_by, 'MOVE', 'column_id', OLD.column_id, NEW.column_id);
    END IF;

    -- Cambio de responsable (HU-006)
    IF NOT (OLD.assigned_to <=> NEW.assigned_to) THEN
        INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
        VALUES (NEW.id, NEW.updated_by, 'ASSIGN', 'assigned_to', OLD.assigned_to, NEW.assigned_to);
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- NOTAS PARA EL EQUIPO DE DESARROLLO:
-- =====================================================
-- 1) El campo 'updated_by' en 'tasks' debe ser llenado por el backend
--    en cada sentencia UPDATE, pasando el ID del usuario autenticado.
--    Ejemplo (Node.js/Sequelize):
--      await Task.update(
--        { title: newTitle, updated_by: req.user.id },
--        { where: { id: taskId } }
--      );
--
-- 2) NOTA SOBRE <=> (NULL-safe equal):
--    NOT (A <=> B) es TRUE cuando A y B difieren, incluyendo casos
--    NULL vs no-NULL, sin necesitar condiciones adicionales.
--
-- 3) Todos los timestamps usan DATETIME en lugar de TIMESTAMP para
--    evitar problemas de zona horaria y el límite de año 2038.
-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
