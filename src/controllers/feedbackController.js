const locales = {
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
};
const SUPPORTED_LANGS = ['en', 'fr'];
const DEFAULT_LANG = 'en';

function pickLanguage(lang) {
  if (SUPPORTED_LANGS.includes(lang)) {
    return lang;
  }
  return DEFAULT_LANG;
}

function showFeedbackForm(req, res) {
  const lang = pickLanguage(req.query.lang);
  const text = locales[lang];
  const today = new Intl.DateTimeFormat(text.locale, { dateStyle: 'full' }).format(new Date());

  const questions = text.questions
    .map(
      (question, index) => `
      <label for="q${index + 1}">${index + 1}. ${question}</label>
      <textarea id="q${index + 1}" name="q${index + 1}" rows="4"></textarea>`
    )
    .join('');

  res.send(`<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${text.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 16px; }
    label { display: block; margin-top: 20px; font-weight: bold; }
    textarea { width: 100%; margin-top: 6px; }
  </style>
</head>
<body>
  <h1>${text.title}</h1>
  <p>${text.dateLabel}: ${today}</p>
  <p>${text.instructions}</p>
  <form>
    ${questions}
  </form>
</body>
</html>`);
}

module.exports = { showFeedbackForm };
