/*
  Warnings:

  - You are about to drop the `ClinicaMovil` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Departamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Municipio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PuestoSalud` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RutaClinica` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ClinicaMovil";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Departamento";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Municipio";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PuestoSalud";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RutaClinica";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "articulos_salud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tema" TEXT,
    "etiquetas" TEXT,
    "fuente_url" TEXT,
    "aprobado" BOOLEAN NOT NULL DEFAULT true,
    "publicado_at" DATETIME,
    "created_at" DATETIME
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT,
    "departamento_id" TEXT,
    "municipio_id" TEXT,
    "canal" TEXT DEFAULT 'web',
    "created_at" DATETIME,
    "updated_at" DATETIME,
    CONSTRAINT "chat_sessions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "chat_sessions_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "chat_sessions_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "role" TEXT,
    "content" TEXT NOT NULL,
    "created_at" DATETIME,
    CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clinicas_moviles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "created_at" DATETIME
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departamento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "created_at" DATETIME,
    CONSTRAINT "municipios_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "enfermedades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "signos_alarma" TEXT,
    "nivel_riesgo" TEXT,
    "etiquetas" TEXT,
    "created_at" DATETIME
);

-- CreateTable
CREATE TABLE "sintomas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "created_at" DATETIME
);

-- CreateTable
CREATE TABLE "enfermedad_sintoma" (
    "enfermedad_id" TEXT NOT NULL,
    "sintoma_id" TEXT NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("sintoma_id", "enfermedad_id"),
    CONSTRAINT "enfermedad_sintoma_enfermedad_id_fkey" FOREIGN KEY ("enfermedad_id") REFERENCES "enfermedades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "enfermedad_sintoma_sintoma_id_fkey" FOREIGN KEY ("sintoma_id") REFERENCES "sintomas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jornadas_salud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT,
    "fecha" DATETIME NOT NULL,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "municipio_id" TEXT NOT NULL,
    "lugar" TEXT,
    "lat" REAL,
    "lng" REAL,
    "geom" TEXT,
    "created_at" DATETIME,
    CONSTRAINT "jornadas_salud_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "servicios_salud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT
);

-- CreateTable
CREATE TABLE "jornadas_servicios" (
    "jornada_id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,

    PRIMARY KEY ("jornada_id", "servicio_id"),
    CONSTRAINT "jornadas_servicios_jornada_id_fkey" FOREIGN KEY ("jornada_id") REFERENCES "jornadas_salud" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jornadas_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios_salud" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puestos_salud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "municipio_id" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "geom" TEXT,
    "created_at" DATETIME,
    CONSTRAINT "puestos_salud_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rutas_clinicas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinica_id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "punto_encuentro" TEXT,
    "lat" REAL,
    "lng" REAL,
    "geom" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'programada',
    "created_at" DATETIME,
    CONSTRAINT "rutas_clinicas_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas_moviles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rutas_clinicas_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preclasificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "enfermedad_id" TEXT,
    "riesgo" TEXT,
    "confidence" REAL,
    "created_at" DATETIME,
    CONSTRAINT "preclasificaciones_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "preclasificaciones_enfermedad_id_fkey" FOREIGN KEY ("enfermedad_id") REFERENCES "enfermedades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT,
    "edad" INTEGER,
    "sexo" TEXT,
    "departamento_id" TEXT,
    "municipio_id" TEXT,
    "created_at" DATETIME,
    "fcm_token" TEXT,
    CONSTRAINT "usuarios_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "usuarios_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spatial_ref_sys" (
    "srid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "auth_name" TEXT,
    "auth_srid" INTEGER,
    "srtext" TEXT,
    "proj4text" TEXT
);

-- CreateTable
CREATE TABLE "tabprueba" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lat" REAL,
    "lng" REAL,
    "nombre" TEXT,
    "descripcion" TEXT,
    "fecha" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "enfermedades_nombre_key" ON "enfermedades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "sintomas_nombre_key" ON "sintomas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_salud_nombre_key" ON "servicios_salud"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_fcm_token_key" ON "usuarios"("fcm_token");
