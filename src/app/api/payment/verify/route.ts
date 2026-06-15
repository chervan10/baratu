import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMpesaTransaction } from "@/lib/mpesa";
import { sendOrderEmails } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "Parâmetro checkoutRequestId em falta." }, { status: 400 });
    }

    // 1. Check if the payment exists in our database
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Transação de pagamento não encontrada." }, { status: 404 });
    }

    // 2. Query M-Pesa API (or simulator fallback) for status
    const verification = await verifyMpesaTransaction(checkoutRequestId);

    // 3. Update database based on current payment status
    if (verification.success) {
      const isSuccess = verification.paymentStatus === "Successful";
      const isFailed = verification.paymentStatus === "Failed";

      // If status changed to Successful/Failed, update order and payment
      if (isSuccess && payment.paymentStatus !== "Successful") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "Successful",
            responseCode: verification.responseCode,
            responseDescription: verification.responseDescription,
          },
        });

        const order = await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "Successful",
            orderStatus: "Paid",
          },
          include: {
            items: true,
          },
        });

        // Send confirmation emails
        try {
          const emailItems = order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            mercado: "M-Pesa Checkout",
          }));
          await sendOrderEmails(order, emailItems);
          console.log(`Sent order success emails via verify API for order: ${order.orderNumber}`);
        } catch (emailErr) {
          console.error("Failed to send emails during verification:", emailErr);
        }
      } else if (isFailed && payment.paymentStatus !== "Failed") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "Failed",
            responseCode: verification.responseCode,
            responseDescription: verification.responseDescription,
          },
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "Failed",
            orderStatus: "Pending",
          },
        });
      }
    }

    // Fetch refreshed status to return
    const refreshedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        order: true,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: refreshedPayment?.checkoutRequestId,
      paymentStatus: refreshedPayment?.paymentStatus,
      orderStatus: refreshedPayment?.order?.orderStatus,
      amount: refreshedPayment?.amount,
      orderNumber: refreshedPayment?.order?.orderNumber,
    });

  } catch (error) {
    console.error("Exception in verification handler:", error);
    return NextResponse.json({ error: "Erro ao verificar estado do pagamento." }, { status: 500 });
  }
}
