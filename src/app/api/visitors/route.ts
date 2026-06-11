import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, mobile, location, browser, sessionTime, phoneSpec } = body;

    if (id) {
      // Heartbeat: Update session time for existing visitor
      const updatedVisitor = await prisma.visitor.update({
        where: { id },
        data: {
          sessionTime: typeof sessionTime === 'number' ? sessionTime : 0,
        },
      });
      return NextResponse.json({ success: true, visitor: updatedVisitor });
    } else {
      // New visitor: Create visitor session record
      const newVisitor = await prisma.visitor.create({
        data: {
          mobile: mobile || "Desktop",
          location: location || "Unknown",
          browser: browser || "Unknown",
          sessionTime: typeof sessionTime === 'number' ? sessionTime : 0,
          phoneSpec: phoneSpec || "Unknown",
        },
      });
      return NextResponse.json({ success: true, visitorId: newVisitor.id });
    }
  } catch (error: any) {
    console.error("Error in visitor tracking API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const visitors = await prisma.visitor.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ success: true, visitors });
  } catch (error: any) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
