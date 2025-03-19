"use server";
import FormData from "form-data";
import Mailgun from "mailgun.js";

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.MAILGUN_API_KEY) {
    throw new Error("MAILGUN_API_KEY environment variable is not set");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  try {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY, // Fixed to use MAILGUN_API_KEY instead of API_KEY
    });

    const response = await mg.messages.create("vihaan.ind.in", {
      to: to.toLowerCase().trim(),
      from: process.env.EMAIL_FROM,
      subject: subject.trim(),
      text: text.trim(),
    });

    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Mailgun API returned status code ${response.status}`);
    }

    return {
      success: true,
      messageId: response.id, // Mailgun typically uses 'id' rather than x-message-id header
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email. Please try again later.",
    };
  }
}
