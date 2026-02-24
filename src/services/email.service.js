import { Resend } from "resend";
import config from "../config/index.js";

const resend = new Resend(config.email.resendApiKey);

const logoUrl = `https://www.autofill.live/_next/image?url=%2Flogo.png&w=32&q=75`;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.appName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 12px; vertical-align: middle;">
                    <img src="${logoUrl}" alt="${config.appName}" width="40" height="40" style="display: block; border-radius: 50%; border: none;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 18px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">${config.appName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.6;">
                © ${new Date().getFullYear()} ${config.appName}. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #a1a1aa;">
                AI-powered form autofill for everyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const buttonStyle = `
  display: inline-block;
  background-color: #000000;
  color: #ffffff;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: background-color 0.2s;
`;

const templates = {
    verifyEmail: ({ name, verificationUrl }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          Verify your email
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          Hi${name ? ` ${name}` : ""},<br><br>
          Welcome to ${config.appName}! Please verify your email address to get started with AI-powered form autofill.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 8px 0 32px;">
              <a href="${verificationUrl}" style="${buttonStyle}">
                Verify Email Address
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.6;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
        <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
          Button not working? Copy and paste this link:<br>
          <a href="${verificationUrl}" style="color: #0070f3; word-break: break-all;">${verificationUrl}</a>
        </p>
    `),

    welcomeEmail: ({ name, freeCredits }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          Welcome to ${config.appName}! 🎉
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          Hi${name ? ` ${name}` : ""},<br><br>
          Your email has been verified and your account is now active. You're all set to use AI-powered form autofill!
        </p>
        ${
            freeCredits
                ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: 500;">
            🎁 Welcome Gift
          </p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #166534;">
            ${freeCredits} Credits
          </p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #15803d;">
            Added to your account - start using them now!
          </p>
        </div>
        `
                : ""
        }
        <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #000000;">
            Getting Started
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #52525b; line-height: 1.8;">
            <li>Install the browser extension</li>
            <li>Navigate to any form</li>
            <li>Click "Execute Autofill" to fill forms instantly</li>
          </ul>
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${config.frontendUrl}" style="${buttonStyle}">
                Get Started
              </a>
            </td>
          </tr>
        </table>
    `),

    forgotPassword: ({ name, resetUrl }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          Reset your password
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          Hi${name ? ` ${name}` : ""},<br><br>
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 8px 0 32px;">
              <a href="${resetUrl}" style="${buttonStyle}">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.6;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
        <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
          Button not working? Copy and paste this link:<br>
          <a href="${resetUrl}" style="color: #0070f3; word-break: break-all;">${resetUrl}</a>
        </p>
    `),

    passwordChanged: ({ name }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          Password changed successfully
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          Hi${name ? ` ${name}` : ""},<br><br>
          Your password has been changed successfully. You can now log in with your new password.
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6;">
            <strong>Didn't make this change?</strong><br>
            If you didn't change your password, please reset it immediately and contact our support team.
          </p>
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${config.frontendUrl}/reset-password" style="${buttonStyle}">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
    `),

    paymentSuccess: ({ name, packName, credits, amount, newBalance }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          Payment Successful! 🎉
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          Hi${name ? ` ${name}` : ""},<br><br>
          Thank you for your purchase! Your credits have been added to your account.
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #166534;">
            Order Summary
          </h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #52525b;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dcfce7;">Pack</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dcfce7; text-align: right; font-weight: 500; color: #000000;">${packName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dcfce7;">Credits Added</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dcfce7; text-align: right; font-weight: 500; color: #000000;">+${credits}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dcfce7;">Amount Paid</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dcfce7; text-align: right; font-weight: 500; color: #000000;">$${amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #166534;">New Balance</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #166534;">${newBalance} credits</td>
            </tr>
          </table>
        </div>
        <p style="margin: 0 0 24px; font-size: 14px; color: #52525b; line-height: 1.6;">
          Your credits never expire and can be used for AI-powered form autofill, text enhancement, and CV parsing.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${config.frontendUrl}/dashboard/billing" style="${buttonStyle}">
                View Your Balance
              </a>
            </td>
          </tr>
        </table>
    `),

    contactMessage: ({ name, email, message }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          New Contact Message
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          You received a new message from the contact form on ${config.appName}.
        </p>
        <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #52525b;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: 600; color: #71717a;">From</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right; font-weight: 500; color: #000000;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: 600; color: #71717a;">Email</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                <a href="mailto:${email}" style="color: #0070f3; text-decoration: none;">${email}</a>
              </td>
            </tr>
          </table>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">
            Message
          </h3>
          <p style="margin: 0; font-size: 15px; color: #000000; line-height: 1.7; white-space: pre-wrap;">${message}</p>
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="mailto:${email}?subject=Re: Your message to ${config.appName}" style="${buttonStyle}">
                Reply to ${name}
              </a>
            </td>
          </tr>
        </table>
    `),

    adminPurchaseNotification: ({
        customerName,
        customerEmail,
        packName,
        credits,
        amount,
        orderId,
    }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          New Purchase! 💰
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          A customer just made a purchase on ${config.appName}.
        </p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1e40af;">
            Purchase Details
          </h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #52525b;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">Customer</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe; text-align: right; font-weight: 500; color: #000000;">${customerName || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">Email</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe; text-align: right; font-weight: 500; color: #000000;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">Pack</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe; text-align: right; font-weight: 500; color: #000000;">${packName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">Credits</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe; text-align: right; font-weight: 500; color: #000000;">${credits}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">Amount</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe; text-align: right; font-weight: 600; color: #166534;">$${amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Order ID</td>
              <td style="padding: 8px 0; text-align: right; font-size: 12px; color: #71717a;">${orderId}</td>
            </tr>
          </table>
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a href="${config.frontendUrl}/admin" style="${buttonStyle}">
                View Admin Dashboard
              </a>
            </td>
          </tr>
        </table>
    `),
};

