import { CBTFormData, type SchemaReflectionData } from '@/types';
import { localizeSchemaMode, type SupportedLocale } from '@/lib/cbt/schema-mode-localization';

// Export format types
export type CBTExportFormat = 'json' | 'markdown' | 'text';

export interface CBTExportData {
  formData: CBTFormData;
  exportDate: string;
  exportVersion: string;
}

// Localizable strings used across exports
export interface ExportLocaleStrings {
  locale?: SupportedLocale;
  diaryTitle: string;
  deepReflectionSuffix: string;
  dateLabel: string;
  exportDateLabel: string;
  situationTitle: string;
  noSituation: string;
  initialEmotionsTitle: string;
  emotionsSubtitle: string;
  noEmotions: string;
  automaticThoughtsTitle: string;
  automaticThoughtsSubtitle: string;
  noThoughts: string;
  coreSchemaTitle: string;
  credibilityLabel: string;
  coreBeliefLabel: string;
  noCoreBelief: string;
  behavioralPatternsTitle: string;
  confirmingBehaviors: string;
  avoidantBehaviors: string;
  overridingBehaviors: string;
  activeSchemaModesTitle: string;
  noSchemaModes: string;
  schemaReflectionTitle: string;
  personalAssessmentTitle: string;
  reflectionQuestionsTitle: string;
  responseLabel: string;
  rationalThoughtsTitle: string;
  rationalSubtitle: string;
  noRationalThoughts: string;
  finalReflectionTitle: string;
  updatedEmotionsTitle: string;
  originalThoughtCredibilityLabel: string;
  newBehaviorsTitle: string;
  noNewBehaviors: string;
  notSpecifiedLabel: string;
  footerNote: string;
  exportedFooter: (date: string) => string;
}

const defaultExportStrings: ExportLocaleStrings = {
  locale: 'en',
  diaryTitle: 'CBT Diary Entry',
  deepReflectionSuffix: 'with Deep Reflection',
  dateLabel: 'Date:',
  exportDateLabel: 'Export Date:',
  situationTitle: 'Situation Context',
  noSituation: '[No situation described]',
  initialEmotionsTitle: 'Initial Emotions',
  emotionsSubtitle: 'Emotional intensity ratings (1-10)',
  noEmotions: '[No emotions rated]',
  automaticThoughtsTitle: 'Automatic Thoughts',
  automaticThoughtsSubtitle: 'Cognitive patterns and credibility ratings (1-10)',
  noThoughts: '[No thoughts entered]',
  coreSchemaTitle: 'Core Schema Analysis',
  credibilityLabel: 'Credibility',
  coreBeliefLabel: 'Core Belief',
  noCoreBelief: '[No core belief identified]',
  behavioralPatternsTitle: 'Behavioral Patterns',
  confirmingBehaviors: 'Confirming behaviors:',
  avoidantBehaviors: 'Avoidant behaviors:',
  overridingBehaviors: 'Overriding behaviors:',
  activeSchemaModesTitle: 'Active Schema Modes',
  noSchemaModes: '[No schema modes selected]',
  schemaReflectionTitle: 'Schema Reflection Insights',
  personalAssessmentTitle: 'Personal Assessment',
  reflectionQuestionsTitle: 'Reflection Questions',
  responseLabel: 'Response:',
  rationalThoughtsTitle: 'Rational Thoughts',
  rationalSubtitle: 'Confidence ratings (1-10)',
  noRationalThoughts: '[No rational thoughts developed]',
  finalReflectionTitle: 'Final Reflection',
  updatedEmotionsTitle: 'Updated Emotions',
  originalThoughtCredibilityLabel: 'Original Thought Credibility:',
  newBehaviorsTitle: 'New Behaviors',
  noNewBehaviors: '[No new behaviors identified]',
  notSpecifiedLabel: '[Not specified]',
  footerNote:
    'This reflection is a tool for self-awareness and growth. Be patient and compassionate with yourself throughout this process.',
  exportedFooter: (date: string) => `Exported from AI Therapist CBT Diary on ${date}`,
};

