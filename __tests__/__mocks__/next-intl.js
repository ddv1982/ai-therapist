// Mock for next-intl to avoid ESM issues in tests
function useTranslations() {
  return function t(key) {
    return key === 'close' ? 'Close notification' : key;
  };
}

function useFormatter() {
  return {
    dateTime: (value) => value,
    number: (value) => value,
    relativeTime: (value) => value,
  };
}

function NextIntlClientProvider({ children }) {
  return children;
}

const nextIntlMock = { useTranslations, useFormatter, NextIntlClientProvider };
export default nextIntlMock;
