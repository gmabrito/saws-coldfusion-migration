/**
 * Notification Service — email stub.
 * Send submitter notifications about request lifecycle events.
 *
 * TODO: Wire to SMTP (nodemailer) when email credentials are provisioned.
 * SMTP config comes from: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFICATIONS_FROM
 */

async function notifySubmitter(request, event) {
  // Log intent so we can verify the feature works before SMTP is live
  console.log(
    `[Notifications] Would notify ${request.requester_email} — ${event} — ${request.confirmation_no}`
  );

  // TODO: Implement when SMTP is configured
  // if (!process.env.SMTP_HOST) return;
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from, to, subject, text });
}

module.exports = { notifySubmitter };
