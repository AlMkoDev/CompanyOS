-- AlterTable
ALTER TABLE "Department"
ADD COLUMN     "operational_routines" JSONB,
ADD COLUMN     "data_pack" JSONB,
ADD COLUMN     "activities" JSONB,
ADD COLUMN     "communication_lines" JSONB;
