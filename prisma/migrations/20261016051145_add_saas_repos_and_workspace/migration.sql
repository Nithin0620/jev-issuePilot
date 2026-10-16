-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT DEFAULT 'TypeScript',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "connectionMode" TEXT NOT NULL DEFAULT 'demo',
    "webhookActive" BOOLEAN NOT NULL DEFAULT true,
    "autoSyncLabels" BOOLEAN NOT NULL DEFAULT true,
    "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "escalationThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "defaultTeam" TEXT NOT NULL DEFAULT 'Core Engineering',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "organizationName" TEXT NOT NULL DEFAULT 'Acme Cloud Engineering',
    "githubConnected" BOOLEAN NOT NULL DEFAULT false,
    "githubConnectionMode" TEXT NOT NULL DEFAULT 'none',
    "githubUsername" TEXT,
    "githubTokenHint" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "defaultMinConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "defaultEscalation" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "autoSyncLabels" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_fullName_key" ON "Repository"("fullName");
