import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";


const ReviewSchema = z.object({
  action: z.enum(["approve", "override"]),
  humanCategory: z.string().optional(),
  humanPriority: z.string().optional(),
  humanNotes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = ReviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
    }

    const updated = await db.issue.update({
      where: { id },
      data: {
        humanReviewed: true,
        humanCategory: parsed.data.humanCategory,
        humanPriority: parsed.data.humanPriority,
        humanNotes: parsed.data.humanNotes,
      },
    });

    return NextResponse.json({ success: true, issue: updated });
  } catch {
    return NextResponse.json(
      { error: "Could not update issue review" },
      { status: 500 }
    );
  }
}
