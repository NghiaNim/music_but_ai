import sgMail from "@sendgrid/mail";

function requireSendgridConfig() {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!key?.trim()) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  if (!from?.trim()) {
    throw new Error(
      "SENDGRID_FROM_EMAIL is not set (use a verified sender in SendGrid)",
    );
  }
  sgMail.setApiKey(key);
  return from;
}

export async function sendHostBroadcastEmails(input: {
  recipients: string[];
  subject: string;
  text: string;
}): Promise<void> {
  if (input.recipients.length === 0) return;
  const from = requireSendgridConfig();
  for (const to of input.recipients) {
    await sgMail.send({
      to,
      from,
      subject: input.subject,
      text: input.text,
    });
  }
}
