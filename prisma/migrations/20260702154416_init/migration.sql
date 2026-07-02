-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AdoptionStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "public"."CartState" AS ENUM ('draft', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('image', 'document', 'lab');

-- CreateEnum
CREATE TYPE "public"."PetStatus" AS ENUM ('available', 'in_treatment', 'adopted', 'injured', 'lost', 'quarantined');

-- CreateEnum
CREATE TYPE "public"."PetType" AS ENUM ('adoption', 'client');

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('food', 'medication', 'accessory', 'toy', 'hygiene', 'supplement', 'equipment');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'VET_ADMIN', 'VETERINARIAN', 'STAFF', 'ADOPTER');

-- CreateEnum
CREATE TYPE "public"."Sex" AS ENUM ('male', 'female', 'unknown');

-- CreateEnum
CREATE TYPE "public"."Species" AS ENUM ('dog', 'cat', 'bird', 'reptile', 'rodent', 'fish', 'other');

-- CreateEnum
CREATE TYPE "public"."VeterinaryType" AS ENUM ('clinic', 'shelter', 'store', 'emergency', 'combined');

-- CreateEnum
CREATE TYPE "public"."VisitType" AS ENUM ('checkup', 'emergency', 'surgery', 'grooming', 'dental', 'follow_up', 'vaccination', 'lab_test', 'hospitalization');

