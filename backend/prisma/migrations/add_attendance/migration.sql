CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Attendance_branchId_createdAt_idx" ON "Attendance"("branchId","createdAt");
CREATE INDEX IF NOT EXISTS "Attendance_userId_idx" ON "Attendance"("userId");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isStaff" BOOLEAN NOT NULL DEFAULT false;
