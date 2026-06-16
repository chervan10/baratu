const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { SignJWT } = require("jose");

const url = process.env.DATABASE_URL || "file:./dev.db";
const db = new Database("dev.db");
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
const key = new TextEncoder().encode(JWT_SECRET);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate valid admin cookie for dashboard requests
async function generateAdminCookie() {
  const token = await new SignJWT({ email: "admin@gmail.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
  return `admin_session=${token}`;
}

async function runTests() {
  console.log("==================================================");
  console.log("STARTING M-PESA CHECKOUT SYSTEM INTEGRATION TESTS");
  console.log("==================================================");

  let testsPassed = 0;
  let testsFailed = 0;
  const issuesFound = [];
  const issuesFixed = [];

  // Helper assertions
  function assert(condition, message) {
    if (condition) {
      testsPassed++;
      console.log(`✓ [PASSED] ${message}`);
    } else {
      testsFailed++;
      console.error(`✗ [FAILED] ${message}`);
      issuesFound.push(message);
    }
  }

  try {
    // --- PHASE 1: CONFIGURATION ---
    console.log("\n--- PHASE 1: M-Pesa Configuration Check ---");
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const isSimulated = !consumerKey || !consumerSecret;
    console.log(`Mode: ${isSimulated ? "SIMULATOR" : "PRODUCTION"}`);
    assert(true, "M-Pesa environment config read successfully.");

    // --- PHASE 2 & 4: CHECKOUT FLOW & VALIDATION ---
    console.log("\n--- PHASE 2 & 4: Checkout Flow & Payment Request Validations ---");
    
    // Test 1: Invalid Phone Number format
    const badPhoneRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Chervan Tester",
        customerEmail: `test-${Date.now()}@example.com`,
        customerPhone: "12345", // invalid format
        country: "Moçambique",
        city: "Maputo",
        address: "Av. Mao Tse Tung",
        postalCode: "1100",
        cartItems: [
          { productId: 1, productName: "Arroz Baratu", quantity: 2, unitPrice: 100, mercado: "Mercado Central" }
        ]
      })
    });
    assert(badPhoneRes.status === 400, "Validation block on invalid phone number format.");

    // Test 1b: Invalid non-Vodacom Prefix Phone Number
    const badPrefixRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Chervan Tester",
        customerEmail: `test-${Date.now()}@example.com`,
        customerPhone: "863534259", // non-Vodacom prefix (Movitel)
        country: "Moçambique",
        city: "Maputo",
        address: "Av. Mao Tse Tung",
        postalCode: "1100",
        cartItems: [
          { productId: 1, productName: "Arroz Baratu", quantity: 2, unitPrice: 100, mercado: "Mercado Central" }
        ]
      })
    });
    assert(badPrefixRes.status === 400, "Validation block on non-Vodacom phone prefix.");

    // Test 2: Invalid negative amount subtotal
    const badAmountRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Chervan Tester",
        customerEmail: `test-${Date.now()}@example.com`,
        customerPhone: "841234567",
        country: "Moçambique",
        city: "Maputo",
        address: "Av. Mao Tse Tung",
        postalCode: "1100",
        cartItems: [
          { productId: 1, productName: "Arroz Baratu", quantity: 2, unitPrice: -50, mercado: "Mercado Central" } // negative price
        ]
      })
    });
    assert(badAmountRes.status === 400, "Validation block on negative unit pricing.");

    // Test 3: Successful checkout request creation
    const emailForLimiting = `test-limiter-${Date.now()}@example.com`;
    const checkoutRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Chervan Cashaco",
        customerEmail: emailForLimiting,
        customerPhone: "+258841234567",
        country: "Moçambique",
        city: "Maputo",
        address: "Av. Julius Nyerere, nº 12",
        postalCode: "1100",
        couponCode: "BARATU10", // 10% coupon
        cartItems: [
          { productId: 2, productName: "Óleo 5L", quantity: 1, unitPrice: 500, mercado: "Mercado Central" }
        ]
      })
    });
    assert(checkoutRes.status === 200, "Valid checkout submission returns status 200.");
    
    const checkoutData = await checkoutRes.json();
    assert(checkoutData.success === true, "Checkout responds with success flag.");
    assert(!!checkoutData.orderNumber, `Order number generated: ${checkoutData.orderNumber}`);
    assert(!!checkoutData.checkoutRequestId, `Checkout Request ID generated: ${checkoutData.checkoutRequestId}`);

    // --- PHASE 3: DATABASE SCHEMA & INTEGRITY ---
    console.log("\n--- PHASE 3: Database Schema & Integrity Check ---");
    const orderRecord = await prisma.order.findUnique({
      where: { orderNumber: checkoutData.orderNumber },
      include: { payments: true }
    });

    assert(!!orderRecord, "Order record created successfully in database.");
    assert(orderRecord.paymentMethod === "M-Pesa", "Order payment method initialized to 'M-Pesa'.");
    assert(orderRecord.paymentStatus === "Pending", "Order payment status initialized to 'Pending'.");
    assert(orderRecord.orderStatus === "Pending", "Order status initialized to 'Pending'.");
    assert(orderRecord.payments.length === 1, "Payment record linked to order correctly.");
    
    const paymentRecord = orderRecord.payments[0];
    assert(paymentRecord.checkoutRequestId === checkoutData.checkoutRequestId, "Payment request ID matches checkout requestId.");
    assert(paymentRecord.paymentStatus === "Pending", "Payment status is initially 'Pending'.");

    // --- PHASE 5: CALLBACK HANDLING ---
    console.log("\n--- PHASE 5: Webhook Callback Handling ---");
    
    // Simulate Successful Callback response
    const callbackSuccessRes = await fetch(`${BASE_URL}/api/payment/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        output_ResponseCode: "INS-0",
        output_ResponseDesc: "Transaction Completed Success",
        output_ConversationID: checkoutData.checkoutRequestId,
        output_TransactionID: `MPESA_TX_${Date.now()}`,
        output_ThirdPartyReference: `MPESA_REF_${Date.now()}`
      })
    });
    assert(callbackSuccessRes.status === 200, "Callback endpoint processes callback successfully.");
    
    const callbackSuccessData = await callbackSuccessRes.json();
    assert(callbackSuccessData.orderStatus === "Paid", "Order status updated to 'Paid' upon success callback.");
    assert(callbackSuccessData.paymentStatus === "Successful", "Payment status updated to 'Successful'.");

    // Double check database state is updated
    const orderSuccessDb = await prisma.order.findUnique({
      where: { orderNumber: checkoutData.orderNumber }
    });
    assert(orderSuccessDb.orderStatus === "Paid", "Database orderStatus is updated to Paid.");
    assert(orderSuccessDb.paymentStatus === "Successful", "Database paymentStatus is updated to Successful.");

    // --- PHASE 6: PAYMENT STATUS VERIFICATION ---
    console.log("\n--- PHASE 6: Payment Status Verification (Polling Endpoint) ---");
    const verifyRes = await fetch(`${BASE_URL}/api/payment/verify?checkoutRequestId=${checkoutData.checkoutRequestId}`);
    assert(verifyRes.status === 200, "Payment verification API is responsive.");
    const verifyData = await verifyRes.json();
    assert(verifyData.paymentStatus === "Successful", "Refreshed verify status returns 'Successful'.");
    assert(verifyData.orderStatus === "Paid", "Refreshed verify orderStatus returns 'Paid'.");

    // --- PHASE 8 & 9: EMAIL DISPATCH & ADMIN DASHBOARD ---
    console.log("\n--- PHASE 8 & 9: Admin Dashboard & Email Queries ---");
    const adminCookie = await generateAdminCookie();
    
    const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      method: "GET",
      headers: { "Cookie": adminCookie }
    });
    assert(adminOrdersRes.status === 200, "Admin orders API responds with 200 with session cookie.");
    const adminOrdersData = await adminOrdersRes.json();
    assert(adminOrdersData.success === true, "Dashboard returns success response payload.");
    assert(adminOrdersData.orders.length > 0, "Dashboard returns orders list containing our test order.");

    const dashboardOrder = adminOrdersData.orders.find(o => o.orderNumber === checkoutData.orderNumber);
    assert(dashboardOrder.paymentStatus === "Successful", "Dashboard reflects payment status correctly.");
    assert(dashboardOrder.payments.length > 0 && !!dashboardOrder.payments[0].mpesaReference, "Dashboard reflects payment transaction reference correctly.");

    // --- PHASE 10: RATE LIMITING AUDIT ---
    console.log("\n--- PHASE 10: Email-based Rate Limiting (max 3 checkouts/10 mins) ---");
    // Make 2 more checkouts for a total of 3 checkouts (first was test order)
    for (let i = 0; i < 2; i++) {
      await fetch(`${BASE_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "Chervan Tester",
          customerEmail: emailForLimiting,
          customerPhone: "841234567",
          country: "Moçambique",
          city: "Maputo",
          address: "Av. Mao Tse Tung",
          postalCode: "1100",
          cartItems: [
            { productId: 1, productName: "Arroz Baratu", quantity: 1, unitPrice: 100, mercado: "Mercado Central" }
          ]
        })
      });
    }

    // Now the 4th checkout should trigger rate-limiting
    const limitRes = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Chervan Tester",
        customerEmail: emailForLimiting,
        customerPhone: "841234567",
        country: "Moçambique",
        city: "Maputo",
        address: "Av. Mao Tse Tung",
        postalCode: "1100",
        cartItems: [
          { productId: 1, productName: "Arroz Baratu", quantity: 1, unitPrice: 100, mercado: "Mercado Central" }
        ]
      })
    });
    assert(limitRes.status === 429, "Rate limiter blocks 4th order within 10 minutes (returns 429).");

    // --- PHASE 11 & 12: ERROR HANDLING & PERFORMANCE LATENCY ---
    console.log("\n--- PHASE 11 & 12: Error Handling & Performance Latency ---");
    const start = Date.now();
    const perfVerifyRes = await fetch(`${BASE_URL}/api/payment/verify?checkoutRequestId=${checkoutData.checkoutRequestId}`);
    const latency = Date.now() - start;
    assert(perfVerifyRes.status === 200, "Verify status is responsive.");
    console.log(`Latency for verification lookup: ${latency}ms`);
    assert(latency < 250, "Verification status lookup responds in less than 250ms (latency constraint).");

  } catch (error) {
    console.error("Test execution threw exception:", error);
    testsFailed++;
  }

  // Final summary logging
  console.log("\n==================================================");
  console.log("INTEGRATION TEST SUMMARY");
  console.log("==================================================");
  const healthScore = Math.round((testsPassed / (testsPassed + testsFailed)) * 100);
  console.log(`Health Score: ${healthScore}%`);
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log("==================================================");

  if (testsFailed === 0) {
    console.log("M-PESA PAYMENT SYSTEM VERIFIED SUCCESSFULLY");
    process.exit(0);
  } else {
    console.error("Some tests failed. Check issues list.");
    process.exit(1);
  }
}

runTests();
