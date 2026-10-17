// The Taffeta Weddings Team App's Google Apps Script web app (apps-script/Weddings.gs), deployed under info@taffetadesign.com.
window.TW_ENDPOINT='https://script.google.com/macros/s/AKfycbze_BgM8UcSG68HIo2sxBvomk4MKsuWkyT3JltEXBWLTQCb4ymJSYaG8OV8Msv2beX2/exec';
// Phone alerts: Firebase project "Taffeta Weddings Alerts" (taffeta-weddings-alerts) on info@. This web config and the
// Web Push public key are public by design; sending alerts needs info@'s own sign-in (done in the Apps Script).
window.TW_FCM={
  config:{apiKey:"AIzaSyAD82Uh-1_ttyRbYHyBOM6T2DDJFzqh08Y",authDomain:"taffeta-weddings-alerts.firebaseapp.com",projectId:"taffeta-weddings-alerts",
    storageBucket:"taffeta-weddings-alerts.firebasestorage.app",messagingSenderId:"806353558918",appId:"1:806353558918:web:1db6d9a96736e698932007"},
  vapidKey:"BPpDOUEeFFPDZBmnNYM4Kr9CLdq3LHuOmCmXYBev5jxigZwTvkG2FvnO2oMoJ_OsQcEkw3TC2GVmgnJVMrFCeB8"
};
// Wedding day add-on payments (Alexandra, Oct 17 2026): the Taffeta Weddings Venmo username and the Stripe payment link
// (card and Apple Pay). Both are public payment pages. Leave one empty to hide its button.
window.TW_PAY={venmo:'',stripe:''};
