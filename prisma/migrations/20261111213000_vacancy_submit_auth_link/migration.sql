-- Link search-field profile (vacancy_submit) to HH credentials (vacancy_auth).
ALTER TABLE "vacancy_submit" ADD COLUMN IF NOT EXISTS "vacancy_auth_id" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vacancy_submit_vacancy_auth_id_fkey'
    ) THEN
        ALTER TABLE "vacancy_submit"
            ADD CONSTRAINT "vacancy_submit_vacancy_auth_id_fkey"
            FOREIGN KEY ("vacancy_auth_id") REFERENCES "vacancy_auth"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_vacancy_submit_vacancy_auth_id" ON "vacancy_submit"("vacancy_auth_id");
