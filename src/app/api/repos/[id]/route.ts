import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const UpdateRepoSchema = z.object({
  webhookActive: z.boolean().optional(),
  autoSyncLabels: z.boolean().optional(),
  minConfidence: z.number().min(0.5).max(0.99).optional(),
  escalationThreshold: z.number().min(0.5).max(0.99).optional(),
  defaultTeam: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = UpdateRepoSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid repository update payload" },
        { status: 400 }
      );
    }

    const updated = await db.repository.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ repository: updated });
  } catch {
    return NextResponse.json(
      { error: "Unable to update repository settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.repository.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove repository" },
      { status: 500 }
    );
  }
}
