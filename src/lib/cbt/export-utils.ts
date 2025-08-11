import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CBTDiaryFormData } from '@/types/therapy';

// Export format types
export type CBTExportFormat = 'pdf' | 'json' | 'markdown' | 'text';

export interface CBTExportData {
  formData: CBTDiaryFormData;
  exportDate: string;
  exportVersion: string;
}

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
export function formatEmotionsForExport(emotions: CBTDiaryFormData['initialEmotions']): Array<{ name: string; intensity: number }> {
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
export function exportAsJSON(formData: CBTDiaryFormData): Promise<void> {
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
export function exportAsMarkdown(formData: CBTDiaryFormData, markdownContent?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // If markdownContent is provided (from chat), use it; otherwise generate from formData
      const content = markdownContent || generateMarkdownFromFormData(formData);
      const filename = generateFileName('markdown');
      
      downloadFile(content, filename, 'text/markdown');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate markdown from form data (for modal export)
function generateMarkdownFromFormData(formData: CBTDiaryFormData): string {
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

  const hasReflectionContent = formData.schemaReflection.enabled && (
    formData.schemaReflection.selfAssessment.trim() ||
    formData.schemaReflection.questions.some(q => q.answer.trim())
  );

  return `# 🌟 CBT Diary Entry ${hasReflectionContent ? 'with Deep Reflection' : ''}

**Date:** ${formData.date}
**Export Date:** ${new Date().toLocaleDateString()}

---

## 📍 Situation Context
${formData.situation || '[No situation described]'}

---

## 💭 Initial Emotions
*Emotional intensity ratings (1-10)*

${formatEmotions(formData.initialEmotions) || '[No emotions rated]'}

---

## 🧠 Automatic Thoughts
*Cognitive patterns and credibility ratings (1-10)*

${formatThoughts(formData.automaticThoughts) || '[No thoughts entered]'}

---

## 🎯 Core Schema Analysis
*Credibility: ${formData.coreBeliefCredibility}/10*

**Core Belief:** ${formData.coreBeliefText || '[No core belief identified]'}

### Behavioral Patterns
- **Confirming behaviors:** ${formData.confirmingBehaviors || '[Not specified]'}
- **Avoidant behaviors:** ${formData.avoidantBehaviors || '[Not specified]'}  
- **Overriding behaviors:** ${formData.overridingBehaviors || '[Not specified]'}

### Active Schema Modes
${selectedModes || '[No schema modes selected]'}

${hasReflectionContent ? `
---

## 🔍 Schema Reflection Insights

${formData.schemaReflection.selfAssessment ? `### Personal Assessment
"${formData.schemaReflection.selfAssessment}"

` : ''}${formData.schemaReflection.questions.filter(q => q.answer.trim()).length > 0 ? `### Reflection Questions
${formData.schemaReflection.questions
  .filter(q => q.answer.trim())
  .map(q => `**${q.category.toUpperCase()}:** ${q.question}
*Response:* ${q.answer}`)
  .join('\n\n')}` : ''}
` : ''}

---

## 🔄 Rational Thoughts
*Confidence ratings (1-10)*

${formatThoughts(formData.rationalThoughts) || '[No rational thoughts developed]'}

---

## ✨ Final Reflection

### Updated Emotions
${formatEmotions(formData.finalEmotions) || '[No final emotions rated]'}

**Original Thought Credibility:** ${formData.originalThoughtCredibility}/10

### New Behaviors
${formData.newBehaviors || '[No new behaviors identified]'}

### Alternative Responses
${formData.alternativeResponses
  .filter(r => r.response.trim())
  .map(r => `- ${r.response}`)
  .join('\n') || '[No alternative responses identified]'}

---

*This reflection is a tool for self-awareness and growth. Be patient and compassionate with yourself throughout this process.*

**Exported from AI Therapist CBT Diary on ${new Date().toLocaleDateString()}**`;
}

// Text Export (plain text version)
export function exportAsText(formData: CBTDiaryFormData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const initialEmotions = formatEmotionsForExport(formData.initialEmotions);
      const finalEmotions = formatEmotionsForExport(formData.finalEmotions);
      const validThoughts = formData.automaticThoughts.filter(t => t.thought.trim());
      const rationalThoughts = formData.rationalThoughts.filter(t => t.thought.trim());
      const selectedModes = formData.schemaModes.filter(mode => mode.selected);
      
      const textContent = `CBT DIARY ENTRY
${'='.repeat(50)}

Date: ${formData.date}
Export Date: ${new Date().toLocaleDateString()}

SITUATION
${'-'.repeat(20)}
${formData.situation || '[No situation described]'}

INITIAL EMOTIONS (1-10 scale)
${'-'.repeat(20)}
${initialEmotions.map(e => `${e.name}: ${e.intensity}/10`).join('\n') || '[No emotions rated]'}

AUTOMATIC THOUGHTS (with credibility 1-10)
${'-'.repeat(20)}
${validThoughts.map(t => `"${t.thought}" (${t.credibility}/10)`).join('\n') || '[No thoughts entered]'}

CORE BELIEF (${formData.coreBeliefCredibility}/10 credibility)
${'-'.repeat(20)}
${formData.coreBeliefText || '[No core belief identified]'}

BEHAVIORAL PATTERNS
${'-'.repeat(20)}
Confirming: ${formData.confirmingBehaviors || '[Not specified]'}
Avoidant: ${formData.avoidantBehaviors || '[Not specified]'}
Overriding: ${formData.overridingBehaviors || '[Not specified]'}

ACTIVE SCHEMA MODES
${'-'.repeat(20)}
${selectedModes.map(mode => `${mode.name} (${mode.description})`).join('\n') || '[No schema modes selected]'}

${formData.schemaReflection.enabled && (formData.schemaReflection.selfAssessment.trim() || formData.schemaReflection.questions.some(q => q.answer.trim())) ? `
SCHEMA REFLECTION
${'-'.repeat(20)}
${formData.schemaReflection.selfAssessment ? `Personal Assessment: ${formData.schemaReflection.selfAssessment}

` : ''}${formData.schemaReflection.questions.filter(q => q.answer.trim()).map(q => `${q.category.toUpperCase()}: ${q.question}
Response: ${q.answer}`).join('\n\n')}
` : ''}

RATIONAL THOUGHTS (with confidence 1-10)
${'-'.repeat(20)}
${rationalThoughts.map(t => `"${t.thought}" (${t.confidence}/10)`).join('\n') || '[No rational thoughts developed]'}

FINAL EMOTIONS (1-10 scale)
${'-'.repeat(20)}
${finalEmotions.map(e => `${e.name}: ${e.intensity}/10`).join('\n') || '[No final emotions rated]'}

Original Thought Credibility: ${formData.originalThoughtCredibility}/10

NEW BEHAVIORS
${'-'.repeat(20)}
${formData.newBehaviors || '[No new behaviors identified]'}

ALTERNATIVE RESPONSES
${'-'.repeat(20)}
${formData.alternativeResponses.filter(r => r.response.trim()).map(r => `- ${r.response}`).join('\n') || '[No alternative responses identified]'}

${'='.repeat(50)}
This reflection is a tool for self-awareness and growth.
Be patient and compassionate with yourself throughout this process.

Exported from AI Therapist CBT Diary on ${new Date().toLocaleDateString()}`;

      const filename = generateFileName('text');
      downloadFile(textContent, filename, 'text/plain');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// PDF Export
export function exportAsPDF(formData: CBTDiaryFormData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container for PDF content
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.padding = '40px';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.lineHeight = '1.5';
      container.style.color = '#333333';
      
      // Generate HTML content for PDF
      const initialEmotions = formatEmotionsForExport(formData.initialEmotions);
      const finalEmotions = formatEmotionsForExport(formData.finalEmotions);
      const validThoughts = formData.automaticThoughts.filter(t => t.thought.trim());
      const rationalThoughts = formData.rationalThoughts.filter(t => t.thought.trim());
      const selectedModes = formData.schemaModes.filter(mode => mode.selected);
      
      container.innerHTML = `
        <div style="max-width: 720px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4A90E2; padding-bottom: 20px;">
            <h1 style="color: #4A90E2; margin: 0 0 10px 0; font-size: 28px;">🌟 CBT Diary Entry</h1>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Date: ${formData.date}</p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">Exported on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">📍 Situation Context</h2>
            <p style="margin: 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #e3f2fd;">${formData.situation || '[No situation described]'}</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">💭 Initial Emotions</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
              ${initialEmotions.map(e => `
                <div style="padding: 10px; background-color: #f8f9fa; border-radius: 6px; border-left: 3px solid #ff6b6b;">
                  <strong>${e.name}:</strong> ${e.intensity}/10
                  <div style="width: 100%; background-color: #e0e0e0; border-radius: 3px; height: 8px; margin-top: 5px;">
                    <div style="width: ${(e.intensity / 10) * 100}%; background-color: #ff6b6b; height: 100%; border-radius: 3px;"></div>
                  </div>
                </div>
              `).join('') || '<p style="color: #666; font-style: italic;">No emotions rated</p>'}
            </div>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">🧠 Automatic Thoughts</h2>
            ${validThoughts.map(t => `
              <div style="margin-bottom: 10px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left: 3px solid #ffa726;">
                <p style="margin: 0 0 5px 0; font-style: italic;">"${t.thought}"</p>
                <small style="color: #666;">Credibility: ${t.credibility}/10</small>
              </div>
            `).join('') || '<p style="color: #666; font-style: italic;">No thoughts entered</p>'}
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">🎯 Core Schema Analysis</h2>
            <div style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #ab47bc;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Core Belief (${formData.coreBeliefCredibility}/10)</h3>
              <p style="margin: 0 0 15px 0; font-style: italic;">${formData.coreBeliefText || '[No core belief identified]'}</p>
              
              <h4 style="margin: 15px 0 5px 0; font-size: 14px; color: #333;">Behavioral Patterns:</h4>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li><strong>Confirming:</strong> ${formData.confirmingBehaviors || '[Not specified]'}</li>
                <li><strong>Avoidant:</strong> ${formData.avoidantBehaviors || '[Not specified]'}</li>
                <li><strong>Overriding:</strong> ${formData.overridingBehaviors || '[Not specified]'}</li>
              </ul>
              
              ${selectedModes.length > 0 ? `
                <h4 style="margin: 15px 0 5px 0; font-size: 14px; color: #333;">Active Schema Modes:</h4>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${selectedModes.map(mode => `<li><strong>${mode.name}</strong> (${mode.description})</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          </div>
          
          ${formData.schemaReflection.enabled && (formData.schemaReflection.selfAssessment.trim() || formData.schemaReflection.questions.some(q => q.answer.trim())) ? `
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">🔍 Schema Reflection Insights</h2>
            <div style="padding: 15px; background-color: #f3e5f5; border-radius: 8px; border-left: 4px solid #9c27b0;">
              ${formData.schemaReflection.selfAssessment ? `
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Personal Assessment</h3>
                <p style="margin: 0 0 15px 0; font-style: italic;">"${formData.schemaReflection.selfAssessment}"</p>
              ` : ''}
              
              ${formData.schemaReflection.questions.filter(q => q.answer.trim()).length > 0 ? `
                <h3 style="margin: 15px 0 10px 0; font-size: 16px; color: #333;">Reflection Questions</h3>
                ${formData.schemaReflection.questions.filter(q => q.answer.trim()).map(q => `
                  <div style="margin-bottom: 10px; padding: 10px; background-color: #ffffff; border-radius: 4px;">
                    <p style="margin: 0 0 5px 0; font-weight: bold; color: #9c27b0;">${q.category.toUpperCase()}: ${q.question}</p>
                    <p style="margin: 0; font-style: italic;">${q.answer}</p>
                  </div>
                `).join('')}
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">🔄 Rational Thoughts</h2>
            ${rationalThoughts.map(t => `
              <div style="margin-bottom: 10px; padding: 12px; background-color: #e8f5e8; border-radius: 6px; border-left: 3px solid #4caf50;">
                <p style="margin: 0 0 5px 0; font-style: italic;">"${t.thought}"</p>
                <small style="color: #666;">Confidence: ${t.confidence}/10</small>
              </div>
            `).join('') || '<p style="color: #666; font-style: italic;">No rational thoughts developed</p>'}
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4A90E2; font-size: 18px; margin-bottom: 10px; border-left: 4px solid #4A90E2; padding-left: 10px;">✨ Final Reflection</h2>
            
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Updated Emotions</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">
              ${finalEmotions.map(e => `
                <div style="padding: 10px; background-color: #e8f5e8; border-radius: 6px; border-left: 3px solid #4caf50;">
                  <strong>${e.name}:</strong> ${e.intensity}/10
                  <div style="width: 100%; background-color: #e0e0e0; border-radius: 3px; height: 8px; margin-top: 5px;">
                    <div style="width: ${(e.intensity / 10) * 100}%; background-color: #4caf50; height: 100%; border-radius: 3px;"></div>
                  </div>
                </div>
              `).join('') || '<p style="color: #666; font-style: italic;">No final emotions rated</p>'}
            </div>
            
            <p style="margin: 10px 0;"><strong>Original Thought Credibility:</strong> ${formData.originalThoughtCredibility}/10</p>
            
            <h3 style="margin: 15px 0 5px 0; font-size: 16px; color: #333;">New Behaviors</h3>
            <p style="margin: 5px 0 15px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">${formData.newBehaviors || '[No new behaviors identified]'}</p>
            
            <h3 style="margin: 15px 0 5px 0; font-size: 16px; color: #333;">Alternative Responses</h3>
            ${formData.alternativeResponses.filter(r => r.response.trim()).length > 0 ? `
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${formData.alternativeResponses.filter(r => r.response.trim()).map(r => `<li>${r.response}</li>`).join('')}
              </ul>
            ` : '<p style="color: #666; font-style: italic;">No alternative responses identified</p>'}
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-style: italic; color: #1565c0;">This reflection is a tool for self-awareness and growth.<br>Be patient and compassionate with yourself throughout this process.</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // Generate PDF
      html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then((canvas) => {
        document.body.removeChild(container);
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        const filename = generateFileName('pdf');
        pdf.save(filename);
        resolve();
      }).catch(error => {
        document.body.removeChild(container);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Main export function that handles all formats
export async function exportCBTDiary(
  format: CBTExportFormat,
  formData: CBTDiaryFormData,
  markdownContent?: string
): Promise<void> {
  switch (format) {
    case 'pdf':
      return exportAsPDF(formData);
    case 'json':
      return exportAsJSON(formData);
    case 'markdown':
      return exportAsMarkdown(formData, markdownContent);
    case 'text':
      return exportAsText(formData);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}