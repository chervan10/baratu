import crypto from "crypto";
import prisma from "./prisma";

// M-Pesa Environment variables
const mpesaPublicKey = process.env.MPESA_PUBLIC_KEY;
const mpesaApiHost = process.env.MPESA_API_HOST;
const mpesaApiKey = process.env.MPESA_API_KEY;
const mpesaOrigin = process.env.MPESA_ORIGIN || "developer.mpesa.vm.co.mz";
const mpesaServiceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE || "171717";
const callbackUrl = process.env.MPESA_CALLBACK_URL || "http://localhost:3000/api/payment/callback";

// Flag to determine if real API or Simulator should run
const isSimulator = process.env.MPESA_SIMULATOR === "true" || !mpesaPublicKey || !mpesaApiHost || !mpesaApiKey;

if (isSimulator) {
  console.warn("WARNING: M-Pesa credentials not configured or MPESA_SIMULATOR is set. M-Pesa API will run in sandbox SIMULATOR MODE.");
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
 * Constructs the M-Pesa base URL dynamically.
 * C2B uses port 18352 in Sandbox, Status Query uses port 18353.
 */
function getMpesaBaseUrl(service: "c2b" | "query"): string {
  const host = mpesaApiHost || "api.sandbox.vm.co.mz";
  if (host.includes("sandbox")) {
    const port = service === "c2b" ? "18352" : "18353";
    return `https://${host}:${port}`;
  }
  return `https://${host}`;
}

/**
 * Retrieves access token from M-Pesa IPG.
 */
export async function getMpesaAccessToken(): Promise<string | null> {
  if (isSimulator) {
    return "mock_access_token_123456";
  }

  if (!mpesaPublicKey || !mpesaApiKey) {
    console.error("M-Pesa public key or API key not configured.");
    return null;
  }

  try {
    let pemKey = mpesaPublicKey.trim();
    if (!pemKey.includes("-----BEGIN PUBLIC KEY-----")) {
      const cleanKey = pemKey.replace(/[\s\r\n]+/g, "");
      const chunks = cleanKey.match(/.{1,64}/g) || [];
      pemKey = `-----BEGIN PUBLIC KEY-----\n${chunks.join("\n")}\n-----END PUBLIC KEY-----`;
    }

    const buffer = Buffer.from(mpesaApiKey);
    const encrypted = crypto.publicEncrypt(
      {
        key: pemKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );

    return encrypted.toString("base64");
  } catch (error) {
    console.error("Exception generating M-Pesa Access Token:", error);
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    const orderNumber = order ? order.orderNumber : orderId;
    const cleanOrderNumber = orderNumber.replace(/[\s-]/g, "");

    const payload = {
      input_TransactionReference: cleanOrderNumber.slice(0, 10),
      input_CustomerMSISDN: cleanPhone.startsWith("258") ? cleanPhone : `258${cleanPhone}`,
      input_Amount: amount.toFixed(2),
      input_ThirdPartyReference: cleanOrderNumber,
      input_ServiceProviderCode: mpesaServiceProviderCode,
    };

    const baseUrl = getMpesaBaseUrl("c2b");
    const response = await fetch(`${baseUrl}/ipg/v1x/c2bPayment/singleStage/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Origin": mpesaOrigin,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("M-Pesa API C2B response is not valid JSON. Status:", response.status, "Raw response:", text);
      return {
        success: false,
        checkoutRequestId: "",
        responseCode: response.status.toString(),
        responseDescription: `M-Pesa server returned status ${response.status}: ${response.statusText}`,
      };
    }

    if (!response.ok) {
      console.error("M-Pesa payment initiation API error:", data);
      return {
        success: false,
        checkoutRequestId: "",
        responseCode: data.output_ResponseCode || response.status.toString(),
        responseDescription: data.output_ResponseDesc || `Payment initiation failed with status ${response.status}.`,
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

    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId },
      include: { order: true },
    });
    const rawRef = payment?.order?.orderNumber || payment?.orderId || "N/A";
    const thirdPartyReference = rawRef.replace(/[\s-]/g, "");

    const baseUrl = getMpesaBaseUrl("query");
    const url = new URL(`${baseUrl}/ipg/v1x/queryTransactionStatus/`);
    url.searchParams.set("input_QueryReference", checkoutRequestId);
    url.searchParams.set("input_ServiceProviderCode", mpesaServiceProviderCode);
    url.searchParams.set("input_ThirdPartyReference", thirdPartyReference);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Origin": mpesaOrigin,
      },
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("M-Pesa transaction query response is not valid JSON. Status:", response.status, "Raw response:", text);
      return {
        success: false,
        paymentStatus: "Pending",
        responseCode: response.status.toString(),
        responseDescription: `M-Pesa server status ${response.status}: ${response.statusText}`,
      };
    }

    if (!response.ok) {
      console.error("M-Pesa transaction query error:", data);
      return {
        success: false,
        paymentStatus: "Pending",
        responseCode: data.output_ResponseCode || response.status.toString(),
        responseDescription: data.output_ResponseDesc || `Status query failed with status ${response.status}.`,
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
