-- CreateTable
CREATE TABLE "vacancies" (
    "id" TEXT NOT NULL,
    "title_vacancy" TEXT NOT NULL,
    "url_vacancy" TEXT NOT NULL,
    "title_company" TEXT NOT NULL,
    "url_company" TEXT NOT NULL,
    "vacancy_status" TEXT NOT NULL,
    "response_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);