const nlExportStrings: ExportLocaleStrings = {
  locale: 'nl',
  diaryTitle: 'CGT-dagboeknotitie',
  deepReflectionSuffix: 'met diepte-reflectie',
  dateLabel: 'Datum:',
  exportDateLabel: 'Exportdatum:',
  situationTitle: 'Situatiecontext',
  noSituation: '[Geen situatie beschreven]',
  initialEmotionsTitle: 'Beginemoties',
  emotionsSubtitle: 'Emotionele intensiteit (1-10)',
  noEmotions: '[Geen emoties beoordeeld]',
  automaticThoughtsTitle: 'Automatische gedachten',
  automaticThoughtsSubtitle: 'Denkpatronen en geloofwaardigheid (1-10)',
  noThoughts: '[Geen gedachten ingevuld]',
  coreSchemaTitle: 'Kernopvatting',
  credibilityLabel: 'Geloofwaardigheid',
  coreBeliefLabel: 'Kernopvatting',
  noCoreBelief: '[Geen kernopvatting geïdentificeerd]',
  behavioralPatternsTitle: 'Gedragspatronen',
  confirmingBehaviors: 'Bevestigend gedrag:',
  avoidantBehaviors: 'Vermijdend gedrag:',
  overridingBehaviors: 'Compensatiegedrag:',
  activeSchemaModesTitle: 'Actieve schema-modi',
  noSchemaModes: '[Geen schema-modi geselecteerd]',
  schemaReflectionTitle: 'Schema-reflectie inzichten',
  personalAssessmentTitle: 'Persoonlijke beoordeling',
  reflectionQuestionsTitle: 'Reflectievragen',
  responseLabel: 'Antwoord:',
  rationalThoughtsTitle: 'Rationele gedachten',
  rationalSubtitle: 'Vertrouwen (1-10)',
  noRationalThoughts: '[Geen rationele gedachten ontwikkeld]',
  finalReflectionTitle: 'Eindreflectie',
  updatedEmotionsTitle: 'Bijgewerkte emoties',
  originalThoughtCredibilityLabel: 'Geloofwaardigheid oorspronkelijke gedachte:',
  newBehaviorsTitle: 'Nieuwe gedragingen',
  noNewBehaviors: '[Geen nieuwe gedragingen geïdentificeerd]',
  notSpecifiedLabel: '[Niet gespecificeerd]',
  footerNote:
    'Deze reflectie is een hulpmiddel voor zelfinzicht en groei. Wees geduldig en mild voor jezelf tijdens dit proces.',
  exportedFooter: (date: string) => `Geëxporteerd uit AI Therapist CGT-dagboek op ${date}`,
};

const EMOTION_LABELS_NL: Record<string, string> = {
  fear: 'Angst',
  anger: 'Boosheid',
  sadness: 'Verdriet',
  joy: 'Blijdschap',
  anxiety: 'Onrust',
  shame: 'Schaamte',
  guilt: 'Schuld',
};

function resolveLocale(strings: ExportLocaleStrings): SupportedLocale {
  return strings.locale ?? 'en';
}

function getLocaleDateLabel(locale: SupportedLocale): string {
  return locale === 'nl' ? 'nl-NL' : 'en-US';
}

