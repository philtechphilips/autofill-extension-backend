import { Resend } from "resend";
import config from "../config/index.js";

const resend = new Resend(config.email.resendApiKey);

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
                  <td style="padding-right: 10px;">
                    <div style="width: 10px; height: 10px; background-color: #000000; border-radius: 50%;"></div>
                  </td>
                  <td>
                    <span style="font-size: 16px; font-weight: 600; color: #000000; letter-spacing: -0.02em; text-transform: uppercase;">${config.appName}</span>
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

    welcomeEmail: ({ name }) =>
        baseTemplate(`
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">
          Welcome to ${config.appName}! 🎉
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
          Hi${name ? ` ${name}` : ""},<br><br>
          Your email has been verified and your account is now active. You're all set to use AI-powered form autofill!
        </p>
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

export const sendWelcomeEmail = async (to, { name }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: config.email.from,
            to,
            replyTo: config.email.replyTo,
            subject: `Welcome to ${config.appName}! 🎉`,
            html: templates.welcomeEmail({ name }),
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

export default {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendForgotPasswordEmail,
    sendPasswordChangedEmail,
};
