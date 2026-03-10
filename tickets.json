const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// إعدادات البوت
const DISCORD_TOKEN = 'MTQ4MDczMDQxNjM2NDI1NzM2MA.GMarvV.aGWXvqEnJiw8xHCydvMVy2OQqVUdCIoFNdVY0M';
const LOGGING_CHANNEL_ID = '1471230207267438795';
const TICKETS_FILE = path.join(__dirname, '../tickets.json');
const TRANSCRIPTS_FOLDER = path.join(__dirname, '../transcripts');

// إنشاء مجلد الترانسكربتات إذا ما كان موجود
if (!fs.existsSync(TRANSCRIPTS_FOLDER)) {
    fs.mkdirSync(TRANSCRIPTS_FOLDER, { recursive: true });
    console.log('📁 تم إنشاء مجلد transcripts');
}

// إنشاء البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// قراءة ملف التكتات
function loadTickets() {
    if (fs.existsSync(TICKETS_FILE)) {
        const data = fs.readFileSync(TICKETS_FILE, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

// حفظ التكتات
function saveTickets(tickets) {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
    console.log('✅ تم حفظ التكت في tickets.json');
}

// تحميل ملف من رابط
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const file = fs.createWriteStream(filepath);
        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// عند تشغيل البوت
client.once('ready', () => {
    console.log('🤖 البوت شغال!');
    console.log(`📝 اسم البوت: ${client.user.tag}`);
    console.log(`📊 يراقب الروم: ${LOGGING_CHANNEL_ID}`);
    console.log(`📁 مجلد الترانسكربتات: ${TRANSCRIPTS_FOLDER}`);
    console.log('⏳ في انتظار رسائل الترانسكربت...');
    console.log('---');
});

// عند استقبال رسالة
client.on('messageCreate', async (message) => {
    // تجاهل رسائل البوت نفسه
    if (message.author.bot && message.author.id !== client.user.id) {
        // التحقق من أن الرسالة في روم الـ Logging
        if (message.channel.id === LOGGING_CHANNEL_ID) {
            
            // التحقق من وجود Embed
            if (message.embeds && message.embeds.length > 0) {
                const embed = message.embeds[0];
                
                // التحقق من وجود معلومات التكت
                const hasTicketInfo = embed.fields && embed.fields.some(f => 
                    f.name.includes('Ticket Owner') || 
                    f.name.includes('Ticket Name')
                );

                if (hasTicketInfo) {
                    console.log('\n📩 تم اكتشاف تكت جديد!');
                    
                    // استخراج المعلومات
                    const ticketData = {
                        timestamp: new Date().toISOString(),
                        ticketOwner: null,
                        ticketOwnerId: null,
                        ticketName: null,
                        panelName: null,
                        transcriptFile: null,
                        users: []
                    };
                    
                    // استخراج المعلومات من Fields
                    embed.fields.forEach(field => {
                        const fieldName = field.name;
                        const fieldValue = field.value;

                        if (fieldName.includes('Ticket Owner')) {
                            const match = fieldValue.match(/<@(\d+)>/);
                            if (match) {
                                ticketData.ticketOwnerId = match[1];
                                ticketData.ticketOwner = fieldValue;
                            }
                        }

                        if (fieldName.includes('Ticket Name')) {
                            ticketData.ticketName = fieldValue;
                        }

                        if (fieldName.includes('Panel Name')) {
                            ticketData.panelName = fieldValue;
                        }

                        if (fieldName.includes('Users in transcript')) {
                            const userMatches = fieldValue.match(/<@!?\d+>/g);
                            if (userMatches) {
                                // حفظ الـ mentions كاملة مع <@> وإزالة التكرار
                                ticketData.users = [...new Set(userMatches)];
                            }
                        }
                    });
                    
                    // البحث عن ملف HTML مرفق
                    if (message.attachments && message.attachments.size > 0) {
                        const htmlAttachment = message.attachments.find(att => 
                            att.name && att.name.endsWith('.html')
                        );
                        
                        if (htmlAttachment) {
                            console.log(`📎 تم العثور على ملف: ${htmlAttachment.name}`);
                            
                            try {
                                // تنظيف اسم الملف
                                const cleanFileName = htmlAttachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                const filePath = path.join(TRANSCRIPTS_FOLDER, cleanFileName);
                                
                                // تحميل الملف
                                console.log('⬇️ جاري تحميل الملف...');
                                await downloadFile(htmlAttachment.url, filePath);
                                console.log(`✅ تم تحميل الملف: ${cleanFileName}`);
                                
                                // حفظ مسار الملف النسبي
                                ticketData.transcriptFile = `transcripts/${cleanFileName}`;
                                
                            } catch (error) {
                                console.error('❌ خطأ في تحميل الملف:', error.message);
                            }
                        }
                    }
                    
                    // التحقق من اكتمال المعلومات
                    if (ticketData.ticketName && ticketData.transcriptFile) {
                        const tickets = loadTickets();
                        tickets.unshift(ticketData);
                        saveTickets(tickets);
                        
                        console.log(`✅ تم حفظ التكت: ${ticketData.ticketName}`);
                        console.log(`📄 الملف: ${ticketData.transcriptFile}`);
                        console.log('---\n');
                    } else {
                        console.log('⚠️ البيانات غير مكتملة - لن يتم الحفظ');
                        if (!ticketData.ticketName) console.log('   - اسم التكت ناقص');
                        if (!ticketData.transcriptFile) console.log('   - ملف الترانسكربت ناقص');
                        console.log('---\n');
                    }
                }
            }
        }
    }
});

// تسجيل الدخول
console.log('🔄 جاري تسجيل الدخول...');
client.login(DISCORD_TOKEN).catch(err => {
    console.error('❌ خطأ في تسجيل الدخول:', err.message);
    process.exit(1);
});
