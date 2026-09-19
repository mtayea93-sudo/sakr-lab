/* =====================================================================
   إشعارات فورية لمعامل صقر (تشتغل والموقع مقفول تماماً) — Firebase Cloud Functions
   ---------------------------------------------------------------------
   المحتوى: 3 مراقبين — حجز جديد (للمشرف) + اعتماد طلب (للعميل) + نتيجة جديدة (للعميل)

   الخطوات (مرة واحدة على الكمبيوتر):
   [1] توليد مفتاح VAPID:
       Firebase Console → Project settings (الترس جنب Project Overview)
       → تبويب Cloud Messaging → انزل لـ "Web Push certificates"
       → Generate key pair → انسخ المفتاح
       → الصقه في ملف index.html في FIREBASE_CONFIG مكان: vapidKey:"هنا"
       (أو ابعتهولي وأنا أركبه في الملف الجاهز)
   [2] تفعيل خطة Blaze (مجانية عملياً — فعّل Billing Alert من Budgets عشان تطمّن)
   [3] نشر الدوال:
       1) نزّل Node.js من nodejs.org (LTS)
       2) افتح Terminal/CMD ونفّذ:
          npm install -g firebase-tools
          mkdir sakr-push && cd sakr-push
          firebase login
          firebase init functions
          → اختار المشروع sakrlab2026 → JavaScript → Don't overwrite
       3) افتح ملف functions/index.js وامسح محتواه والصق الكود اللي تحت ده
       4) نفّذ: firebase deploy --only functions
   [4] كل عميل/موظف يضغط "⚡ فعّل الإشعارات الفورية" مرة واحدة من الجرس — وخلاص
===================================================================== */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const SUPERVISOR = '01060651837'; // رقم المشرف — إشعارات الحجوزات الجديدة

async function sendToPhone(phone, title, body) {
  const snap = await admin.database().ref('sakr/tokens')
    .orderByChild('phone').equalTo(phone).once('value');
  const tokens = [];
  snap.forEach(s => { const t = s.val().token; if (t) tokens.push(t); });
  if (!tokens.length) return null;
  return admin.messaging().sendAll(tokens.map(t => ({
    token: t,
    notification: { title: title, body: body }
  })));
}

// 1) حجز جديد → إشعار فوري للمشرف
exports.onNewBooking = functions.database.ref('sakr/bookings/{id}').onCreate(async (snap) => {
  const b = snap.val();
  if (!b) return null;
  return sendToPhone(SUPERVISOR, 'معامل صقر 🦅',
    'طلب حجز جديد من ' + (b.name || '') + ' بتاريخ ' + (b.date || ''));
});

// 2) اعتماد طلب → إشعار للعميل برقم ملفه
exports.onBookingApproved = functions.database.ref('sakr/bookings/{id}').onUpdate(async (change) => {
  const before = change.before.val();
  const after = change.after.val();
  if (!after || !before || before.status === 'approved' || after.status !== 'approved') return null;
  return sendToPhone(after.userPhone, 'معامل صقر 🦅',
    'تم اعتماد طلبك ✅ رقم ملفك: ' + (after.fileNo || ''));
});

// 3) نتيجة جديدة → إشعار للعميل
exports.onNewResult = functions.database.ref('sakr/results/{fileNo}').onWrite(async (change, context) => {
  if (!change.after.val()) return null;
  const fileNo = context.params.fileNo;
  const bk = await admin.database().ref('sakr/bookings')
    .orderByChild('fileNo').equalTo(fileNo).limitToLast(1).once('value');
  let phone = null;
  bk.forEach(s => { phone = s.val().userPhone; });
  if (!phone) return null;
  return sendToPhone(phone, 'معامل صقر 🦅', 'نتيجتك جاهزة 📄 رقم الملف: ' + fileNo);
});
