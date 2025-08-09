/**
 * CBT (Cognitive Behavioral Therapy) Diary Template Generator
 * 
 * Provides structured CBT diary entry templates for therapeutic reflection.
 * Based on standard CBT practices with intensity scales from 1-10.
 */

/**
 * Generates an empty CBT diary template with instructional placeholders
 * @returns {string} Formatted CBT diary template ready for user completion
 */
export function generateCBTTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `📝 **CBT Diary Entry**

**Date:** ${today}

---

## **Situation**
*(Where am I? With whom? What is happening?)*

[Describe the specific context, location, people present, and circumstances that led to this emotional response...]

---

## **Feelings** 
*(Rate intensity from 1-10, where 1 = barely noticeable, 10 = overwhelming)*

**Primary Emotions:**
- Fear: ___/10
- Anger: ___/10  
- Sadness: ___/10
- Joy: ___/10
- Anxiety: ___/10
- Shame: ___/10
- Guilt: ___/10
- Other: ____________ ___/10

---

## **Automatic Thoughts** 
*(Credibility: Rate how much you believe each thought from 1-10)*

**Initial Thoughts:** *(Credibility: ___/10)*
[What thoughts immediately came to mind? What was I telling myself?]

**Further Thoughts:**
- [Thought 1] *(Credibility: ___/10)*
- [Thought 2] *(Credibility: ___/10)*
- [Thought 3] *(Credibility: ___/10)*

---

## **Schema** 
*(Underlying beliefs and patterns - Rate credibility 1-10)*

**Core Belief:** *(Credibility: ___/10)*
[What deeper belief about myself, others, or the world does this connect to?]

---

## **Schema-Behavior** 
*(How do I typically respond when this belief is activated?)*

**Confirming behaviors:** [Actions that reinforce the belief]
**Avoidant behaviors:** [Actions to escape or avoid the situation]
**Overriding behaviors:** [Compensatory actions to counteract the belief]

---

## **Schema-Modes** 
*(Which emotional states was I experiencing?)*

- [ ] The Vulnerable Child *(scared, helpless, needy)*
- [ ] The Angry Child *(frustrated, defiant, rebellious)*
- [ ] The Punishing Parent *(critical, harsh, demanding)*
- [ ] The Demanding Parent *(controlling, entitled, impatient)*
- [ ] The Detached Self-Soother *(withdrawn, disconnected, avoiding)*
- [ ] The Healthy Adult *(balanced, rational, caring)*
- [ ] Other: ________________________

---

## **Challenge**

| **Question** | **Answer** |
|--------------|------------|
| What does it say about me that I have this thought? | [Explore what this reveals about your fears, values, or concerns...] |
| Are thoughts the same as actions? | [Consider the difference between having a thought and acting on it...] |
| What would I say to a friend in this situation? | [Practice self-compassion and perspective-taking...] |
| Can I influence the future with my thoughts alone? | [Examine beliefs about thought-reality connections...] |
| What is the effect of this thought on my life? | [Consider the practical impact and cost of this thinking pattern...] |
| Is this thought in line with my values? | [Compare the thought with your deeper values and who you want to be...] |
| What would my healthy adult self say about this? | [Access your wise, balanced perspective...] |

---

## **Additional Questions**
[Add any other challenging questions specific to your situation]

- [Question]: [Answer]
- [Question]: [Answer]
- [Question]: [Answer]

---

## **Rational Thoughts** 
*(Confidence: Rate how much you believe each rational response from 1-10)*

**Balanced Perspectives:**
- "[Rational thought 1]" *(Confidence: ___/10)*
- "[Rational thought 2]" *(Confidence: ___/10)*
- "[Rational thought 3]" *(Confidence: ___/10)*

---

## **Effect on Feelings**
*(After completing this reflection)*

**Updated Emotion Ratings:**
- Fear: ___/10 *(Previously: ___/10)*
- Anger: ___/10 *(Previously: ___/10)*
- Sadness: ___/10 *(Previously: ___/10)*
- Anxiety: ___/10 *(Previously: ___/10)*
- Overall distress: ___/10

**Credibility of Original Thoughts:** ___/10 *(Previously: ___/10)*

---

## **Result**

### **New Behaviors**
[What will I do differently next time this situation arises?]

### **Possible Alternative Responses** 
*(For future reference)*

- [Alternative response 1]
- [Alternative response 2] 
- [Alternative response 3]
- [Emergency coping strategy if overwhelmed]

---

*Remember: This is a tool for self-reflection and growth. Be patient and compassionate with yourself throughout this process.*`;
}

/**
 * Generates a simplified CBT template for quick daily use
 * @returns {string} Condensed CBT template for brief entries
 */
export function generateQuickCBTTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `📝 **Quick CBT Check-in**

**Date:** ${today}

**Situation:** [Brief description]

**Feeling:** [Primary emotion] ___/10

**Thought:** [Main automatic thought] *(Credibility: ___/10)*

**Challenge:** [One balanced perspective] *(Confidence: ___/10)*

**Result:** [How do I feel now?] ___/10`;
}

/**
 * Gets helpful CBT prompts for specific emotions
 * @param emotion - The primary emotion to address
 * @returns {string[]} Array of relevant challenging questions
 */
export function getCBTPromptsForEmotion(emotion: string): string[] {
  const prompts: Record<string, string[]> = {
    anxiety: [
      "What is the worst that could realistically happen?",
      "How likely is this feared outcome (0-100%)?",
      "Have I survived similar situations before?",
      "What would I tell a friend who had this worry?"
    ],
    depression: [
      "Is this thought helping or hurting me?",
      "What evidence contradicts this negative view?",
      "What small step could I take right now?",
      "When did I last feel differently about this?"
    ],
    anger: [
      "What need or value is being threatened here?",
      "Is my reaction proportionate to the situation?",
      "What can I control vs. what can't I control?",
      "How will I feel about this in a week?"
    ],
    shame: [
      "Would I judge a friend this harshly for the same thing?",
      "Is this mistake part of being human?",
      "What can I learn from this experience?",
      "How can I show myself compassion right now?"
    ]
  };
  
  return prompts[emotion.toLowerCase()] || prompts.anxiety;
}