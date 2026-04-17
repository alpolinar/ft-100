import { Resend } from "resend";
import { env } from "../../env.js";

let _resend: Resend | undefined;

const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    if (!_resend) {
      _resend = new Resend(env.RESEND_API_KEY);
    }
    const value = Reflect.get(_resend, prop, receiver);
    return typeof value === "function" ? value.bind(_resend) : value;
  },
});


export class EmailService {
  /**
   * Send a 6-digit verification code to the given email address.
   */
  async sendVerificationCode(to: string, code: string): Promise<void> {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Your FT-100 verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="margin-bottom: 8px;">Verify your email</h2>
          <p style="color: #555; margin-bottom: 24px;">
            Enter the code below to verify your email address and complete registration.
          </p>
          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 16px 24px;
            background: #f4f4f5;
            border-radius: 8px;
            margin-bottom: 24px;
          ">${code}</div>
          <p style="color: #999; font-size: 13px;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}
