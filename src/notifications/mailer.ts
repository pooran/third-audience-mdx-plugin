import nodemailer from 'nodemailer'
import type { ThirdAudienceConfig } from '../core/config.js'

export interface MailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export type NotificationsConfig = NonNullable<ThirdAudienceConfig['notifications']>

function getConfig(): NotificationsConfig {
  return {
    smtp: process.env.TA_SMTP_HOST ? {
      host: process.env.TA_SMTP_HOST,
      port: parseInt(process.env.TA_SMTP_PORT ?? '587'),
      secure: process.env.TA_SMTP_SECURE === 'true',
      user: process.env.TA_SMTP_USER ?? '',
      pass: process.env.TA_SMTP_PASS ?? '',
    } : undefined,
    brevoApiKey: process.env.TA_BREVO_API_KEY,
    to: process.env.TA_NOTIFY_TO ?? '',
    from: process.env.TA_NOTIFY_FROM ?? 'Third Audience <noreply@third-audience.app>',
  }
}

export function isMailConfigured(): boolean {
  const cfg = getConfig()
  const hasTo = Boolean(cfg.to && (Array.isArray(cfg.to) ? cfg.to.length > 0 : cfg.to.trim()))
  return hasTo && (Boolean(cfg.brevoApiKey) || Boolean(cfg.smtp?.host))
}

async function sendViaBrevo(apiKey: string, opts: MailOptions, fromAddr: string): Promise<void> {
  const toList = Array.isArray(opts.to) ? opts.to : [opts.to]
  const body = {
    sender: { name: 'Third Audience', email: fromAddr.replace(/.*<(.+)>/, '$1').trim() || fromAddr },
    to: toList.map(email => ({ email })),
    subject: opts.subject,
    htmlContent: opts.html,
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Brevo API error ${res.status}: ${text}`)
  }
}

async function sendViaSmtp(smtp: NonNullable<NotificationsConfig['smtp']>, opts: MailOptions, fromAddr: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port ?? 587,
    secure: smtp.secure ?? false,
    auth: { user: smtp.user, pass: smtp.pass },
  })
  await transporter.sendMail({
    from: opts.from ?? fromAddr,
    to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
    subject: opts.subject,
    html: opts.html,
  })
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const cfg = getConfig()
  const to = opts.to || cfg.to
  const from = opts.from ?? cfg.from ?? 'Third Audience <noreply@third-audience.app>'

  if (!to || (Array.isArray(to) ? to.length === 0 : !to.trim())) {
    return // No recipient configured — silently skip
  }

  const mailOpts = { ...opts, to, from }

  if (cfg.brevoApiKey) {
    await sendViaBrevo(cfg.brevoApiKey, mailOpts, from)
    return
  }
  if (cfg.smtp?.host) {
    await sendViaSmtp(cfg.smtp, mailOpts, from)
    return
  }
  // No mail provider configured — skip silently
}
