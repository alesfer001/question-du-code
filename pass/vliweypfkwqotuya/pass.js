// Page pass : 40 questions gratuites + 74 payantes, dans une progression séparée du mode gratuit.
// Le moteur est app.js (partagé avec index.html). Ce fichier ne fait que le réglage et la liste.
window.QC_CONFIG = {
  storeKey: "questduCode.pass.v1",
  signsBase: "../../signs/",
  examMark: false,
  showCta: false
};
window.QUESTIONS = (window.QUESTIONS || []).concat(window.QUESTIONS_PAID || []);
