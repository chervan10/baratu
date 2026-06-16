import prisma from "./prisma";

// M-Pesa Environment variables
const apiBaseUrl = process.env.MPESA_API_BASE_URL;
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const apiUser = process.env.MPESA_API_USER;
const apiPassword = process.env.MPESA_API_PASSWORD;
const callbackUrl = process.env.MPESA_CALLBACK_URL || "http://localhost:3000/api/payment/callback";

// Flag to determine if real API or Simulator should run
const isSimulator = !apiBaseUrl || !consumerKey || !consumerSecret;

if (isSimulator) {
  console.warn("WARNING: M-Pesa credentials not configured. M-Pesa API will run in sandbox SIMULATOR MODE.");
}

interface MpesaInitiateResponse {
  success: boolean;
  checkoutRequestId: string;
  transactionId?: string;
  mpesaReference?: string;
  responseCode: string;
  responseDescription: string;
}

interface MpesaVerifyResponse {
  success: boolean;
  paymentStatus: "Successful" | "Failed" | "Pending";
  responseCode: string;
  responseDescription: string;
}

/**
 * Retrieves access token from M-Pesa IPG.
 */
export async function getMpesaAccessToken(): Promise<string | null> {
  if (isSimulator) {
    return "mock_access_token_123456";
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const response = await fetch(`${apiBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error("M-Pesa Auth failed:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error("Exception fetching M-Pesa Access Token:", error);
    return null;
  }
}

/**
 * Initiates an M-Pesa payment request (e.g. C2B/STK Push).
 */
export async function initiateMpesaPayment(
  orderId: string,
  amount: number,
  phoneNumber: string
): Promise<MpesaInitiateResponse> {
  // 1. Validation checks
  if (amount <= 0) {
    return {
      success: false,
      checkoutRequestId: "",
      responseCode: "400",
      responseDescription: "Invalid amount. Must be greater than 0.",
    };
  }

  // Format phone number (should be standard Moz number format: +25884xxxxxxx or +25885xxxxxxx)
  const cleanPhone = phoneNumber.replace(/[\s+-]/g, "");
  if (!/^(258)?(84|85)\d{7}$/.test(cleanPhone)) {
    return {
      success: false,
      checkoutRequestId: "",
      responseCode: "400",
      responseDescription: "Apenas números M-Pesa da Vodacom (prefixo 84 ou 85) são permitidos.",
    };
  }

  // 2. Simulator Mode Fallback
  if (isSimulator) {
    console.log("==========================================");
    console.log(`[M-PESA SIMULATOR - INITIATING PAYMENT]`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Amount: ${amount} MT`);
    console.log(`Phone: ${phoneNumber} (${cleanPhone})`);
    console.log(`Callback URL: ${callbackUrl}`);
    console.log("==========================================");

    const mockCheckoutId = `mock_checkout_${Math.random().toString(36).substr(2, 9)}`;
    const mockMpesaRef = `MOCK_MPESA_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      success: true,
      checkoutRequestId: mockCheckoutId,
      mpesaReference: mockMpesaRef,
      transactionId: `mock_tx_${Date.now()}`,
      responseCode: "INS-0",
      responseDescription: "Request processed successfully.",
    };
  }

  // 3. Real M-Pesa Integration
  try {
    const accessToken = await getMpesaAccessToken();
    if (!accessToken) {
      return {
        success: false,
        checkoutRequestId: "",
        responseCode: "500",
        responseDescription: "Failed to authenticate with M-Pesa API.",
      };
    }

    // Example payload for Vodacom Moz Lipa Na M-Pesa/C2B Single Stage Transaction API
    const payload = {
      input_TransactionReference: orderId.slice(0, 10),
      input_CustomerMSISDN: cleanPhone.startsWith("258") ? cleanPhone : `258${cleanPhone}`,
      input_Amount: amount.toFixed(2),
      input_ThirdPartyReference: orderId,
      input_ServiceProviderCode: apiUser || "171717",
      input_Password: apiPassword || "password",
      input_CallbackURL: callbackUrl,
    };

    const response = await fetch(`${apiBaseUrl}/ipg/v1x/v1/c2bPayment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("M-Pesa payment initiation API error:", data);
      return {
        success: false,
        checkoutRequestId: "",
        responseCode: data.output_ResponseCode || "500",
        responseDescription: data.output_ResponseDesc || "Payment initiation failed.",
      };
    }

    return {
      success: data.output_ResponseCode === "INS-0",
      checkoutRequestId: data.output_ConversationID || data.output_TransactionID || "",
      mpesaReference: data.output_ThirdPartyReference || "",
      transactionId: data.output_TransactionID || "",
      responseCode: data.output_ResponseCode,
      responseDescription: data.output_ResponseDesc || "Request processed successfully.",
    };
  } catch (error) {
    console.error("Exception initiating M-Pesa payment:", error);
    return {
      success: false,
      checkoutRequestId: "",
      responseCode: "500",
      responseDescription: "Internal server error during payment request.",
    };
  }
}

/**
 * Verifies the status of a transaction with the M-Pesa API.
 */
export async function verifyMpesaTransaction(
  checkoutRequestId: string
): Promise<MpesaVerifyResponse> {
  if (isSimulator || checkoutRequestId.startsWith("mock_")) {
    // Check if we already marked it successful in database
    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
    });

    if (payment) {
      return {
        success: payment.paymentStatus === "Successful",
        paymentStatus: payment.paymentStatus as any,
        responseCode: payment.responseCode || "INS-0",
        responseDescription: payment.responseDescription || "Mock status verification.",
      };
    }

    return {
      success: true,
      paymentStatus: "Successful",
      responseCode: "INS-0",
      responseDescription: "Transaction completed successfully (mock verification).",
    };
  }

  try {
    const accessToken = await getMpesaAccessToken();
    if (!accessToken) {
      return {
        success: false,
        paymentStatus: "Pending",
        responseCode: "500",
        responseDescription: "Failed to authenticate with M-Pesa API.",
      };
    }

    const response = await fetch(`${apiBaseUrl}/ipg/v1x/v1/queryTransactionStatus/?conversationID=${checkoutRequestId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("M-Pesa transaction query error:", data);
      return {
        success: false,
        paymentStatus: "Pending",
        responseCode: data.output_ResponseCode || "500",
        responseDescription: data.output_ResponseDesc || "Status query failed.",
      };
    }

    let paymentStatus: "Successful" | "Failed" | "Pending" = "Pending";
    if (data.output_ResponseCode === "INS-0") {
      paymentStatus = "Successful";
    } else if (data.output_ResponseCode === "INS-1" || data.output_ResponseCode?.startsWith("INS-E")) {
      paymentStatus = "Failed";
    }

    return {
      success: true,
      paymentStatus,
      responseCode: data.output_ResponseCode,
      responseDescription: data.output_ResponseDesc || "Status queried successfully.",
    };
  } catch (error) {
    console.error("Exception querying M-Pesa transaction status:", error);
    return {
      success: false,
      paymentStatus: "Pending",
      responseCode: "500",
      responseDescription: "Internal server error querying status.",
    };
  }
}
