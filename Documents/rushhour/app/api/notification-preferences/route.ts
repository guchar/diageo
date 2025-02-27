import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NotificationPreferences } from "@/lib/types";

const notificationPreferencesSchema = z.object({
  frequency: z.enum(["immediate", "hourly", "daily"]),
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  slack: z.boolean(),
  slackWebhook: z.string().url().optional(),
  quietHours: z
    .object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })
    .optional(),
  timezone: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prefs =
      typeof user.notificationPrefs === "string"
        ? (JSON.parse(user.notificationPrefs) as NotificationPreferences)
        : user.notificationPrefs;

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationPrefs: JSON.stringify(validatedData),
      },
    });

    const prefs = JSON.parse(
      updatedUser.notificationPrefs
    ) as NotificationPreferences;
    return NextResponse.json(prefs);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors }, { status: 400 });
    }
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
