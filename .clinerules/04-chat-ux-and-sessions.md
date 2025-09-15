# Chat UX and Session Behavior

- **Session Creation**
  - Create new chats only when the user explicitly sends a message.
  - Keep the user in the current conversation until they choose to send.

- **CBT Flow**
  - Final reflection is the last step prior to “Send to Chat”.
  - Draft saving for CBT diary is implemented in the Redux store only (no localStorage).

- **Session Report Content**
  - Include only information in chat or CBT diary input.
  - Omit sections without relevant input (e.g., do not include ERP if not provided).

- **Memory Banner/Context**
  - Ensure memory context fetch shows the banner even when `currentSession` is null (per existing behavior constraints).
