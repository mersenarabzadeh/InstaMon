-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."TimeWindow" AS ENUM ('H12', 'H24');

-- CreateTable
CREATE TABLE "public"."IgAccount" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IgPost" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL,
    "ogImageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IgMetric" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IgMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IgAccountSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "followers" BIGINT,

    CONSTRAINT "IgAccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WindowTop" (
    "id" TEXT NOT NULL,
    "window" "public"."TimeWindow" NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT NOT NULL,
    "interactions" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "WindowTop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrendingNow" (
    "id" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL,
    "velocityRatio" DOUBLE PRECISION NOT NULL,
    "interactions" INTEGER NOT NULL,
    "minutesSincePublish" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "TrendingNow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgAccount_handle_key" ON "public"."IgAccount"("handle");

-- CreateIndex
CREATE INDEX "IgPost_accountId_takenAt_idx" ON "public"."IgPost"("accountId", "takenAt");

-- CreateIndex
CREATE UNIQUE INDEX "IgPost_accountId_shortcode_key" ON "public"."IgPost"("accountId", "shortcode");

-- CreateIndex
CREATE INDEX "IgMetric_ts_idx" ON "public"."IgMetric"("ts");

-- CreateIndex
CREATE UNIQUE INDEX "IgMetric_postId_ts_key" ON "public"."IgMetric"("postId", "ts");

-- CreateIndex
CREATE INDEX "IgAccountSnapshot_accountId_ts_idx" ON "public"."IgAccountSnapshot"("accountId", "ts");

-- CreateIndex
CREATE INDEX "WindowTop_window_computedAt_rank_idx" ON "public"."WindowTop"("window", "computedAt", "rank");

-- CreateIndex
CREATE INDEX "TrendingNow_computedAt_rank_idx" ON "public"."TrendingNow"("computedAt", "rank");

-- AddForeignKey
ALTER TABLE "public"."IgPost" ADD CONSTRAINT "IgPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."IgAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgMetric" ADD CONSTRAINT "IgMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."IgPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgAccountSnapshot" ADD CONSTRAINT "IgAccountSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."IgAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WindowTop" ADD CONSTRAINT "WindowTop_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."IgPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrendingNow" ADD CONSTRAINT "TrendingNow_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."IgPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