-- CreateTable
CREATE TABLE "public"."adoptions" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "adopterId" INTEGER NOT NULL,
    "veterinaryId" INTEGER NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "status" "public"."AdoptionStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "adoptionFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "homeCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "homeCheckNotes" TEXT,
    "signedContract" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "adoptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "veterinaryId" INTEGER NOT NULL,
    "specialistId" INTEGER,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "visitType" TEXT NOT NULL DEFAULT 'checkup',
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cart_lines" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "priceUnit" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION,

    CONSTRAINT "cart_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carts" (
    "id" SERIAL NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "veterinaryId" INTEGER,
    "userId" INTEGER,
    "dateOrder" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" "public"."CartState" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_attachments" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "name" TEXT,
    "fileData" TEXT,
    "fileType" "public"."FileType",

    CONSTRAINT "medical_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_records" (
    "id" SERIAL NOT NULL,
    "odooRecordId" INTEGER,
    "petId" INTEGER NOT NULL,
    "veterinaryId" INTEGER NOT NULL,
    "veterinarianName" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitType" "public"."VisitType" NOT NULL DEFAULT 'checkup',
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "temperature" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "weight" DOUBLE PRECISION,
    "bodyCondition" INTEGER,
    "diagnosis" TEXT[],
    "procedures" TEXT[],
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partners" (
    "id" SERIAL NOT NULL,
    "odooPartnerId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "userId" INTEGER,
    "veterinaryId" INTEGER,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pet_images" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "imageData" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "pet_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pets" (
    "id" SERIAL NOT NULL,
    "odooPetId" INTEGER,
    "name" TEXT NOT NULL,
    "petType" "public"."PetType" NOT NULL DEFAULT 'adoption',
    "species" "public"."Species" NOT NULL DEFAULT 'dog',
    "breed" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" "public"."Sex" NOT NULL DEFAULT 'unknown',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "color" TEXT,
    "microchipId" TEXT,
    "status" "public"."PetStatus" NOT NULL DEFAULT 'available',
    "description" TEXT,
    "veterinaryId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "rescuedAt" TIMESTAMP(3),
    "adoptedAt" TIMESTAMP(3),
    "sterilized" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT[],
    "vaccinations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescription_lines" (
    "id" SERIAL NOT NULL,
    "prescriptionId" INTEGER NOT NULL,
    "productName" TEXT,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "quantity" INTEGER,
    "instructions" TEXT,

    CONSTRAINT "prescription_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescriptions" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER,
    "petId" INTEGER NOT NULL,
    "veterinarianName" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "instructions" TEXT,
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_images" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" SERIAL NOT NULL,
    "odooProductId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "unit" TEXT,
    "category" "public"."ProductCategory" NOT NULL DEFAULT 'food',
    "brand" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "veterinaryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "id" SERIAL NOT NULL,
    "veterinaryId" INTEGER NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "openTime" TEXT DEFAULT '08:00',
    "closeTime" TEXT DEFAULT '17:00',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "veterinaryId" INTEGER NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_links" (
    "id" SERIAL NOT NULL,
    "veterinaryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialist_specialties" (
    "specialistId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "specialist_specialties_pkey" PRIMARY KEY ("specialistId","specialtyId")
);

-- CreateTable
CREATE TABLE "public"."specialists" (
    "id" SERIAL NOT NULL,
    "veterinaryUserId" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "licenseNumber" TEXT,
    "veterinaryId" INTEGER NOT NULL,

    CONSTRAINT "specialists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."surgeries" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "recordId" INTEGER NOT NULL,
    "surgeryType" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "surgeonName" TEXT,
    "anesthesia" TEXT,
    "complications" TEXT,
    "outcome" TEXT,
    "postOpInstructions" TEXT,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "odooUserId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "photoUrl" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'ADOPTER',
    "veterinaryId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vaccines" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "batchNumber" TEXT,
    "administeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "veterinarianName" TEXT,
    "manufacturer" TEXT,
    "nextDoseDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."veterinaries" (
    "id" SERIAL NOT NULL,
    "odooVeterinaryId" INTEGER,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "taxId" TEXT,
    "licenseNumber" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "type" "public"."VeterinaryType" NOT NULL DEFAULT 'clinic',
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "isHospital" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffUserId" INTEGER,

    CONSTRAINT "veterinaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."veterinary_users" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "veterinaryId" INTEGER NOT NULL,
    "role" "public"."Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "veterinary_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "public"."carts"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "partners_userId_key" ON "public"."partners"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "specialists_veterinaryUserId_key" ON "public"."specialists"("veterinaryUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "veterinaries_staffUserId_key" ON "public"."veterinaries"("staffUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "veterinary_users_userId_key" ON "public"."veterinary_users"("userId" ASC);

-- AddForeignKey
ALTER TABLE "public"."adoptions" ADD CONSTRAINT "adoptions_adopterId_fkey" FOREIGN KEY ("adopterId") REFERENCES "public"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adoptions" ADD CONSTRAINT "adoptions_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adoptions" ADD CONSTRAINT "adoptions_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "public"."specialists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_lines" ADD CONSTRAINT "cart_lines_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_lines" ADD CONSTRAINT "cart_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_attachments" ADD CONSTRAINT "medical_attachments_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partners" ADD CONSTRAINT "partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."partners" ADD CONSTRAINT "partners_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pet_images" ADD CONSTRAINT "pet_images_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pets" ADD CONSTRAINT "pets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pets" ADD CONSTRAINT "pets_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescription_lines" ADD CONSTRAINT "prescription_lines_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedules" ADD CONSTRAINT "schedules_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_links" ADD CONSTRAINT "social_links_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specialist_specialties" ADD CONSTRAINT "specialist_specialties_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "public"."specialists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specialist_specialties" ADD CONSTRAINT "specialist_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specialists" ADD CONSTRAINT "specialists_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."specialists" ADD CONSTRAINT "specialists_veterinaryUserId_fkey" FOREIGN KEY ("veterinaryUserId") REFERENCES "public"."veterinary_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surgeries" ADD CONSTRAINT "surgeries_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surgeries" ADD CONSTRAINT "surgeries_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vaccines" ADD CONSTRAINT "vaccines_petId_fkey" FOREIGN KEY ("petId") REFERENCES "public"."pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."veterinaries" ADD CONSTRAINT "veterinaries_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."veterinary_users" ADD CONSTRAINT "veterinary_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."veterinary_users" ADD CONSTRAINT "veterinary_users_veterinaryId_fkey" FOREIGN KEY ("veterinaryId") REFERENCES "public"."veterinaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

