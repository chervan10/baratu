const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
const storeOwnerEmail = process.env.STORE_OWNER_EMAIL || "chervan.cachaco@gmail.com"; // default store owner email

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  provinceState?: string | null;
  city: string;
  address: string;
  postalCode: string;
  orderNotes?: string | null;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

interface OrderItemEmailData {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mercado: string;
}

/**
 * Builds HTML table rows for the ordered products.
 */
function buildItemsTableRows(items: OrderItemEmailData[]): string {
  return items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: left;">
        <span style="font-weight: bold; color: #2d3748; display: block;">${item.productName}</span>
        <span style="font-size: 11px; color: #718096; text-transform: uppercase;">Mercado: ${item.mercado}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: center; color: #4a5568;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; color: #4a5568; font-family: monospace;">
        ${item.unitPrice.toFixed(0)} MT
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">
        ${item.totalPrice.toFixed(0)} MT
      </td>
    </tr>
  `).join("");
}

/**
 * Responsive CSS and Wrapper Template.
 */
function wrapEmailHtml(title: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7fafc; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              <!-- Header -->
              <tr>
                <td style="background-color: #166534; padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.05em; font-style: italic; text-transform: uppercase;">
                    BARATU
                  </h1>
                  <p style="color: #fef08a; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">
                    Preços de Maputo
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  ${bodyContent}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #1a202c; padding: 24px; text-align: center; color: #a0aec0; font-size: 11px;">
                  <p style="margin: 0; font-weight: bold; color: #ffffff;">BARATU Moz</p>
                  <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Baratu. Todos os direitos reservados.</p>
                  <p style="margin: 5px 0 0 0; color: #718096;">Preços e disponibilidades sujeitos a variação nos mercados locais.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Builds the Customer Email HTML content.
 */
export function buildCustomerEmailHtml(order: OrderEmailData, items: OrderItemEmailData[]): string {
  const itemsTable = buildItemsTableRows(items);
  const discountRow = order.discount > 0 
    ? `<tr>
        <td colspan="3" style="padding: 8px 12px; text-align: right; color: #2f855a; font-weight: bold;">Desconto (Promo):</td>
        <td style="padding: 8px 12px; text-align: right; color: #2f855a; font-weight: bold; font-family: monospace;">-${order.discount.toFixed(0)} MT</td>
       </tr>`
    : "";

  const content = `
    <h2 style="color: #1a202c; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 15px;">
      Olá ${order.customerName},
    </h2>
    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
      Agradecemos a sua preferência! Confirmamos que recebemos a sua encomenda com sucesso e já estamos a processá-la.
    </p>

    <!-- Order Info Card -->
    <div style="background-color: #f7fafc; border: 1px solid #edf2f7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #4a5568;">
        <tr>
          <td style="padding-bottom: 8px; font-weight: bold; color: #718096; width: 140px;">Número de Encomenda:</td>
          <td style="padding-bottom: 8px; font-weight: bold; color: #1a202c; font-family: monospace; font-size: 14px;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; font-weight: bold; color: #718096;">Data do Pedido:</td>
          <td style="padding-bottom: 8px; font-weight: bold; color: #1a202c;">${new Date().toLocaleDateString("pt-MZ")} ${new Date().toLocaleTimeString("pt-MZ", {hour: '2-digit', minute:'2-digit'})}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #718096; vertical-align: top;">Morada de Entrega:</td>
          <td style="font-weight: bold; color: #1a202c;">
            ${order.address}, ${order.city}<br>
            ${order.provinceState ? order.provinceState + ", " : ""}${order.country}<br>
            Cód. Postal: ${order.postalCode}
          </td>
        </tr>
      </table>
    </div>

    <h3 style="color: #2d3748; font-size: 16px; font-weight: 800; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; margin-bottom: 15px;">
      Produtos Encomendados
    </h3>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #edf2f7; color: #718096; font-weight: bold;">
          <th style="padding: 12px; text-align: left;">Produto</th>
          <th style="padding: 12px; text-align: center; width: 50px;">Qtd</th>
          <th style="padding: 12px; text-align: right; width: 80px;">Unitário</th>
          <th style="padding: 12px; text-align: right; width: 90px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTable}
        <!-- Calculations -->
        <tr>
          <td colspan="3" style="padding: 15px 12px 8px 12px; text-align: right; color: #718096; font-weight: bold;">Subtotal:</td>
          <td style="padding: 15px 12px 8px 12px; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">${order.subtotal.toFixed(0)} MT</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: #718096; font-weight: bold;">Entrega (Transporte):</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">${order.shippingCost.toFixed(0)} MT</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: #718096; font-weight: bold;">IVA (17%):</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">${order.tax.toFixed(0)} MT</td>
        </tr>
        ${discountRow}
        <tr style="border-top: 2px solid #edf2f7;">
          <td colspan="3" style="padding: 15px 12px; text-align: right; color: #1a202c; font-size: 16px; font-weight: 900;">Total Pago:</td>
          <td style="padding: 15px 12px; text-align: right; font-size: 18px; font-weight: 900; color: #166534; font-family: monospace;">${order.totalAmount.toFixed(0)} MT</td>
        </tr>
      </tbody>
    </table>

    ${order.orderNotes ? `
    <div style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
      <span style="font-weight: bold; color: #dd6b20; font-size: 11px; block; uppercase; tracking-wider;">Notas de Encomenda:</span>
      <p style="color: #7b341e; margin: 5px 0 0 0; font-size: 13px; line-height: 1.5;">${order.orderNotes}</p>
    </div>` : ""}

    <div style="text-align: center; margin-top: 35px; border-top: 1px solid #edf2f7; padding-top: 25px;">
      <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0;">
        Faremos o envio do seu pedido nos próximos dias. Caso tenha qualquer dúvida, responda diretamente a este e-mail ou envie uma mensagem na página de contactos.
      </p>
      <p style="color: #2d3748; font-size: 14px; font-weight: bold; margin-top: 15px;">
        Obrigado por comprar na Baratu!
      </p>
    </div>
  `;
  
  return wrapEmailHtml("Confirmação de Encomenda - Baratu", content);
}

/**
 * Builds the Store Owner Notification Email HTML content.
 */
export function buildOwnerEmailHtml(order: OrderEmailData, items: OrderItemEmailData[]): string {
  const itemsTable = buildItemsTableRows(items);
  const discountRow = order.discount > 0 
    ? `<tr>
        <td colspan="3" style="padding: 8px 12px; text-align: right; color: #2f855a; font-weight: bold;">Desconto Aplicado:</td>
        <td style="padding: 8px 12px; text-align: right; color: #2f855a; font-weight: bold; font-family: monospace;">-${order.discount.toFixed(0)} MT</td>
       </tr>`
    : "";

  const content = `
    <h2 style="color: #742a2a; font-size: 20px; font-weight: 900; margin-top: 0; margin-bottom: 15px;">
      Nova Encomenda Recebida!
    </h2>
    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
      Uma nova compra online foi submetida e registada na base de dados do Baratu. Revê abaixo as informações do cliente e o sumário dos produtos para processamento.
    </p>

    <!-- Customer Details Card -->
    <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <h4 style="color: #9b2c2c; margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; border-b: 1px solid #feb2b2; padding-bottom: 5px;">
        Dados do Cliente e Envio
      </h4>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #2d3748;">
        <tr>
          <td style="padding-bottom: 6px; font-weight: bold; color: #718096; width: 120px;">Nome Cliente:</td>
          <td style="padding-bottom: 6px; font-weight: bold; color: #1a202c;">${order.customerName}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 6px; font-weight: bold; color: #718096;">E-mail:</td>
          <td style="padding-bottom: 6px; font-weight: bold; color: #166534;"><a href="mailto:${order.customerEmail}" style="color: #166534; text-decoration: underline;">${order.customerEmail}</a></td>
        </tr>
        <tr>
          <td style="padding-bottom: 6px; font-weight: bold; color: #718096;">Telefone:</td>
          <td style="padding-bottom: 6px; font-weight: bold; color: #1a202c; font-family: monospace;">${order.customerPhone}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #718096; vertical-align: top;">Morada Envio:</td>
          <td style="font-weight: bold; color: #1a202c;">
            ${order.address}, ${order.city}<br>
            ${order.provinceState ? order.provinceState + ", " : ""}${order.country}<br>
            Cód. Postal: ${order.postalCode}
          </td>
        </tr>
      </table>
    </div>

    <!-- Order Header Info -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #4a5568; margin-bottom: 20px;">
      <tr>
        <td style="width: 150px; font-weight: bold; color: #718096;">Número de Encomenda:</td>
        <td style="font-weight: bold; color: #1a202c; font-family: monospace;">${order.orderNumber}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; color: #718096;">Data do Pedido:</td>
        <td style="font-weight: bold; color: #1a202c;">${new Date().toLocaleDateString("pt-MZ")} ${new Date().toLocaleTimeString("pt-MZ", {hour: '2-digit', minute:'2-digit'})}</td>
      </tr>
    </table>

    <h3 style="color: #2d3748; font-size: 15px; font-weight: 800; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; margin-bottom: 15px;">
      Lista de Artigos
    </h3>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #edf2f7; color: #718096; font-weight: bold;">
          <th style="padding: 12px; text-align: left;">Artigo</th>
          <th style="padding: 12px; text-align: center; width: 50px;">Qtd</th>
          <th style="padding: 12px; text-align: right; width: 80px;">Preço un.</th>
          <th style="padding: 12px; text-align: right; width: 90px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTable}
        <!-- Calculations -->
        <tr>
          <td colspan="3" style="padding: 15px 12px 8px 12px; text-align: right; color: #718096; font-weight: bold;">Subtotal Encomenda:</td>
          <td style="padding: 15px 12px 8px 12px; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">${order.subtotal.toFixed(0)} MT</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: #718096; font-weight: bold;">Porte cobrado:</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">${order.shippingCost.toFixed(0)} MT</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px 12px; text-align: right; color: #718096; font-weight: bold;">IVA (17%):</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #2d3748; font-family: monospace;">${order.tax.toFixed(0)} MT</td>
        </tr>
        ${discountRow}
        <tr style="border-top: 2px solid #edf2f7;">
          <td colspan="3" style="padding: 15px 12px; text-align: right; color: #1a202c; font-size: 15px; font-weight: 900;">Total Encomenda:</td>
          <td style="padding: 15px 12px; text-align: right; font-size: 17px; font-weight: 900; color: #9b2c2c; font-family: monospace;">${order.totalAmount.toFixed(0)} MT</td>
        </tr>
      </tbody>
    </table>

    ${order.orderNotes ? `
    <div style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
      <span style="font-weight: bold; color: #dd6b20; font-size: 11px; block; uppercase; tracking-wider;">Notas de Encomenda do Cliente:</span>
      <p style="color: #7b341e; margin: 5px 0 0 0; font-size: 13px; line-height: 1.5;">${order.orderNotes}</p>
    </div>` : ""}

    <div style="text-align: center; margin-top: 35px; border-top: 1px solid #edf2f7; padding-top: 25px;">
      <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0;">
        Pode aceder ao Painel Administrativo do Baratu para alterar o estado desta encomenda para <strong>"Confirmada"</strong>, <strong>"Em processamento"</strong>, ou <strong>"Enviada"</strong>.
      </p>
      <div style="margin-top: 15px;">
        <a href="https://baratu.mz/admin" style="background-color: #1a202c; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: bold; text-decoration: none; display: inline-block;">Aceder ao Painel Admin</a>
      </div>
    </div>
  `;

  return wrapEmailHtml("Nova Encomenda Recebida - Baratu", content);
}

/**
 * Dispatcher function to send emails.
 * Gracefully falls back to console logging in development.
 */
export async function sendOrderEmails(order: OrderEmailData, items: OrderItemEmailData[]): Promise<boolean> {
  const customerSubject = `Confirmação de Encomenda #${order.orderNumber} - Baratu`;
  const customerHtml = buildCustomerEmailHtml(order, items);

  const ownerSubject = `Nova Encomenda Recebida #${order.orderNumber} - Baratu (${order.customerName})`;
  const ownerHtml = buildOwnerEmailHtml(order, items);

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID_RECEIPT || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      // 1. Send customer email
      const customerResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey || undefined,
          template_params: {
            to_email: order.customerEmail,
            subject: customerSubject,
            body_html: customerHtml,
          },
        }),
      });

      if (!customerResponse.ok) {
        const text = await customerResponse.text();
        console.error("EmailJS REST API error sending receipt to customer:", text);
      }

      // 2. Send owner email
      const ownerResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          accessToken: privateKey || undefined,
          template_params: {
            to_email: storeOwnerEmail,
            subject: ownerSubject,
            body_html: ownerHtml,
          },
        }),
      });

      if (!ownerResponse.ok) {
        const text = await ownerResponse.text();
        console.error("EmailJS REST API error sending receipt to store owner:", text);
      }

      return customerResponse.ok && ownerResponse.ok;
    } catch (err) {
      console.error("Exception in sendOrderEmails dispatching via EmailJS:", err);
      return false;
    }
  }

  // Fallback if not configured
  console.log("==========================================");
  console.log(`[EMAIL SIMULATOR - TO CUSTOMER: ${order.customerEmail}]`);
  console.log(`Subject: ${customerSubject}`);
  console.log(`From: ${emailFrom}`);
  console.log("HTML Body Preview length:", customerHtml.length);
  console.log("------------------------------------------");
  console.log(`[EMAIL SIMULATOR - TO OWNER: ${storeOwnerEmail}]`);
  console.log(`Subject: ${ownerSubject}`);
  console.log("HTML Body Preview length:", ownerHtml.length);
  console.log("==========================================");
  return true;
}
