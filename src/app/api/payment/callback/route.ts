import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received M-Pesa payment callback:", JSON.stringify(body));

    // Support both Vodacom format and standard format for versatility
    const responseCode = body.output_ResponseCode || body.responseCode || "INS-0";
    const checkoutRequestId = body.output_ConversationID || body.checkoutRequestId;
    const transactionId = body.output_TransactionID || body.transactionId || `tx_${Date.now()}`;
    const mpesaReference = body.output_ThirdPartyReference || body.mpesaReference || `REF_${Date.now()}`;
    const responseDescription = body.output_ResponseDesc || body.responseDescription || "Callback notification";

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "Missing checkoutRequestId in callback payload." }, { status: 400 });
    }

    const isSuccess = responseCode === "INS-0";

    // 1. Find the payment transaction
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
    });

    if (!payment) {
      console.error(`Payment transaction not found for checkoutRequestId: ${checkoutRequestId}`);
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    // 2. Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: isSuccess ? "Successful" : "Failed",
        transactionId,
        mpesaReference,
        responseCode,
        responseDescription,
      },
    });

    // 3. Update order status
    // Success scenario: Order Status -> Paid, Payment Status -> Successful
    // Failure scenario: Order Status -> Pending, Payment Status -> Failed
    const updatedOrder = await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: isSuccess ? "Successful" : "Failed",
        orderStatus: isSuccess ? "Paid" : "Pending",
      },
      include: {
        items: true,
      },
    });

    // 4. Send Confirmation Emails only on success and only if it hasn't been sent yet
    if (isSuccess && orderHasNotBeenNotified(payment.paymentStatus)) {
      try {
        const emailItems = updatedOrder.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          mercado: "M-Pesa Checkout", // standard fallback
        }));

        await sendOrderEmails(updatedOrder, emailItems);
        console.log(`Sent order success emails for order: ${updatedOrder.orderNumber}`);
      } catch (emailErr) {
        console.error("Failed to send confirmation emails from callback:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully.",
      orderStatus: updatedOrder.orderStatus,
      paymentStatus: updatedPayment.paymentStatus,
    });

  } catch (error) {
    console.error("Exception in callback handler:", error);
    return NextResponse.json({ error: "Internal server error processing callback." }, { status: 500 });
  }
}

function orderHasNotBeenNotified(previousStatus: string): boolean {
  return previousStatus !== "Successful";
}
