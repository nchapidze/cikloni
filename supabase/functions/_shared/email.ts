// Sends email through Resend's REST API (plain fetch, no SDK). Secrets come from the Edge
// Function environment (`supabase secrets set`, or supabase/functions/.env locally), never from
// the Angular apps. See supabase/functions/.env.example.
import type { EmailLinks, RenderedEmail } from './order-emails.ts';

export interface EmailConfig {
  apiKey: string;
  /** Verified sender in Resend, e.g. "Cikloni <orders@cikloni.ge>". */
  from: string;
  /** Where customers' replies go; optional. */
  replyTo: string | null;
  /** Receives the new-order notification; optional. */
  notificationEmail: string | null;
  shopUrl: string;
  adminUrl: string;
}

/** null (and a warning) when sending is not configured, e.g. in local development. */
export function emailConfig(): EmailConfig | null {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM');
  if (!apiKey || !from) {
    console.warn('email disabled: set the RESEND_API_KEY and EMAIL_FROM secrets');
    return null;
  }
  const url = (name: string, fallback: string) =>
    (Deno.env.get(name) || fallback).replace(/\/+$/, '');
  return {
    apiKey,
    from,
    replyTo: Deno.env.get('EMAIL_REPLY_TO') || null,
    notificationEmail: Deno.env.get('ORDER_NOTIFICATION_EMAIL') || null,
    shopUrl: url('SHOP_URL', 'https://cikloni.ge'),
    adminUrl: url('ADMIN_URL', 'https://admin.cikloni.ge'),
  };
}

export function emailLinks(config: EmailConfig): EmailLinks {
  return { shopUrl: config.shopUrl, logoUrl: `${config.shopUrl}/email/logo.png` };
}

export interface OutgoingEmail extends RenderedEmail {
  to: string;
  replyTo?: string | null;
  /** Resend drops a repeat with the same key (within 24 h), so a retry cannot double-send. */
  idempotencyKey: string;
}

/** Throws when Resend does not accept the email. */
export async function sendEmail(config: EmailConfig, email: OutgoingEmail): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': email.idempotencyKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo && { reply_to: email.replyTo }),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}

type EdgeRuntimeGlobal = { EdgeRuntime?: { waitUntil(promise: Promise<unknown>): void } };

/**
 * Runs `task` after the response is sent, so email never delays or fails the request.
 * Errors are logged (visible under the function's logs in the Supabase dashboard).
 */
export function runInBackground(label: string, task: () => Promise<void>): void {
  const promise = task().catch((error) => console.error(`${label} failed`, error));
  // waitUntil keeps the worker alive until the task settles; without it (older runtimes) the
  // promise still runs, it just might be cut short.
  (globalThis as EdgeRuntimeGlobal).EdgeRuntime?.waitUntil(promise);
}
