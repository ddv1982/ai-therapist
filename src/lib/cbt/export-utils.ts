import { CBTFormData, type SchemaReflectionData } from '@/types/therapy';

// Export format types
export type CBTExportFormat = 'json' | 'markdown' | 'text';

export interface CBTExportData {
  formData: CBTFormData;
  exportDate: string;
  exportVersion: string;
}

// Localizable strings used across exports
export interface ExportLocaleStrings {
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
  footerNote: string;
  exportedFooter: (date: string) => string;
}

const defaultExportStrings: ExportLocaleStrings = {
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
  footerNote: 'This reflection is a tool for self-awareness and growth. Be patient and compassionate with yourself throughout this process.',
  exportedFooter: (date: string) => `Exported from AI Therapist CBT Diary on ${date}`
};

// File naming utility
export function generateFileName(format: CBTExportFormat, date?: string): string {
  const timestamp = date || new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-').replace(/-/g, '');
  const formatDate = timestamp.slice(0, 8);
  const formatTime = timestamp.slice(8);
  
  return `CBT-Diary-Entry-${formatDate.slice(0, 4)}-${formatDate.slice(4, 6)}-${formatDate.slice(6, 8)}-${formatTime}.${format}`;
}

// Trigger file download
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
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
export function formatEmotionsForExport(emotions: CBTFormData['initialEmotions']): Array<{ name: string; intensity: number }> {
  const formatted = Object.entries(emotions)
    .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      intensity: value as number
    }));
  
  if (emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0) {
    formatted.push({
      name: emotions.other,
      intensity: emotions.otherIntensity
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
        exportVersion: '1.0'
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
export function exportAsMarkdown(formData: CBTFormData, markdownContent?: string, localeStrings?: Partial<ExportLocaleStrings>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // If markdownContent is provided (from chat), use it; otherwise generate from formData
      const strings = { ...defaultExportStrings, ...(localeStrings || {}) };
      const content = markdownContent || generateMarkdownFromFormData(formData, strings);
      const filename = generateFileName('markdown');
      
      downloadFile(content, filename, 'text/markdown');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate markdown from form data (for modal export)
function generateMarkdownFromFormData(formData: CBTFormData, strings: ExportLocaleStrings): string {
  type OptionalReflectionFields = { schemaReflection?: SchemaReflectionData };
  const formWithOptionalReflection = formData as CBTFormData & OptionalReflectionFields;
  type OptionalBehaviorFields = Partial<{ confirmingBehaviors: string; avoidantBehaviors: string; overridingBehaviors: string }>;
  const behaviorPatterns = formData as CBTFormData & OptionalBehaviorFields;
  const formatEmotions = (emotions: typeof formData.initialEmotions) => {
    const formatted = Object.entries(emotions)
      .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
      .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/10`)
      .join('\n');
    
    if (emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0) {
      return formatted + `\n- ${emotions.other}: ${emotions.otherIntensity}/10`;
    }
    
    return formatted;
  };

  const formatThoughts = (thoughts: { thought: string; credibility?: number; confidence?: number }[]) => {
    return thoughts
      .filter(t => t.thought.trim())
      .map(t => {
        const rating = t.credibility ?? t.confidence ?? 0;
        return `- "${t.thought}" *(${rating}/10)*`;
      })
      .join('\n');
  };

  const selectedModes = formData.schemaModes
    .filter(mode => mode.selected)
    .map(mode => `- [x] ${mode.name} *(${mode.description})*`)
    .join('\n');

  const hasReflectionContent = Boolean(
    formWithOptionalReflection.schemaReflection?.enabled && (
      formWithOptionalReflection.schemaReflection.selfAssessment.trim() ||
      formWithOptionalReflection.schemaReflection.questions.some(q => q.answer.trim())
    )
  );

  return `# 🌟 ${strings.diaryTitle} ${hasReflectionContent ? strings.deepReflectionSuffix : ''}

**${strings.dateLabel}** ${formData.date}
**${strings.exportDateLabel}** ${new Date().toLocaleDateString()}

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
- **${strings.confirmingBehaviors}** ${behaviorPatterns.confirmingBehaviors || '[Not specified]'}
- **${strings.avoidantBehaviors}** ${behaviorPatterns.avoidantBehaviors || '[Not specified]'}  
- **${strings.overridingBehaviors}** ${behaviorPatterns.overridingBehaviors || '[Not specified]'}

### ${strings.activeSchemaModesTitle}
${selectedModes || strings.noSchemaModes}

${hasReflectionContent ? `
---

## 🔍 ${strings.schemaReflectionTitle}

${formWithOptionalReflection.schemaReflection?.selfAssessment ? `### ${strings.personalAssessmentTitle}
"${formWithOptionalReflection.schemaReflection.selfAssessment}"

` : ''}${formWithOptionalReflection.schemaReflection && formWithOptionalReflection.schemaReflection.questions.filter(q => q.answer.trim()).length > 0 ? `### ${strings.reflectionQuestionsTitle}
${formWithOptionalReflection.schemaReflection.questions
  .filter(q => q.answer.trim())
  .map(q => `**${q.category.toUpperCase()}:** ${q.question}
*${strings.responseLabel}* ${q.answer}`)
  .join('\n\n')}` : ''}
` : ''}

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

**${strings.exportedFooter(new Date().toLocaleDateString())}**`;
}

// Text Export (plain text version)
export function exportAsText(formData: CBTFormData, localeStrings?: Partial<ExportLocaleStrings>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const s = { ...defaultExportStrings, ...(localeStrings || {}) };
      const initialEmotions = formatEmotionsForExport(formData.initialEmotions);
      const finalEmotions = formatEmotionsForExport(formData.finalEmotions);
      const validThoughts = formData.automaticThoughts.filter(t => t.thought.trim());
      const rationalThoughts = formData.rationalThoughts.filter(t => t.thought.trim());
      const selectedModes = formData.schemaModes.filter(mode => mode.selected);
      type OptionalBehaviorFields = Partial<{ confirmingBehaviors: string; avoidantBehaviors: string; overridingBehaviors: string }>;
      const behaviorPatterns = formData as CBTFormData & OptionalBehaviorFields;
      type OptionalReflectionFields = { schemaReflection?: SchemaReflectionData };
      const formWithOptionalReflection = formData as CBTFormData & OptionalReflectionFields;
      
      const textContent = `${s.diaryTitle.toUpperCase()}
${'='.repeat(50)}

${s.dateLabel} ${formData.date}
${s.exportDateLabel} ${new Date().toLocaleDateString()}

${s.situationTitle.toUpperCase()}
${'-'.repeat(20)}
${formData.situation || s.noSituation}

${s.initialEmotionsTitle.toUpperCase()} (1-10)
${'-'.repeat(20)}
${initialEmotions.map(e => `${e.name}: ${e.intensity}/10`).join('\n') || s.noEmotions}

${s.automaticThoughtsTitle.toUpperCase()} (with ${s.credibilityLabel.toLowerCase()} 1-10)
${'-'.repeat(20)}
${validThoughts.map(t => `"${t.thought}" (${t.credibility}/10)`).join('\n') || s.noThoughts}

${s.coreBeliefLabel.toUpperCase()} (${formData.coreBeliefCredibility}/10 ${s.credibilityLabel.toLowerCase()})
${'-'.repeat(20)}
${formData.coreBeliefText || s.noCoreBelief}

${s.behavioralPatternsTitle.toUpperCase()}
${'-'.repeat(20)}
${s.confirmingBehaviors} ${behaviorPatterns.confirmingBehaviors || '[Not specified]'}
${s.avoidantBehaviors} ${behaviorPatterns.avoidantBehaviors || '[Not specified]'}
${s.overridingBehaviors} ${behaviorPatterns.overridingBehaviors || '[Not specified]'}

${s.activeSchemaModesTitle.toUpperCase()}
${'-'.repeat(20)}
${selectedModes.map(mode => `${mode.name} (${mode.description})`).join('\n') || s.noSchemaModes}

${(formWithOptionalReflection.schemaReflection?.enabled && (formWithOptionalReflection.schemaReflection.selfAssessment.trim() || formWithOptionalReflection.schemaReflection.questions.some(q => q.answer.trim()))) ? `
${s.schemaReflectionTitle.toUpperCase()}
${'-'.repeat(20)}
${formWithOptionalReflection.schemaReflection?.selfAssessment ? `${s.personalAssessmentTitle}: ${formWithOptionalReflection.schemaReflection.selfAssessment}

` : ''}${formWithOptionalReflection.schemaReflection ? formWithOptionalReflection.schemaReflection.questions.filter(q => q.answer.trim()).map(q => `${q.category.toUpperCase()}: ${q.question}
${s.responseLabel} ${q.answer}`).join('\n\n') : ''}
` : ''}

${s.rationalThoughtsTitle.toUpperCase()} (with confidence 1-10)
${'-'.repeat(20)}
${rationalThoughts.map(t => `"${t.thought}" (${t.confidence}/10)`).join('\n') || s.noRationalThoughts}

${s.updatedEmotionsTitle.toUpperCase()} (1-10)
${'-'.repeat(20)}
${finalEmotions.map(e => `${e.name}: ${e.intensity}/10`).join('\n') || s.noEmotions}

${s.originalThoughtCredibilityLabel} ${formData.originalThoughtCredibility}/10

${s.newBehaviorsTitle.toUpperCase()}
${'-'.repeat(20)}
${formData.newBehaviors || s.noNewBehaviors}

${'='.repeat(50)}
${s.footerNote}

${s.exportedFooter(new Date().toLocaleDateString())}`;

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