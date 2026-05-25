ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" varchar(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" varchar(10) DEFAULT 'en';
