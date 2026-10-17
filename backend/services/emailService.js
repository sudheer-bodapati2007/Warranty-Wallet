import { Resend } from 'resend';

let resendClient = null;

const getResendClient = () => {
  if (resendClient) return resendClient;
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

/**
 * Generate formatted HTML template for warranty expiry notification
 */
const generateExpiryEmailHtml = ({ userName, productName, brand, expiryDate, daysRemaining, dashboardUrl }) => {
  const statusColor = daysRemaining <= 7 ? '#e11d48' : '#d97706';
  const countdownText = daysRemaining === 0
    ? 'Expires Today'
    : daysRemaining === 1
      ? 'Expires in 1 Day'
      : `Expires in ${daysRemaining} Days`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Warranty Expiry Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background-color: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
        .content { padding: 32px 24px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; color: #ffffff; background-color: ${statusColor}; margin-bottom: 16px; }
        .card { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .card-row:last-child { margin-bottom: 0; }
        .label { color: #64748b; font-weight: 500; }
        .value { color: #0f172a; font-weight: 600; }
        .btn-container { text-align: center; margin-top: 32px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; }
        .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡 Warranty Wallet</h1>
          <p>Product Expiry Notification</p>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          <p>This is a reminder that the warranty for one of your registered products is ending soon:</p>

          <div style="text-align: center;">
            <div class="badge">${countdownText}</div>
          </div>

          <div class="card">
            <div class="card-row">
              <span class="label">Product:</span>
              <span class="value">${productName}</span>
            </div>
            ${brand ? `
            <div class="card-row">
              <span class="label">Brand:</span>
              <span class="value">${brand}</span>
            </div>` : ''}
            <div class="card-row">
              <span class="label">Expiry Date:</span>
              <span class="value">${expiryDate}</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            If you need to make a claim, please locate your receipts and contact the manufacturer before coverage ends.
          </p>

          <div class="btn-container">
            <a href="${dashboardUrl}" class="btn">View Product in Warranty Wallet</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Warranty Wallet • All rights reserved.</p>
          <p>You received this because email notifications are enabled in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Dispatch an expiry reminder email
 */
export const sendExpiryReminderEmail = async ({ toEmail, userName, productName, brand, expiryDate, daysRemaining, warrantyId }) => {
  const resend = getResendClient();
  const fromEmail = process.env.EMAIL_FROM || 'Warranty Wallet <notifications@warrantywallet.app>';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const dashboardUrl = `${clientUrl.replace(/\/$/, '')}/warranties/${warrantyId}`;

  const subject = daysRemaining === 0
    ? `⚠️ Action Required: Warranty for ${productName} expires today!`
    : `Reminder: Warranty for ${productName} expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;

  const html = generateExpiryEmailHtml({
    userName,
    productName,
    brand,
    expiryDate,
    daysRemaining,
    dashboardUrl
  });

  // If Resend API key is not configured or in test mode, safely log and simulate
  if (!resend || process.env.NODE_ENV === 'test') {
    console.log(`[SIMULATED EMAIL REMINDER] To: ${toEmail} | Subject: ${subject}`);
    return {
      success: true,
      simulated: true,
      id: `sim-${Date.now()}`
    };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};
