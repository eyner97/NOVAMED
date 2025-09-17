-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" DATETIME
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departamentoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" DATETIME,
    CONSTRAINT "Municipio_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicaMovil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME
);

-- CreateTable
CREATE TABLE "PuestoSalud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "municipioId" TEXT NOT NULL,
    "latitud" REAL,
    "longitud" REAL,
    CONSTRAINT "PuestoSalud_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RutaClinica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicaId" TEXT,
    "municipioId" TEXT,
    "fecha" DATETIME,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "puntoEncuentro" TEXT,
    "latitud" REAL,
    "longitud" REAL,
    "nombre" TEXT,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RutaClinica_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "ClinicaMovil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RutaClinica_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RutaClinica" ("createdAt", "descripcion", "id", "latitud", "longitud", "nombre", "updatedAt") SELECT "createdAt", "descripcion", "id", "latitud", "longitud", "nombre", "updatedAt" FROM "RutaClinica";
DROP TABLE "RutaClinica";
ALTER TABLE "new_RutaClinica" RENAME TO "RutaClinica";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
