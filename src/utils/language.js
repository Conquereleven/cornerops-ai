const env = require('../config/env');

const englishTerms = /\b(the|is|are|do|does|have|need|want|order|price|product|business|restaurant|store|wholesale|delivery|help|where|when|quote)\b/i;
const spanishTerms = /\b(el|la|los|las|es|son|tienen|necesito|quiero|orden|precio|producto|negocio|restaurante|tienda|mayoreo|entrega|ayuda|donde|cuando|cotizacion)\b/i;

const detectLanguage = (message = '') => {
  const englishMatches = String(message).match(new RegExp(englishTerms, 'gi')) || [];
  const spanishMatches = String(message).match(new RegExp(spanishTerms, 'gi')) || [];
  if (englishMatches.length === spanishMatches.length) {
    return env.aiDefaultLanguage;
  }
  return englishMatches.length > spanishMatches.length ? 'en' : 'es';
};

module.exports = { detectLanguage };
