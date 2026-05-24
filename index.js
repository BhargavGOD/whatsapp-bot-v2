console.log("🚀 WhatsApp Bot Starting...");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["Termux", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("✅ BOT CONNECTED");
    }
  });

  if (!sock.authState.creds.registered) {
    rl.question("Enter WhatsApp number (with country code): ", async (num) => {
      const code = await sock.requestPairingCode(num);
      console.log("\nPAIR CODE:", code, "\n");
    });
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log("MSG:", text);

    // TEST COMMAND
    if (text === ".test") {
      await sock.sendMessage(from, { text: "✅ Bot is working!" });
    }

    // SIMPLE AI PLACEHOLDER
    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(from, { text: "Hello 👋 I am your bot!" });
    }
  });
}

startBot();

process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);