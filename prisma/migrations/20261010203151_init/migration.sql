-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "repository" TEXT DEFAULT 'default',
    "githubIssueNumber" INTEGER,
    "githubDeliveryId" TEXT,
    "githubSynced" BOOLEAN NOT NULL DEFAULT false,
    "appliedLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "categoryConfidence" DOUBLE PRECISION NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "severityConfidence" DOUBLE PRECISION NOT NULL,
    "escalationProbability" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL,
    "suggestedTeam" TEXT NOT NULL DEFAULT 'Triage',
    "rawProbabilities" JSONB,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "humanCategory" TEXT,
    "humanPriority" TEXT,
    "humanNotes" TEXT,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_githubDeliveryId_key" ON "Issue"("githubDeliveryId");

-- CreateIndex
CREATE INDEX "Issue_needsReview_humanReviewed_idx" ON "Issue"("needsReview", "humanReviewed");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
