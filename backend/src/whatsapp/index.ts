import createWASocket, { Browsers, BufferJSON, DisconnectReason, useMultiFileAuthState } from "baileys";
/*import crypto, { BinaryLike, CipherKey } from "crypto";
import fs from "fs";

function decodeAttachment(mediaKey: string, encPath: string, whatsappTypeMessageToDecode: string) {
    if (!mediaKey || !encPath || !whatsappTypeMessageToDecode) {
        throw new Error("Invalid parameters for decoding attachment");
    }

    function HKDF(key: Uint8Array, length: number, appInfo = "") {
        const prk = crypto.createHmac("sha256", Buffer.alloc(32)).update(key).digest();
        let prev = Buffer.alloc(0);
        let output = Buffer.alloc(0);
        let blockIndex = 1;
        while (output.length < length) {
            const hmac = crypto.createHmac("sha256", prk);
            hmac.update(Buffer.concat([prev, Buffer.from(appInfo), Buffer.from([blockIndex])]));
            prev = hmac.digest();
            output = Buffer.concat([output, prev]);
            blockIndex += 1;
        }
        return output.subarray(0, length);
    }

    function AESDecrypt(key: CipherKey, ciphertext: NodeJS.ArrayBufferView, iv: BinaryLike | null) {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        decipher.setAutoPadding(false);
        let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        // Remove PKCS#7 padding
        const paddingLength = decrypted[decrypted.length - 1];
        return decrypted.subarray(0, decrypted.length - paddingLength);
    }

    const mediaKeyExpanded = HKDF(
        Buffer.from(mediaKey, 'base64'),
        112,
        whatsappTypeMessageToDecode
    );

    const iv = mediaKeyExpanded.subarray(0, 16);
    const cipherKey = mediaKeyExpanded.subarray(16, 48);

    const mediaData = fs.readFileSync(encPath);
    const file = mediaData.subarray(0, -10);

    const decrypted = AESDecrypt(cipherKey, file, iv);
}*/

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
            if (msg.messageStubParameters[1] !== undefined && msg.messageStubParameters[0] === "Message absent from node") {
                await sock.sendMessageAck(msg.messageStubParameters[1], BufferJSON.reviver);
            }
            // message is message.extendedTextMessage.text for message only
            // message + image, message is message.documentWithCaptionMessage.message.documentMessage.caption, url is message.documentWithCaptionMessage.message.documentMessage.url
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startWASocket().catch((err) => {
    console.error("Failed to start WhatsApp socket:", err);
});