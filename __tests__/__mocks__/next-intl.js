// Mock for next-intl to avoid ESM issues in tests
function useTranslations(_namespace) {
  return function t(key) {
    // Normalize by stripping known prefixes
    const normalized = key.replace(/^chat\./, '').replace(/^ui\./, '');

    // Special-case for UI close button
    if (normalized === 'close' || normalized === 'Close notification') {
      return 'Close notification';
    }
    // Special-case for input.send
    if (normalized === 'input.send') {
      return 'input.send';
    }
    // Special-case for input.ariaLabel
    if (normalized === 'input.ariaLabel') {
      return 'input.ariaLabel';
    }
    // Special-case for stopGenerating
    if (normalized === 'main.stopGenerating' || normalized === 'stopGenerating') {
      return 'main.stopGenerating';
    }
    // Special-case for newConversation
    if (normalized === 'main.newConversation' || normalized === 'newConversation') {
      return 'main.newConversation';
    }
    // Special-case for toggleSidebar
    if (normalized === 'main.toggleSidebar' || normalized === 'toggleSidebar') {
      return 'main.toggleSidebar';
    }
    return normalized;
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

export { useTranslations, useFormatter, NextIntlClientProvider };
export default nextIntlMock;
