## Brief overview
  Guidelines for handling markdown table rendering in the chat page. When tables exceed two columns, they should be wrapped in a Shadcn `Card` component for better readability and consistent UI.

## Communication style
  - Keep responses concise and technical.
  - Provide clear step-by-step plans before implementation.
  - Explicitly direct when to toggle between Plan and Act mode.

## Development workflow
  - Confirm the markdown rendering location before making changes.
  - Scaffold new UI components using the Shadcn MCP server when possible.
  - Override markdown renderers in a controlled way, ensuring backward compatibility for existing two-column tables.
  - Add tests for new rendering logic to validate behavior.

## Coding best practices
  - Use Shadcn `Card` and `CardContent` components for wrapping wide tables.
  - Create a dedicated wrapper component (e.g., `MarkdownTableCard`) instead of inline logic for maintainability.
  - Keep conditional logic simple: detect column count and decide whether to wrap in a card.
  - Follow existing project conventions for imports and file placement (e.g., `src/components/ui/`).

## Project context
  - This rule applies specifically to the chat page markdown rendering.
  - The Shadcn MCP server is available to scaffold UI components.
  - Tests should be added or updated in `__tests__/components/chat-message-markdown.test.tsx`.

## Other guidelines
  - Ensure consistent styling with Tailwind classes already used in the project.
  - Keep the wrapper component minimal and reusable.
  - Document the reason for wrapping wide tables in comments for future maintainers.
