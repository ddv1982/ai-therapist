import { NextRequest, NextResponse } from 'next/server';
import { generateSessionReport } from '@/lib/groq-client';
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy-prompts';
import { prisma } from '@/lib/db';
import { emailReportSchema, validateRequest } from '@/lib/validation';
import { logger, createRequestLogger } from '@/lib/logger';
import { marked } from 'marked';
import { getEmailCredentials } from '@/lib/secure-credentials';
import type { Message } from '@/types/index';

// Email service - you'll need to configure this with your preferred email provider
// For now, using a simple console log, but you can integrate with services like:
// - SendGrid, Nodemailer (SMTP), AWS SES, Mailgun, etc.
// See EMAIL_SETUP.md for configuration examples

async function sendEmail(to: string, subject: string, content: string, config?: {
  service: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
}) {
  if (!config || config.service === 'console') {
    // Console logging for testing
    console.log('=== EMAIL TO SEND ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', content);
    console.log('=== END EMAIL ===');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return;
  }

  if (config.service === 'smtp') {
    // Dynamic import to avoid loading nodemailer unless needed
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    await transporter.sendMail({
      from: config.fromEmail,
      to,
      subject,
      html: content,
    });
  }
}

function formatReportAsHTML(report: string): string {
  // Use marked library for robust Markdown-to-HTML conversion
  
  // Configure marked with therapeutic-friendly options
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub Flavored Markdown
    sanitize: false, // We trust our AI-generated content
    smartLists: true, // Better list handling
    smartypants: true, // Smart quotes and dashes
    tables: true, // Enable table parsing
    pedantic: false, // Allow for more lenient parsing
  });

  const htmlContent = marked(report);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Therapeutic Session Report</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.7; 
          color: #2d3748; 
          max-width: 650px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #f7fafc;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 35px; 
          border-radius: 16px 16px 0 0; 
          text-align: center;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p { 
          margin: 12px 0 0 0; 
          opacity: 0.95; 
          font-size: 15px;
          font-weight: 300;
        }
        .content { 
          background: white; 
          padding: 40px;
          border-radius: 0 0 16px 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        h1 { 
          color: #2d3748; 
          font-size: 24px; 
          font-weight: 700; 
          margin: 30px 0 20px 0; 
          border-bottom: 3px solid #667eea;
          padding-bottom: 10px;
        }
        h2 { 
          color: #4a5568; 
          font-size: 20px; 
          font-weight: 600; 
          margin: 25px 0 15px 0; 
          position: relative;
        }
        h2:before {
          content: '';
          position: absolute;
          left: -15px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: #667eea;
          border-radius: 2px;
        }
        h3 { 
          color: #4a5568; 
          font-size: 18px; 
          font-weight: 600; 
          margin: 20px 0 12px 0; 
        }
        p { 
          margin: 0 0 16px 0; 
          color: #2d3748;
          line-height: 1.7;
        }
        strong { 
          font-weight: 700; 
          color: #1a202c;
          background: rgba(102, 126, 234, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        em { 
          font-style: italic; 
          color: #667eea;
          font-weight: 500;
        }
        ul, ol { 
          margin: 16px 0;
          padding-left: 24px;
        }
        li { 
          margin-bottom: 10px;
          line-height: 1.6;
          color: #2d3748;
        }
        ul li {
          position: relative;
        }
        ul li:before {
          content: '•';
          color: #667eea;
          font-weight: bold;
          position: absolute;
          left: -16px;
        }
        .footer { 
          text-align: center; 
          padding: 25px 20px; 
          color: #718096; 
          font-size: 13px;
          border-top: 2px solid #e2e8f0;
          margin-top: 30px;
          background: #f7fafc;
          border-radius: 8px;
        }
        .footer p {
          margin: 8px 0;
        }
        .disclaimer {
          background: linear-gradient(135deg, #fef5e7 0%, #fdf4e3 100%);
          border: 2px solid #f6e05e;
          padding: 20px;
          border-radius: 12px;
          margin-top: 30px;
          font-size: 14px;
          position: relative;
        }
        .disclaimer:before {
          content: '⚠️';
          font-size: 24px;
          position: absolute;
          top: 20px;
          left: 20px;
        }
        .disclaimer strong {
          background: none;
          color: #d69e2e;
          padding: 0;
        }
        .disclaimer-content {
          margin-left: 40px;
        }
        
        /* Table styling */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        
        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          color: #2d3748;
          line-height: 1.6;
        }
        
        tr:hover {
          background-color: #f7fafc;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        /* Responsive design */
        @media only screen and (max-width: 600px) {
          body { padding: 10px; }
          .header { padding: 25px 20px; }
          .content { padding: 25px 20px; }
          .header h1 { font-size: 24px; }
          h1 { font-size: 20px; }
          h2 { font-size: 18px; }
          
          /* Mobile table styling */
          table, thead, tbody, th, td, tr {
            display: block;
          }
          
          thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          
          tr {
            border: 1px solid #e2e8f0;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 8px;
            background: white;
          }
          
          td {
            border: none;
            padding: 8px 0;
            position: relative;
            padding-left: 35%;
          }
          
          td:before {
            content: attr(data-label) ": ";
            position: absolute;
            left: 6px;
            width: 30%;
            padding-right: 10px;
            white-space: nowrap;
            font-weight: 600;
            color: #667eea;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🧠 Therapeutic Session Report</h1>
        <p>Professional AI-Generated Analysis • ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      <div class="content">
        ${htmlContent}
        
        <div class="disclaimer">
          <div class="disclaimer-content">
            <strong>Important Disclaimer:</strong> This report is generated by AI and is intended for informational purposes only. It should not be considered a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified mental health professionals for any questions you may have regarding your mental health.
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>AI Therapist</strong> • Confidential and for personal use only</p>
        <p>If you have any concerns about your mental health, please contact a qualified healthcare provider</p>
        <p>Generated with compassionate AI technology</p>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.info('Email report request received', requestContext);
    
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(emailReportSchema, body);
    if (!validation.success) {
      logger.validationError('/api/reports/send', validation.error, requestContext);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const { sessionId, messages, emailAddress, model, emailConfig } = validation.data;

    // Generate the session report using AI
    const modelToUse = model || 'openai/gpt-oss-120b'; // Use provided model or default
    console.log(`Generating session report using model: ${modelToUse}...`);
    const completion = await generateSessionReport(messages, REPORT_GENERATION_PROMPT, modelToUse);
    
    if (!completion) {
      return NextResponse.json(
        { error: 'Failed to generate session report' },
        { status: 500 }
      );
    }

    // Format the report as HTML email
    const htmlContent = formatReportAsHTML(completion);
    
    // Get email configuration - use stored credentials if available, otherwise use provided config
    let finalEmailConfig = emailConfig;
    
    if (!emailConfig || emailConfig.service === 'console' || !emailConfig.smtpPass) {
      // Try to use stored credentials
      const storedCredentials = await getEmailCredentials(request);
      if (storedCredentials) {
        finalEmailConfig = storedCredentials;
        logger.info('Using stored email credentials for report', requestContext);
      }
    }

    // Send the email
    const subject = `Therapeutic Session Report - ${new Date().toLocaleDateString()}`;
    try {
      await sendEmail(emailAddress, subject, htmlContent, finalEmailConfig);
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      
      // Handle specific SMTP authentication errors
      if (emailError.code === 'EAUTH' && emailError.response?.includes('BadCredentials')) {
        return NextResponse.json(
          { 
            error: 'Gmail authentication failed. Please use an App Password instead of your regular Gmail password.',
            details: 'Go to Google Account settings > Security > 2-Step Verification > App passwords to generate one.',
            helpUrl: 'https://support.google.com/mail/?p=BadCredentials'
          },
          { status: 400 }
        );
      }
      
      // Handle other email errors
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: emailError.message || 'Unknown email error'
        },
        { status: 500 }
      );
    }

    // Optionally save the report to database
    try {
      await prisma.sessionReport.create({
        data: {
          sessionId,
          keyPoints: JSON.stringify([]),
          therapeuticInsights: completion,
          patternsIdentified: JSON.stringify([]),
          actionItems: JSON.stringify([]),
          moodAssessment: '',
          progressNotes: `Report sent to ${emailAddress} on ${new Date().toISOString()}`,
        }
      });
    } catch (dbError) {
      console.warn('Failed to save report to database:', dbError);
      // Continue anyway - email sending is more important
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report generated and sent successfully' 
    });

  } catch (error) {
    console.error('Error in report generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate and send report' },
      { status: 500 }
    );
  }
}