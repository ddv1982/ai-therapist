// English prompt exports reuse the existing canonical prompts to preserve behavior
// and keep unit tests (which mock therapy-prompts) compatible.
export { THERAPY_SYSTEM_PROMPT as THERAPY_SYSTEM_PROMPT_EN, REPORT_GENERATION_PROMPT as REPORT_PROMPT_EN } from '../therapy-prompts';

import type { MemoryContext } from '../therapy-prompts';

// Web search notice (English) appended only when tools are enabled
export const WEB_SEARCH_EN = `
**WEB SEARCH CAPABILITIES ACTIVE:**
You have access to browser search tools. When users ask for current information, research, or resources that would support their therapeutic journey, USE the browser search tool actively to provide helpful, up-to-date information. Web searches can enhance therapy by finding evidence-based resources, current research, mindfulness videos, support groups, or practical tools. After searching, integrate the findings therapeutically and relate them back to the client's needs and goals.`;

// Optional memory section (English). Not injected by default; provided for future use.
export const MEMORY_SECTION_EN = (memoryContext: MemoryContext[]) => `

THERAPEUTIC MEMORY CONTEXT:
You have access to insights from previous therapy sessions to provide continuity of care. These reports contain professional therapeutic observations (no specific conversation details due to confidentiality):

${memoryContext
  .map(
    (m, i) => `Previous Session ${i + 1} (${m.sessionDate}): "${m.sessionTitle}"
Report Generated: ${m.reportDate}
Therapeutic Insights: ${m.summary}
`
  )
  .join('')}

Use this context to:
- Acknowledge previous therapeutic work and progress made
- Build upon insights and patterns identified in earlier sessions
- Reference therapeutic goals and areas of focus previously established
- Maintain continuity in your therapeutic approach
- Track progress over time and celebrate growth

IMPORTANT: Never reference specific conversation details from previous sessions. Only use the general therapeutic insights and patterns provided in these professional reports.
`;
