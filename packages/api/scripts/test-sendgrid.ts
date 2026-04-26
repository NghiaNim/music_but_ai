import { sendHostBroadcastEmails } from "../src/host-email.ts";

const to = process.env.TEST_EMAIL_TO ?? process.env.SENDGRID_FROM_EMAIL;

if (!to?.trim()) {
  console.error(
    "Set TEST_EMAIL_TO (or SENDGRID_FROM_EMAIL) to a verified recipient.",
  );
  process.exit(1);
}

console.log(`Sending SendGrid test email to ${to}...`);

await sendHostBroadcastEmails({
  recipients: [to],
  subject: "Classica × SendGrid integration test",
  text: [
    "This is a test email from the Classica app confirming that the SendGrid integration works.",
    "",
    `Sent at: ${new Date().toISOString()}`,
  ].join("\n"),
});

console.log("SendGrid test email sent successfully.");
process.exit(0);
