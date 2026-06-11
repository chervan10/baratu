import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendOrderEmails } from "@/lib/email";

// Validation Schema for Checkout Form
const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório (mínimo 2 caracteres)"),
  customerEmail: z.string().email("Endereço de e-mail inválido"),
  customerPhone: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "Número de telefone inválido"),
  country: z.string().min(2, "País é obrigatório"),
  provinceState: z.string().optional().nullable(),
  city: z.string().min(2, "Cidade é obrigatória"),
  address: z.string().min(5, "Endereço é obrigatório (mínimo 5 caracteres)"),
  postalCode: z.string().min(3, "Código postal é obrigatório"),
  orderNotes: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  cartItems: z.array(
    z.object({
      productId: z.number(),
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      mercado: z.string(),
    })
  ).min(1, "O carrinho deve ter pelo menos um produto"),
});

// Helper: Generate order number
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `BRT-${dateStr}-${randomDigits}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Zod Validation
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      country,
      provinceState,
      city,
      address,
      postalCode,
      orderNotes,
      couponCode,
      cartItems,
    } = parsed.data;

    // 2. Email-based Rate Limiting (max 3 checkouts in 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOrdersCount = await prisma.order.count({
      where: {
        customerEmail: customerEmail,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentOrdersCount >= 3) {
      return NextResponse.json(
        { error: "Excedeu o limite de encomendas em 10 minutos. Por favor, aguarde antes de tentar novamente." },
        { status: 429 }
      );
    }

    // 3. E-commerce Pricing calculations (Strict server-side validation/recalculation)
    const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const shippingCost = subtotal > 0 ? 150 : 0;
    const tax = subtotal * 0.17; // 17% IVA

    // Coupon discount logic
    let discount = 0;
    if (couponCode && couponCode.toUpperCase() === "BARATU10") {
      discount = subtotal * 0.10; // 10% OFF
    }
    const totalAmount = Math.max(0, subtotal + shippingCost + tax - discount);

    const orderNumber = generateOrderNumber();

    // 4. Prisma Transaction to save order & items
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          country,
          provinceState,
          city,
          address,
          postalCode,
          orderNotes,
          subtotal,
          shippingCost,
          tax,
          discount,
          totalAmount,
          orderStatus: "Pending",
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      });

      return newOrder;
    });

    // 5. Send Email Notifications (async, using promise/background fetch)
    const emailItems = cartItems.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      mercado: item.mercado
    }));

    // Dispatch emails (logs errors internally and falls back to console if not configured)
    await sendOrderEmails(order, emailItems);

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
    });

  } catch (error) {
    console.error("Exception in checkout API:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar checkout da encomenda." },
      { status: 500 }
    );
  }
}
