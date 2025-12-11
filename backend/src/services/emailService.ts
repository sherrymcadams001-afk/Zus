import { Env } from '../types';

const ZEPTOMAIL_API_URL = 'https://api.zeptomail.com/v1.1/email';
// Use the provided API key directly for now, but in production it should be in Env
const ZEPTOMAIL_API_KEY = 'wSsVR60lrhDzDqgrzz38Ju0xkF1QDgvxHR4p0VWh63L9TfvFocczn0HGVwT0GaNMR2JgFzoWrL8gnBkD0zQJ24t7yVABXSiF9mqRe1U4J3x17qnvhDzOXWtUlhCAJY0KwwVtnWFlEM4l+g==';

interface EmailOptions {
  to: { email_address: { address: string; name?: string } }[];
  subject: string;
  htmlbody: string;
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
        from: { "address": "noreply@zus.finance", "name": "Zus Finance" }, // Replace with verified sender
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

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  return sendEmail({
    to: [{ email_address: { address: email, name: name || 'Trader' } }],
    subject: 'Welcome to Orion Trading Platform',
    htmlbody: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1>Welcome to Orion!</h1>
        <p>We are excited to have you on board.</p>
        <p>Start your trading journey today.</p>
        <br>
        <p>Best regards,</p>
        <p>The Orion Team</p>
      </div>
    `,
  });
}
