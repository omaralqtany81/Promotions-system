const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// إعدادات البوت
const DISCORD_TOKEN = 'MTQ4MDM4MTk1MTM1MjUwNDM3MQ.GJ__Em.n7LJpc8dczJRsesMJiNgJBiWk4pZI-NnwHap9c';
const LOGGING_CHANNEL_ID = '1471230207267438795';
const TICKETS_FILE = path.join(__dirname, '../tickets.js');
const TRANSCRIPTS_FOLDER = path.join(__dirname, '../transcripts');

// إعدادات GitHub
const GITHUB_TOKEN = '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';
const GITHUB_OWNER = 'Wano-Mc';
const GITHUB_REPO = 'Promotions-system';
const GITHUB_FILE_PATH = 'tickets.js';

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
        // استخراج البيانات من window.ticketsData
        const match = data.match(/window\.ticketsData\s*=\s*(\[[\s\S]*\]);/);
        if (match) {
            return JSON.parse(match[1]);
        }
    }
    return [];
}

// حفظ التكتات
function saveTickets(tickets) {
    const jsContent = `// بيانات التكتات\nwindow.ticketsData = ${JSON.stringify(tickets, null, 2)};\n`;
    fs.writeFileSync(TICKETS_FILE, jsContent, 'utf8');
    console.log('✅ تم حفظ التكت في tickets.js');
    
    // رفع على GitHub
    uploadToGitHub(jsContent);
}

// رفع الملف على GitHub
async function uploadToGitHub(content) {
    try {
        console.log('📤 جاري رفع tickets.js على GitHub...');
        
        // جلب SHA الحالي للملف
        const getCurrentSHA = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    hostname: 'api.github.com',
                    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'User-Agent': 'Ticket-Bot',
                        'Accept': 'application/vnd.github.v3+json'
                    }
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            const json = JSON.parse(data);
                            resolve(json.sha);
                        } else {
                            resolve(null);
                        }
                    });
                });
                
                req.on('error', reject);
                req.end();
            });
        };
        
        const sha = await getCurrentSHA();
        
        // رفع الملف
        const uploadFile = (sha) => {
            return new Promise((resolve, reject) => {
                const base64Content = Buffer.from(content).toString('base64');
                const payload = JSON.stringify({
                    message: 'Update tickets.js - New ticket added',
                    content: base64Content,
                    sha: sha
                });
                
                const options = {
                    hostname: 'api.github.com',
                    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'User-Agent': 'Ticket-Bot',
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    }
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            resolve(true);
                        } else {
                            reject(new Error(`GitHub API Error: ${res.statusCode} - ${data}`));
                        }
                    });
                });
                
                req.on('error', reject);
                req.write(payload);
                req.end();
            });
        };
        
        await uploadFile(sha);
        console.log('✅ تم رفع tickets.js على GitHub بنجاح!');
        console.log('🌐 الموقع سيتحدث تلقائياً خلال دقيقة!');
        
    } catch (error) {
        console.error('❌ خطأ في رفع الملف على GitHub:', error.message);
    }
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
    // قبول رسائل البوتات في روم الـ Logging فقط
    if (message.channel.id === LOGGING_CHANNEL_ID && message.author.bot) {
        console.log('📬 رسالة جديدة من بوت في روم الـ Logging!');
        console.log('📝 اسم البوت:', message.author.username);
            
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
});

// تسجيل الدخول
console.log('🔄 جاري تسجيل الدخول...');
client.login(DISCORD_TOKEN).catch(err => {
    console.error('❌ خطأ في تسجيل الدخول:', err.message);
    process.exit(1);
});
