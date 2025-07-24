import createWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from "baileys";

async function startWASocket() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = createWASocket({
        auth: state,
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === "close") {
            if ((lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.error("Connection closed unexpectedly, reconnecting...");
                startWASocket();
            } else {
                console.log("Logged out, please re-authenticate.");
            }
        } else if (connection === "open") {
            console.log("WhatsApp connection established successfully.");
        }
        
        if (qr) {
            console.log("QR Code received, please scan it:", qr);
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        for (const msg of m.messages) {
            if (msg.key.fromMe) return;
            console.log("Received message:", msg);
            // message is message.extendedTextMessage.text for message only
            // message + image, message is message.documentWithCaptionMessage.message.documentMessage.caption, url is message.documentWithCaptionMessage.message.documentMessage.url
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startWASocket().catch((err) => {
    console.error("Failed to start WhatsApp socket:", err);
});