function getEmotionLabel(key: string, locale: SupportedLocale): string {
  if (locale === 'nl') {
    return EMOTION_LABELS_NL[key] ?? key;
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function getExportLocaleStrings(locale: SupportedLocale): ExportLocaleStrings {
  return locale === 'nl' ? nlExportStrings : defaultExportStrings;
}

// File naming utility
export function generateFileName(format: CBTExportFormat, date?: string): string {
  const timestamp =
    date || new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-').replace(/-/g, '');
  const formatDate = timestamp.slice(0, 8);
  const formatTime = timestamp.slice(8);

  return `CBT-Diary-Entry-${formatDate.slice(0, 4)}-${formatDate.slice(4, 6)}-${formatDate.slice(6, 8)}-${formatTime}.${format}`;
}

// Trigger file download
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Format emotions for display
export function formatEmotionsForExport(
  emotions: CBTFormData['initialEmotions'],
  locale: SupportedLocale = 'en'
): Array<{ name: string; intensity: number }> {
  const formatted = Object.entries(emotions)
    .filter(
      ([key, value]) =>
        key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
    )
    .map(([key, value]) => ({
      name: getEmotionLabel(key, locale),
      intensity: value as number,
    }));

  if (emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0) {
    formatted.push({
      name: emotions.other,
      intensity: emotions.otherIntensity,
    });
  }

  return formatted;
}

// JSON Export
export function exportAsJSON(formData: CBTFormData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const exportData: CBTExportData = {
        formData,
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = generateFileName('json');

      downloadFile(jsonString, filename, 'application/json');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Markdown Export
export function exportAsMarkdown(
  formData: CBTFormData,
  markdownContent?: string,
  localeStrings?: Partial<ExportLocaleStrings>
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // If markdownContent is provided (from chat), use it; otherwise generate from formData
      const strings = { ...defaultExportStrings, ...(localeStrings || {}) };
      const locale = resolveLocale(strings);
      const content = markdownContent || generateMarkdownFromFormData(formData, strings, locale);
      const filename = generateFileName('markdown');

      downloadFile(content, filename, 'text/markdown');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate markdown from form data (for modal export)
function generateMarkdownFromFormData(
  formData: CBTFormData,
  strings: ExportLocaleStrings,
  locale: SupportedLocale
): string {
  type OptionalReflectionFields = { schemaReflection?: SchemaReflectionData };
  const formWithOptionalReflection = formData as CBTFormData & OptionalReflectionFields;
  type OptionalBehaviorFields = Partial<{
    confirmingBehaviors: string;
    avoidantBehaviors: string;
    overridingBehaviors: string;
  }>;
  const behaviorPatterns = formData as CBTFormData & OptionalBehaviorFields;
  const formatEmotions = (emotions: typeof formData.initialEmotions) => {
    const formatted = Object.entries(emotions)
      .filter(
        ([key, value]) =>
          key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
      )
      .map(([key, value]) => `- ${getEmotionLabel(key, locale)}: ${value}/10`)
      .join('\n');

    if (emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0) {
      return formatted + `\n- ${emotions.other}: ${emotions.otherIntensity}/10`;
    }

    return formatted;
  };

  const formatThoughts = (
    thoughts: { thought: string; credibility?: number; confidence?: number }[]
  ) => {
    return thoughts
      .filter((t) => t.thought.trim())
      .map((t) => {
        const rating = t.credibility ?? t.confidence ?? 0;
        return `- "${t.thought}" *(${rating}/10)*`;
      })
      .join('\n');
  };

  const selectedModes = formData.schemaModes
    .filter((mode) => mode.selected)
    .map((mode) => {
      const localized = localizeSchemaMode(mode, locale, 'ui');
      const name = localized.name ?? mode.name;
      const description = localized.description ?? mode.description ?? '';
      return `- [x] ${name} *(${description})*`;
    })
    .join('\n');

  const hasReflectionContent = Boolean(
    formWithOptionalReflection.schemaReflection?.enabled &&
    (formWithOptionalReflection.schemaReflection.selfAssessment.trim() ||
      formWithOptionalReflection.schemaReflection.questions.some((q) => q.answer.trim()))
  );

  return `# 🌟 ${strings.diaryTitle} ${hasReflectionContent ? strings.deepReflectionSuffix : ''}

**${strings.dateLabel}** ${formData.date}
**${strings.exportDateLabel}** ${new Date().toLocaleDateString(getLocaleDateLabel(locale))}

---

## 📍 ${strings.situationTitle}
${formData.situation || strings.noSituation}

---

## 💭 ${strings.initialEmotionsTitle}
*${strings.emotionsSubtitle}*

${formatEmotions(formData.initialEmotions) || strings.noEmotions}

---

## 🧠 ${strings.automaticThoughtsTitle}
*${strings.automaticThoughtsSubtitle}*

${formatThoughts(formData.automaticThoughts) || strings.noThoughts}

---

## 🎯 ${strings.coreSchemaTitle}
*${strings.credibilityLabel} ${formData.coreBeliefCredibility}/10*

**${strings.coreBeliefLabel}** ${formData.coreBeliefText || strings.noCoreBelief}

### ${strings.behavioralPatternsTitle}
- **${strings.confirmingBehaviors}** ${behaviorPatterns.confirmingBehaviors || strings.notSpecifiedLabel}
- **${strings.avoidantBehaviors}** ${behaviorPatterns.avoidantBehaviors || strings.notSpecifiedLabel}  
- **${strings.overridingBehaviors}** ${behaviorPatterns.overridingBehaviors || strings.notSpecifiedLabel}

### ${strings.activeSchemaModesTitle}
${selectedModes || strings.noSchemaModes}

${
  hasReflectionContent
    ? `
---

## 🔍 ${strings.schemaReflectionTitle}

${
  formWithOptionalReflection.schemaReflection?.selfAssessment
    ? `### ${strings.personalAssessmentTitle}
"${formWithOptionalReflection.schemaReflection.selfAssessment}"

`
    : ''
}${
        formWithOptionalReflection.schemaReflection &&
        formWithOptionalReflection.schemaReflection.questions.filter((q) => q.answer.trim())
          .length > 0
          ? `### ${strings.reflectionQuestionsTitle}
${formWithOptionalReflection.schemaReflection.questions
  .filter((q) => q.answer.trim())
  .map(
    (q) => `**${q.category.toUpperCase()}:** ${q.question}
*${strings.responseLabel}* ${q.answer}`
  )
  .join('\n\n')}`
          : ''
      }
`
    : ''
}

---

## 🔄 ${strings.rationalThoughtsTitle}
*${strings.rationalSubtitle}*

${formatThoughts(formData.rationalThoughts) || strings.noRationalThoughts}

---

## ✨ ${strings.finalReflectionTitle}

### ${strings.updatedEmotionsTitle}
${formatEmotions(formData.finalEmotions) || strings.noEmotions}

**${strings.originalThoughtCredibilityLabel}** ${formData.originalThoughtCredibility}/10

### ${strings.newBehaviorsTitle}
${formData.newBehaviors || strings.noNewBehaviors}

---

*${strings.footerNote}*

**${strings.exportedFooter(new Date().toLocaleDateString(getLocaleDateLabel(locale)))}**`;
}

// Text Export (plain text version)
export function exportAsText(
  formData: CBTFormData,
  localeStrings?: Partial<ExportLocaleStrings>
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const s = { ...defaultExportStrings, ...(localeStrings || {}) };
      const locale = resolveLocale(s);
      const initialEmotions = formatEmotionsForExport(formData.initialEmotions, locale);
      const finalEmotions = formatEmotionsForExport(formData.finalEmotions, locale);
      const validThoughts = formData.automaticThoughts.filter((t) => t.thought.trim());
      const rationalThoughts = formData.rationalThoughts.filter((t) => t.thought.trim());
      const selectedModes = formData.schemaModes
        .filter((mode) => mode.selected)
        .map((mode) => {
          const localized = localizeSchemaMode(mode, locale, 'ui');
          return {
            name: localized.name ?? mode.name,
            description: localized.description ?? mode.description ?? '',
          };
        });
      type OptionalBehaviorFields = Partial<{
        confirmingBehaviors: string;
        avoidantBehaviors: string;
        overridingBehaviors: string;
      }>;
      const behaviorPatterns = formData as CBTFormData & OptionalBehaviorFields;
      type OptionalReflectionFields = { schemaReflection?: SchemaReflectionData };
      const formWithOptionalReflection = formData as CBTFormData & OptionalReflectionFields;

      const textContent = `${s.diaryTitle.toUpperCase()}
${'='.repeat(50)}

${s.dateLabel} ${formData.date}
${s.exportDateLabel} ${new Date().toLocaleDateString(getLocaleDateLabel(locale))}

${s.situationTitle.toUpperCase()}
${'-'.repeat(20)}
${formData.situation || s.noSituation}

${s.initialEmotionsTitle.toUpperCase()} (1-10)
${'-'.repeat(20)}
${initialEmotions.map((e) => `${e.name}: ${e.intensity}/10`).join('\n') || s.noEmotions}

${s.automaticThoughtsTitle.toUpperCase()} (with ${s.credibilityLabel.toLowerCase()} 1-10)
${'-'.repeat(20)}
${validThoughts.map((t) => `"${t.thought}" (${t.credibility}/10)`).join('\n') || s.noThoughts}

${s.coreBeliefLabel.toUpperCase()} (${formData.coreBeliefCredibility}/10 ${s.credibilityLabel.toLowerCase()})
${'-'.repeat(20)}
${formData.coreBeliefText || s.noCoreBelief}

${s.behavioralPatternsTitle.toUpperCase()}
${'-'.repeat(20)}
${s.confirmingBehaviors} ${behaviorPatterns.confirmingBehaviors || s.notSpecifiedLabel}
${s.avoidantBehaviors} ${behaviorPatterns.avoidantBehaviors || s.notSpecifiedLabel}
${s.overridingBehaviors} ${behaviorPatterns.overridingBehaviors || s.notSpecifiedLabel}

${s.activeSchemaModesTitle.toUpperCase()}
${'-'.repeat(20)}
${selectedModes.map((mode) => `${mode.name} (${mode.description})`).join('\n') || s.noSchemaModes}

${
  formWithOptionalReflection.schemaReflection?.enabled &&
  (formWithOptionalReflection.schemaReflection.selfAssessment.trim() ||
    formWithOptionalReflection.schemaReflection.questions.some((q) => q.answer.trim()))
    ? `
${s.schemaReflectionTitle.toUpperCase()}
${'-'.repeat(20)}
${
  formWithOptionalReflection.schemaReflection?.selfAssessment
    ? `${s.personalAssessmentTitle}: ${formWithOptionalReflection.schemaReflection.selfAssessment}

`
    : ''
}${
        formWithOptionalReflection.schemaReflection
          ? formWithOptionalReflection.schemaReflection.questions
              .filter((q) => q.answer.trim())
              .map(
                (q) => `${q.category.toUpperCase()}: ${q.question}
${s.responseLabel} ${q.answer}`
              )
              .join('\n\n')
          : ''
      }
`
    : ''
}

${s.rationalThoughtsTitle.toUpperCase()} (${s.rationalSubtitle.toLowerCase()})
${'-'.repeat(20)}
${rationalThoughts.map((t) => `"${t.thought}" (${t.confidence}/10)`).join('\n') || s.noRationalThoughts}

${s.updatedEmotionsTitle.toUpperCase()} (1-10)
${'-'.repeat(20)}
${finalEmotions.map((e) => `${e.name}: ${e.intensity}/10`).join('\n') || s.noEmotions}

${s.originalThoughtCredibilityLabel} ${formData.originalThoughtCredibility}/10

${s.newBehaviorsTitle.toUpperCase()}
${'-'.repeat(20)}
${formData.newBehaviors || s.noNewBehaviors}

${'='.repeat(50)}
${s.footerNote}

${s.exportedFooter(new Date().toLocaleDateString(getLocaleDateLabel(locale)))}`;

      const filename = generateFileName('text');
      downloadFile(textContent, filename, 'text/plain');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// PDF Export

// Main export function that handles all formats
export async function exportCBTDiary(
  format: CBTExportFormat,
  formData: CBTFormData,
  markdownContent?: string,
  localeStrings?: Partial<ExportLocaleStrings>
): Promise<void> {
  switch (format) {
    case 'json':
      return exportAsJSON(formData);
    case 'markdown':
      return exportAsMarkdown(formData, markdownContent, localeStrings);
    case 'text':
      return exportAsText(formData, localeStrings);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
