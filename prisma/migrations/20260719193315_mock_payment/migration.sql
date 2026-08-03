-- CreateTable
CREATE TABLE "MockPayment" (
    "externalId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockPayment_pkey" PRIMARY KEY ("externalId")
);
