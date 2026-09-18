/* =====================================================================
   دالة سحابية لإرسال إشعار فوري للمريض لما النتيجة تترفع (Firebase)
   ---------------------------------------------------------------------
   خطوات التشغيل (مرة واحدة):
   1) في Firebase Console → Project settings (الترس) → Cloud Messaging
      → Web Push certificates → Generate key pair → خد المفتاح وحطه
      في خانة "vapidKey" داخل FIREBASE_CONFIG في ملف index.html
   2) فعّل Blaze Plan (الخطة المجانية كفاية — الدالة مش هتكلف حاجة
      لأن FCM من خدمات جوجل المسموحة)
   3) انسخ الكود تحت في Firebase Console → Functions → Create function
      (أو من جهازك: npm i firebase-admin firebase-functions ثم deploy)
===================================================================== */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// أول ما نتيجة تتكتب/تتعدل في sakr/results/SQ-XXXX
exports.onNewResult = functions.database.ref('sakr/results/{fileNo}').onWrite(async (change, context) => {
  const after = change.after.val();
  if (!after) return null; // النتيجة اتمسحت
  const fileNo = context.params.fileNo;

  // 1) لاقي تليفون المريض من الحجز اللي عليه نفس رقم الملف
  const bkSnap = await admin.database().ref('sakr/bookings').orderByChild('fileNo').equalTo(fileNo).limitToLast(1).once('value');
  let phone = null;
  bkSnap.forEach(s => { phone = s.val().userPhone; });
  if (!phone) return null;

  // 2) لاقي توكن جهاز المريض
  const tokSnap = await admin.database().ref('sakr/tokens').orderByChild('phone').equalTo(phone).once('value');
  const tokens = [];
  tokSnap.forEach(s => { const t = s.val().token; if (t) tokens.push(t); });
  if (!tokens.length) return null;

  // 3) ابعت الإشعار لكل أجهزة المريض
  return admin.messaging().sendAll(tokens.map(t => ({
    token: t,
    notification: {
      title: 'معامل صقر للتحاليل الطبية 🦅',
      body: 'نتيجتك جاهزة! رقم الملف: ' + fileNo
    },
    data: { fileNo: fileNo }
  })));
});
