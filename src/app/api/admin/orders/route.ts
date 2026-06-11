import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "fallback_secret_for_development";
const key = new TextEncoder().encode(secretKey);

// Helper function to verify admin session
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const sessionCookie = req.cookies.get("admin_session")?.value;
  if (!sessionCookie) return false;
  try {
    await jwtVerify(sessionCookie, key);
    return true;
  } catch (err) {
    return false;
  }
}

// GET: Retrieve list of orders with filters & search
export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const dateStr = searchParams.get("date") || "";

    const where: any = {};

    if (status) {
      where.orderStatus = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        where.createdAt = {
          gte: date,
        };
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error: any) {
    console.error("Error in admin orders GET API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update order status
export async function PATCH(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "ID de encomenda ou estado em falta." }, { status: 400 });
    }

    // Validate status values
    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado de encomenda inválido." }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });

  } catch (error: any) {
    console.error("Error in admin orders PATCH API:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar estado da encomenda." },
      { status: 500 }
    );
  }
}