export const sendVerificationEmail = async (to, { name, verificationUrl }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to,
            replyTo: config.email.replyTo,
            subject: `Verify your email - ${config.appName}`,
            html: templates.verifyEmail({ name, verificationUrl }),
        });

        if (error) {
            console.error("[Email] Verification email failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Verification email sent to ${to}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Verification email error:", err);
        return { success: false, error: err.message };
    }
};

export const sendWelcomeEmail = async (to, { name, freeCredits }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to,
            replyTo: config.email.replyTo,
            subject: `Welcome to ${config.appName}! 🎉${freeCredits ? ` You got ${freeCredits} free credits!` : ""}`,
            html: templates.welcomeEmail({ name, freeCredits }),
        });

        if (error) {
            console.error("[Email] Welcome email failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Welcome email sent to ${to}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Welcome email error:", err);
        return { success: false, error: err.message };
    }
};

export const sendForgotPasswordEmail = async (to, { name, resetUrl }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to,
            replyTo: config.email.replyTo,
            subject: `Reset your password - ${config.appName}`,
            html: templates.forgotPassword({ name, resetUrl }),
        });

        if (error) {
            console.error("[Email] Forgot password email failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Forgot password email sent to ${to}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Forgot password email error:", err);
        return { success: false, error: err.message };
    }
};

export const sendPasswordChangedEmail = async (to, { name }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to,
            replyTo: config.email.replyTo,
            subject: `Password changed - ${config.appName}`,
            html: templates.passwordChanged({ name }),
        });

        if (error) {
            console.error("[Email] Password changed email failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Password changed email sent to ${to}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Password changed email error:", err);
        return { success: false, error: err.message };
    }
};

export const sendPaymentSuccessEmail = async (
    to,
    { name, packName, credits, amount, newBalance }
) => {
    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to,
            replyTo: config.email.replyTo,
            subject: `Payment Successful - ${credits} credits added! - ${config.appName}`,
            html: templates.paymentSuccess({ name, packName, credits, amount, newBalance }),
        });

        if (error) {
            console.error("[Email] Payment success email failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Payment success email sent to ${to}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Payment success email error:", err);
        return { success: false, error: err.message };
    }
};

export const sendContactMessage = async ({ name, email, message }) => {
    const adminEmail = config.email.adminEmail;
    if (!adminEmail) {
        console.log("[Email] Admin email not configured, skipping contact message");
        return { success: false, error: "Admin email not configured" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to: adminEmail,
            replyTo: email,
            subject: `Contact Form: Message from ${name} - ${config.appName}`,
            html: templates.contactMessage({ name, email, message }),
        });

        if (error) {
            console.error("[Email] Contact message failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Contact message sent from ${email}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Contact message error:", err);
        return { success: false, error: err.message };
    }
};

export const sendAdminPurchaseNotification = async ({
    customerName,
    customerEmail,
    packName,
    credits,
    amount,
    orderId,
}) => {
    const adminEmail = config.email.adminEmail;
    if (!adminEmail) {
        console.log("[Email] Admin email not configured, skipping purchase notification");
        return { success: false, error: "Admin email not configured" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to: adminEmail,
            replyTo: config.email.replyTo,
            subject: `💰 New Purchase: ${packName} ($${amount}) - ${config.appName}`,
            html: templates.adminPurchaseNotification({
                customerName,
                customerEmail,
                packName,
                credits,
                amount,
                orderId,
            }),
        });

        if (error) {
            console.error("[Email] Admin purchase notification failed:", error);
            return { success: false, error };
        }

        console.log(`[Email] Admin purchase notification sent to ${adminEmail}`);
        return { success: true, data };
    } catch (err) {
        console.error("[Email] Admin purchase notification error:", err);
        return { success: false, error: err.message };
    }
};

export default {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendForgotPasswordEmail,
    sendPasswordChangedEmail,
    sendPaymentSuccessEmail,
    sendContactMessage,
    sendAdminPurchaseNotification,
};
