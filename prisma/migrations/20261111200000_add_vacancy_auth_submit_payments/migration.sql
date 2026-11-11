-- Tables declared in schema.prisma but never migrated (GET /vacancy-auth & /vacancy-field 500s).
-- Idempotent: backend may already have created bare vacancy_* tables via CREATE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "vacancy_auth" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacancy_auth_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vacancy_submit" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "vacancy_url" TEXT NOT NULL DEFAULT '',
    "schedule" TEXT NOT NULL DEFAULT '',
    "order_by" TEXT NOT NULL DEFAULT '',
    "search_field" TEXT NOT NULL DEFAULT '',
    "experience" TEXT NOT NULL DEFAULT '',
    "search_period" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacancy_submit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Align nullable columns if a prior backend ensure created a looser vacancy_submit.
ALTER TABLE "vacancy_submit" ALTER COLUMN "position" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "message" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "vacancy_url" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "schedule" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "order_by" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "search_field" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "experience" SET DEFAULT '';
ALTER TABLE "vacancy_submit" ALTER COLUMN "search_period" SET DEFAULT '';
UPDATE "vacancy_submit" SET "position" = '' WHERE "position" IS NULL;
UPDATE "vacancy_submit" SET "message" = '' WHERE "message" IS NULL;
UPDATE "vacancy_submit" SET "vacancy_url" = '' WHERE "vacancy_url" IS NULL;
UPDATE "vacancy_submit" SET "schedule" = '' WHERE "schedule" IS NULL;
UPDATE "vacancy_submit" SET "order_by" = '' WHERE "order_by" IS NULL;
UPDATE "vacancy_submit" SET "search_field" = '' WHERE "search_field" IS NULL;
UPDATE "vacancy_submit" SET "experience" = '' WHERE "experience" IS NULL;
UPDATE "vacancy_submit" SET "search_period" = '' WHERE "search_period" IS NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "position" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "message" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "vacancy_url" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "schedule" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "order_by" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "search_field" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "experience" SET NOT NULL;
ALTER TABLE "vacancy_submit" ALTER COLUMN "search_period" SET NOT NULL;

DO $$ BEGIN
    ALTER TABLE "vacancy_auth" ADD CONSTRAINT "vacancy_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "vacancy_submit" ADD CONSTRAINT "vacancy_submit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "idx_vacancy_auth_user_id" ON "vacancy_auth"("user_id");
CREATE INDEX IF NOT EXISTS "idx_vacancy_submit_user_id" ON "vacancy_submit"("user_id");
CREATE INDEX IF NOT EXISTS "idx_payments_user_id" ON "payments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions"("user_id");
