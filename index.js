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

function askNumber() {
  return new Promise((resolve) => {
    rl.question("Enter WhatsApp number (with country code): ", (num) => {
      resolve(num);
    });
  });
}

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

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "open") {
      console.log("✅ BOT CONNECTED");
    }

    if (connection === "close") {
      console.log("❌ Connection closed");
    }
  });

  // 🔥 WAIT FOR SOCKET READY BEFORE PAIRING
  setTimeout(async () => {
    try {
      if (!sock.authState.creds.registered) {
        const num = await askNumber();
        const code = await sock.requestPairingCode(num);
        console.log("\n==================");
        console.log("PAIR CODE:", code);
        console.log("==================\n");
      }
    } catch (err) {
      console.log("Pairing error:", err.message);
    }
  }, 3000);

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

    // SIMPLE RESPONSE
    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(from, { text: "👋 Hello! I am your bot." });
    }
  });
}

startBot();

process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);
