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
    ],
    // ERP-specific prompts for OCD and intrusive thoughts
    ocd: [
      "What compulsion am I feeling urged to perform right now?",
      "What would happen if I didn't do this ritual/check/wash?",
      "How certain do I need to be (0-100%) vs. how certain is 'enough'?",
      "Can I sit with this uncertainty for 5 more minutes?"
    ],
    intrusive_thoughts: [
      "Is having this thought the same as wanting to act on it?",
      "Would I judge someone else for having this thought?",
      "What does fighting this thought do - does it make it stronger?",
      "Can I notice this thought and let it pass like a cloud?"
    ],
    contamination: [
      "What am I truly afraid will happen if I don't wash/clean?",
      "How long can most people go without washing in this situation?",
      "What evidence do I have that I'm actually contaminated?",
      "What would 'normal' cleanliness look like here?"
    ],
    checking: [
      "What am I checking for - what's the feared outcome?",
      "How many times is 'enough' to check something?",
      "What evidence do I have that something is actually wrong?",
      "Can I leave this unchecked and see what happens?"
    ]
  };
  
  return prompts[emotion.toLowerCase()] || prompts.anxiety;
}

/**
 * Gets ERP-specific challenging questions for exposure and response prevention
 * @param obsessionType - The type of obsession/compulsion
 * @returns {string[]} Array of ERP-focused questions
 */
export function getERPChallengeQuestions(obsessionType: string): string[] {
  const erpPrompts: Record<string, string[]> = {
    contamination: [
      "What level of cleanliness is 'normal' for this situation?",
      "What would happen if I touched this and didn't wash immediately?",
      "How do other people handle this same situation?",
      "Can I tolerate this feeling of 'dirtiness' for 10 more minutes?"
    ],
    checking: [
      "What evidence do I actually have that something is wrong?",
      "How many times have my fears actually come true?",
      "What would I do if I couldn't check this at all?",
      "Can I practice trusting that I did it right the first time?"
    ],
    harm: [
      "Is having a scary thought the same as being dangerous?",
      "What evidence do I have that I would ever act on this thought?",
      "How do I treat people I care about - does that match my fears?",
      "Can I let this thought exist without pushing it away?"
    ],
    symmetry: [
      "What would happen if things stayed uneven/imperfect?",
      "How much of my time do I spend on arranging things perfectly?",
      "Can I practice leaving something 'good enough' today?",
      "What really matters more - perfection or my time/energy?"
    ],
    moral: [
      "Is having a disturbing thought the same as being immoral?",
      "Do my actions align with my values, regardless of my thoughts?",
      "Can I accept uncertainty about whether I'm 'good enough'?",
      "What would self-compassion look like in this moment?"
    ]
  };
  
  return erpPrompts[obsessionType.toLowerCase()] || erpPrompts.contamination;
}

/**
 * Generates a compassionate ERP (Exposure and Response Prevention) template
 * @returns {string} Formatted ERP template for exposure hierarchy and response prevention
 */
