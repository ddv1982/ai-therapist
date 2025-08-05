# Email Service Setup for Session Reports

The AI Therapist application includes a session report feature that can email therapeutic summaries to users. By default, the system logs emails to the console for testing purposes.

## Setting Up Email Service

Choose your preferred email service and configure it in `/app/api/reports/send/route.ts`:

### Option 1: SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to: string, subject: string, content: string) {
  await sgMail.send({
    to,
    from: 'noreply@yourdomain.com',
    subject,
    html: content,
  });
}
```

### Option 2: Nodemailer (SMTP)
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to: string, subject: string, content: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html: content,
  });
}
```

### Option 3: AWS SES
```typescript
import AWS from 'aws-sdk';

const ses = new AWS.SES({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function sendEmail(to: string, subject: string, content: string) {
  await ses.sendEmail({
    Source: process.env.AWS_SES_FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: content } },
    },
  }).promise();
}
```

### Option 4: Mailgun
```typescript
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

async function sendEmail(to: string, subject: string, content: string) {
  await mg.messages.create(process.env.MAILGUN_DOMAIN, {
    from: `AI Therapist <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: [to],
    subject,
    html: content,
  });
}
```

## Features

- **Mobile-responsive email modal** - Works seamlessly on all devices
- **Professional HTML email formatting** - Clean, readable report layout
- **AI-generated insights** - Therapeutic analysis of session content
- **Privacy-focused** - Reports are generated on-demand and sent directly
- **Database logging** - Optional storage of report metadata

## Report Content

Each email report includes:
- Session overview and key themes
- Emotional patterns observed
- Therapeutic insights and recommendations
- Progress notes and observations
- Suggested areas for future sessions
- Professional disclaimers

## Testing

When no email service is configured, reports are logged to the console for testing purposes. Check your server logs to see the formatted HTML content.