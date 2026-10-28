// Capa abstracta de emails transaccionales. En dev loguea a consola;
// en producción se enchufa Resend (u otro) implementando Mailer.

export type Mail = {
  to: string;
  subject: string;
  text: string;
  /** Versión HTML branded (con el GIF del estado). El texto queda como fallback. */
  html?: string;
};

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

class ConsoleMailer implements Mailer {
  async send(mail: Mail): Promise<void> {
    console.log(
      [
        "",
        "┌─ 📧 EMAIL (dev — no se envía) ─────────────────────────",
        `│ Para:    ${mail.to}`,
        `│ Asunto:  ${mail.subject}`,
        mail.html ? "│ (incluye versión HTML branded con GIF del estado)" : "│ (texto plano)",
        "├────────────────────────────────────────────────────────",
        ...mail.text.split("\n").map((l) => `│ ${l}`),
        "└────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
  }
}

// Resend vía API HTTP (sin SDK). Requiere el dominio verificado en resend.com.
class ResendMailer implements Mailer {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}
  async send(mail: Mail): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
    });
    // Un email caído no debe romper la compra ni el login: se loguea y sigue.
    if (!res.ok) console.error(`[mailer] Resend respondió ${res.status}: ${await res.text()}`);
  }
}

let mailer: Mailer | undefined;

export function getMailer(): Mailer {
  if (!mailer) {
    const name = process.env.MAILER ?? "console";
    if (name === "resend") {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("MAILER=resend requiere RESEND_API_KEY.");
      mailer = new ResendMailer(key, process.env.MAIL_FROM ?? "Traelo <hola@traelo.ar>");
    } else if (name === "console") {
      mailer = new ConsoleMailer();
    } else {
      throw new Error(`MAILER "${name}" no implementado (soportados: console, resend).`);
    }
  }
  return mailer;
}
