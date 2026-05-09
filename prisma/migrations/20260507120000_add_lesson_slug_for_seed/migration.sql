ALTER TABLE "Lesson" ADD COLUMN "slug" TEXT;

UPDATE "Lesson"
SET "slug" = CASE
  WHEN "title" = 'Conversa divertida' THEN 'conversa-divertida-ingles-iniciante'
  WHEN "title" = 'Palavras novas' THEN 'primeiras-palavras-ingles-iniciante'
  WHEN "title" = 'História curta' THEN 'historia-curta-ingles-basico'
  WHEN "title" = 'Desafio rápido' THEN 'desafio-rapido-ingles-iniciante'
  ELSE lower(regexp_replace("id", '[^a-zA-Z0-9]+', '-', 'g'))
END
WHERE "slug" IS NULL;

ALTER TABLE "Lesson" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");