export function generateERPTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `🎯 **ERP (Exposure and Response Prevention) Plan**

**Date:** ${today}

---

## **Compassionate Approach**
*Remember: ERP is about building confidence through gentle, gradual exposure. You're not forcing yourself - you're choosing courage. Go at your own pace.*

---

## **Current Obsession/Compulsion Pattern**

**What I'm worried about:**
[Describe your fear, worry, or obsessive thought...]

**What I feel compelled to do:**
[Describe the ritual, checking, washing, or avoidance behavior...]

**Anxiety level when I don't do the compulsion:** ___/10

---

## **Understanding My Pattern**

**Trigger situations:**
- [Situation 1 that triggers the urge]
- [Situation 2 that triggers the urge]
- [Situation 3 that triggers the urge]

**Safety behaviors I use:**
- [What I do to feel "safe" or reduce anxiety]
- [How I avoid or escape the situation]
- [Who I ask for reassurance]

**How this pattern affects my life:**
[What does this compulsion cost me in terms of time, relationships, or activities?]

---

## **Compassionate Exposure Hierarchy**
*Start with what feels manageable. Success builds on success.*

### **Low-Level Exposures (Anxiety 3-4/10)**
*"I can probably handle this with some support"*

1. [Gentle exposure 1] - **Anxiety: ___/10**
2. [Gentle exposure 2] - **Anxiety: ___/10**
3. [Gentle exposure 3] - **Anxiety: ___/10**

### **Mid-Level Exposures (Anxiety 5-7/10)**  
*"This feels challenging but doable with preparation"*

1. [Moderate exposure 1] - **Anxiety: ___/10**
2. [Moderate exposure 2] - **Anxiety: ___/10**
3. [Moderate exposure 3] - **Anxiety: ___/10**

### **High-Level Exposures (Anxiety 8-10/10)**
*"This is my long-term goal when I'm ready"*

1. [Advanced exposure 1] - **Anxiety: ___/10**
2. [Advanced exposure 2] - **Anxiety: ___/10**
3. [Advanced exposure 3] - **Anxiety: ___/10**

---

## **Response Prevention Plan**

**Instead of my usual compulsion, I will:**
- [Alternative behavior 1]
- [Alternative behavior 2]  
- [Self-soothing strategy that isn't a compulsion]

**Delay strategies when I feel the urge:**
- "I'll wait 5 minutes before doing the compulsion"
- "I'll do one other activity first"
- "I'll rate my anxiety and see if it changes"

**Self-compassion reminders:**
- "This anxiety feeling is temporary and will pass"
- "I'm being brave by facing my fears"
- "It's okay to feel anxious - that means I'm challenging myself"

---

## **Today's Specific ERP Practice**

**Chosen exposure (start small):**
[What specific exposure will I try today?]

**Expected anxiety level:** ___/10

**Response prevention commitment:**
[What compulsion will I NOT do, or delay?]

**Support I have available:**
- [Person I can call/text for support]
- [Coping strategy I can use]
- [Reward I'll give myself for trying]

---

## **Tracking Progress**

### **Before Exposure**
- **Anxiety level:** ___/10
- **Confidence I can handle this:** ___/10
- **Urge to do compulsion:** ___/10

### **During Exposure** 
*(Check in every 5-10 minutes)*
- **Time:** _____ **Anxiety:** ___/10
- **Time:** _____ **Anxiety:** ___/10  
- **Time:** _____ **Anxiety:** ___/10

### **After Exposure**
- **Final anxiety level:** ___/10
- **How long did it take for anxiety to decrease?** _____ minutes
- **Did I resist the compulsion?** Yes/No/Partially
- **What did I learn?** [Insights about my fears vs reality]

---

## **Reflection & Self-Compassion**

**What went well:**
[Celebrate even small victories - you're building courage!]

**What was harder than expected:**
[This is normal - be kind to yourself about challenges]

**What I learned about my fears:**
[Were they as realistic as they seemed?]

**How I can be more compassionate with myself:**
[You're doing difficult but important work for your wellbeing]

**Next step for tomorrow:**
[What feels manageable to try next?]

---

*Remember: ERP is not about eliminating anxiety - it's about building confidence that you can handle anxiety. Every small step matters. Be proud of your courage in facing these challenges.*`;
}

/**
 * Generates a quick ERP check-in template for daily practice
 * @returns {string} Short ERP template for ongoing practice
 */
export function generateQuickERPTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  
  return `🎯 **Quick ERP Check-in**

**Date:** ${today}

**Today's exposure:** [What did I face/practice?]

**Anxiety before:** ___/10  **Anxiety after:** ___/10

**Compulsion urge:** ___/10  **Did I resist?** Yes/No/Partially

**What I learned:** [Brief insight about the experience]

**Tomorrow I will:** [One small step forward]`;
}