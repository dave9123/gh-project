import createWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from "baileys";

async function startWASocket() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = createWASocket({
        auth: state,
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("QR Code received, please scan it:", qr);
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        for (const msg of m.messages) {
            if (msg.key.fromMe) return;
            console.log("Received message:", msg);
        }
    });
}

startWASocket().catch((err) => {
    console.error("Failed to start WhatsApp socket:", err);
});