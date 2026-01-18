import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string) {
  const { error } = await resend.emails.send({
    from: "Groove <hello@yourdomain.com>", // Update this after domain verification
    to: email,
    subject: "Welcome to the Groove waitlist!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #7c3aed; font-size: 24px; margin: 0 0 20px;">Welcome to Groove!</h1>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              You're on the waitlist! We're building something special to help you build habits that actually stick.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Here's what you can look forward to:
            </p>

            <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 24px; padding-left: 20px;">
              <li><strong>Simple check-ins</strong> - One tap to track your habits</li>
              <li><strong>Real accountability</strong> - Partner with friends who keep you on track</li>
              <li><strong>AI insights</strong> - Understand your patterns and optimize</li>
            </ul>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We'll email you as soon as we're ready for you.
            </p>

            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              — The Groove Team
            </p>
          </div>

          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
            You're receiving this because you signed up for the Groove waitlist.
          </p>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
}
