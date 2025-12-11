import { Env } from '../types';

const ZEPTOMAIL_API_URL = 'https://api.zeptomail.com/v1.1/email';
const ZEPTOMAIL_API_KEY = 'wSsVR60lrhDzDqgrzz38Ju0xkF1QDgvxHR4p0VWh63L9TfvFocczn0HGVwT0GaNMR2JgFzoWrL8gnBkD0zQJ24t7yVABXSiF9mqRe1U4J3x17qnvhDzOXWtUlhCAJY0KwwVtnWFlEM4l+g==';

// CapWheel brand colors
const BRAND = {
  primary: '#00FF9D',
  secondary: '#00B8D4',
  dark: '#0B1015',
  text: '#E2E8F0',
  muted: '#94A3B8',
};

interface EmailOptions {
  to: { email_address: { address: string; name?: string } }[];
  subject: string;
  htmlbody: string;
}

/**
 * Professional email wrapper with CapWheel branding
 */
function wrapEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CapWheel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1015; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0D1318 0%, #0B1015 100%);">
        <div style="display: inline-block; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
          <span style="color: #00FF9D;">Cap</span><span style="color: #FFFFFF;">Wheel</span>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 2px;">
          Institutional Capital Management
        </div>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px; background-color: #0F1419; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05);">
        ${content}
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #0B1015; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
        <p style="margin: 0 0 15px; font-size: 12px; color: #64748B;">
          © ${new Date().getFullYear()} CapWheel. All rights reserved.
        </p>
        <p style="margin: 0; font-size: 11px; color: #475569;">
          This email was sent from a notification-only address. Please do not reply directly.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch(ZEPTOMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: { address: 'noreply@capwheel.io', name: 'CapWheel' },
        to: options.to,
        subject: options.subject,
        htmlbody: options.htmlbody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZeptoMail error:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email to new users
 * Used for both immediate (referred) and delayed (waitlist) signups
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const displayName = name || 'there';
  
  const content = `
    <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #FFFFFF; line-height: 1.3;">
      Welcome to CapWheel
    </h1>
    
    <p style="margin: 0 0 20px; font-size: 15px; color: #CBD5E1; line-height: 1.6;">
      Hi ${displayName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 15px; color: #CBD5E1; line-height: 1.6;">
      Your account has been activated. You now have access to our institutional-grade capital management platform.
    </p>
    
    <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, rgba(0,255,157,0.08) 0%, rgba(0,184,212,0.05) 100%); border: 1px solid rgba(0,255,157,0.15); border-radius: 12px;">
      <h3 style="margin: 0 0 15px; font-size: 14px; font-weight: 600; color: #00FF9D; text-transform: uppercase; letter-spacing: 1px;">
        What's Next
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
        <li>Complete your profile verification</li>
        <li>Explore our strategy pools and yield protocols</li>
        <li>Connect with our partner network</li>
        <li>Start building your portfolio</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://capwheel.io/capwheel/dashboard" 
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00FF9D 0%, #00E88A 100%); color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,255,157,0.25);">
        Access Your Dashboard
      </a>
    </div>
    
    <p style="margin: 25px 0 0; font-size: 14px; color: #64748B; line-height: 1.6;">
      If you have any questions, our support team is here to help.
    </p>
    
    <p style="margin: 25px 0 0; font-size: 14px; color: #CBD5E1;">
      Welcome aboard,<br>
      <span style="color: #00FF9D;">The CapWheel Team</span>
    </p>
  `;

  return sendEmail({
    to: [{ email_address: { address: email, name: name || undefined } }],
    subject: 'Welcome to CapWheel – Your Account is Ready',
    htmlbody: wrapEmailTemplate(content),
  });
}
