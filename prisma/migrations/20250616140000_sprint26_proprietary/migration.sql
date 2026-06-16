-- Sprint 26: post-market proprietary trading EOD (CafeF)

CREATE TABLE "ProprietaryTradingDaily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "symbol" TEXT NOT NULL,
    "buyValue" DOUBLE PRECISION NOT NULL,
    "sellValue" DOUBLE PRECISION NOT NULL,
    "netValue" DOUBLE PRECISION NOT NULL,
    "buyVolume" DOUBLE PRECISION NOT NULL,
    "sellVolume" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'cafef',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProprietaryTradingDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProprietaryTradingDaily_date_symbol_source_key" ON "ProprietaryTradingDaily"("date", "symbol", "source");
CREATE INDEX "ProprietaryTradingDaily_date_idx" ON "ProprietaryTradingDaily"("date");
CREATE INDEX "ProprietaryTradingDaily_symbol_idx" ON "ProprietaryTradingDaily"("symbol");
