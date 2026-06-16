import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { initiateMpesaPayment } from "@/lib/mpesa";

// Validation Schema for Checkout Form
const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório (mínimo 2 caracteres)"),
  customerEmail: z.string().email("Endereço de e-mail inválido"),
  customerPhone: z.string()
    .refine((val) => {
      const clean = val.replace(/[\s-]/g, "");
      return /^(\+?258)?(84|85)\d{7}$/.test(clean);
    }, {
      message: "Apenas números M-Pesa da Vodacom (prefixo 84 ou 85) são permitidos."
    })
    .transform((val) => {
      const clean = val.replace(/[\s-]/g, "");
      const match = clean.match(/^(\+?258)?((84|85)\d{7})$/);
      if (match) {
        return `+258${match[2]}`;
      }
      return val;
    }),
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
    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "O valor total da compra deve ser superior a zero." },
        { status: 400 }
      );
    }
    const shippingCost = subtotal > 0 ? 150 : 0;
    const tax = subtotal * 0.17; // 17% IVA

    // Coupon discount logic
    let discount = 0;
    if (couponCode && couponCode.toUpperCase() === "BARATU10") {
      discount = subtotal * 0.10; // 10% OFF
    }
    const totalAmount = Math.max(0, subtotal + shippingCost + tax - discount);

    // 4. M-Pesa Payment Request pre-validation
    const cleanPhone = customerPhone.replace(/[\s+-]/g, "");
    if (!/^(258)?(84|85)\d{7}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Apenas números M-Pesa da Vodacom (prefixo 84 ou 85) são permitidos." },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    // 5. Prisma Transaction to save order & items
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
          paymentMethod: "M-Pesa",
          paymentStatus: "Pending",
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

    // 6. Initiate M-Pesa Payment Flow
    const mpesaResult = await initiateMpesaPayment(order.id, totalAmount, customerPhone);

    if (!mpesaResult.success) {
      // Clean up the order in case payment initiation strictly fails on core API validation
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "Failed",
          orderStatus: "Cancelled",
        },
      });

      return NextResponse.json(
        { error: mpesaResult.responseDescription || "Falha ao iniciar pagamento M-Pesa." },
        { status: 400 }
      );
    }

    // 7. Save Payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        checkoutRequestId: mpesaResult.checkoutRequestId,
        transactionId: mpesaResult.transactionId || null,
        mpesaReference: mpesaResult.mpesaReference || null,
        amount: totalAmount,
        phoneNumber: customerPhone,
        paymentStatus: "Pending",
        responseCode: mpesaResult.responseCode,
        responseDescription: mpesaResult.responseDescription,
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      checkoutRequestId: mpesaResult.checkoutRequestId,
    });

  } catch (error) {
    console.error("Exception in checkout API:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar checkout da encomenda." },
      { status: 500 }
    );
  }
}
