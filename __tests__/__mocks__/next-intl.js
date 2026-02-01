// Mock for next-intl to avoid ESM issues in tests while still providing sensible translations
const defaultMessages = require('../../src/i18n/messages/en.json');

function resolveMessage(namespace, key) {
  const fullKey = namespace ? `${namespace}.${key}` : key;
  if (Object.prototype.hasOwnProperty.call(defaultMessages, fullKey)) {
    return defaultMessages[fullKey];
  }

  const segments = fullKey.split('.');
  return segments.reduce(
    (acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined),
    defaultMessages
  );
}

function interpolate(message, values = {}) {
  if (typeof message !== 'string') return message;
  return message.replace(/\{(\w+)\}/g, (_, token) => values[token] ?? `{${token}}`);
}

function useTranslations(namespace) {
  const translate = (key, values) => {
    const message = resolveMessage(namespace, key);
    if (message === undefined) {
      if (values && Object.keys(values).length > 0) {
        const fallbackTemplate = namespace ? `${namespace}.${key}` : key;
        return interpolate(fallbackTemplate, values);
      }
      return undefined;
    }

    if (Array.isArray(message) || typeof message === 'object') {
      return message;
    }

    return interpolate(message, values);
  };

  translate.raw = (key) => resolveMessage(namespace, key);
  translate.rich = translate;

  return translate;
}

function useFormatter() {
  return {
    dateTime: (value) => value,
    number: (value) => value,
    relativeTime: (value) => value,
  };
}

function useLocale() {
  return 'en';
}

function NextIntlClientProvider({ children }) {
  return children;
}

// Mock for defineRouting from next-intl/routing
function defineRouting(config) {
  return config;
}

const nextIntlMock = {
  useTranslations,
  useFormatter,
  useLocale,
  NextIntlClientProvider,
  defineRouting,
};

module.exports = nextIntlMock;
module.exports.useTranslations = useTranslations;
module.exports.useFormatter = useFormatter;
module.exports.useLocale = useLocale;
module.exports.NextIntlClientProvider = NextIntlClientProvider;
module.exports.defineRouting = defineRouting;
