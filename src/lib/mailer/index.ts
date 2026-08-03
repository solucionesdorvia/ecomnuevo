// Capa abstracta de emails transaccionales. En dev loguea a consola;
// en producción se enchufa Resend (u otro) implementando Mailer.

export type Mail = {
  to: string;
  subject: string;
  text: string;
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
        "├────────────────────────────────────────────────────────",
        ...mail.text.split("\n").map((l) => `│ ${l}`),
        "└────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
  }
}

let mailer: Mailer | undefined;

export function getMailer(): Mailer {
  if (!mailer) {
    const name = process.env.MAILER ?? "console";
    if (name !== "console") {
      throw new Error(`MAILER "${name}" no implementado todavía (soportado: console).`);
    }
    mailer = new ConsoleMailer();
  }
  return mailer;
}
