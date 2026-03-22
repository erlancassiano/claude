# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # install deps, generate Prisma client, run migrations
npm run dev
npm test
npx vitest run src/lib/__tests__/file-system.test.ts
npm run lint
npm run build
npm run db:reset
npx prisma generate && npx prisma migrate dev  # after schema changes
```

## Environment

- Copy `.env.example` to `.env` (or create `.env`) and set `ANTHROPIC_API_KEY`. Without it, a `MockLanguageModel` is used that returns static components instead of calling Claude.
- `JWT_SECRET` can be set for production; defaults to `"development-secret-key"`.

## Database

The schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.

## Architecture

### Virtual File System

The core concept: all generated React files live in an **in-memory** `VirtualFileSystem` (`src/lib/file-system.ts`), never on disk. The VFS is a tree of `FileNode` objects (files and directories) stored in a `Map<string, FileNode>`. It serializes to/from plain JSON for persistence and network transfer.

`FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) wraps the VFS in React state, exposes file operations, and handles incoming AI tool calls (`str_replace_editor`, `file_manager`) that mutate the VFS. A `refreshTrigger` counter is incremented on every mutation to propagate updates.

### AI Integration

The chat route (`src/app/api/chat/route.ts`) uses Vercel AI SDK's `streamText` with two tools:

- **`str_replace_editor`** — `view`, `create`, `str_replace`, `insert` commands on the VFS
- **`file_manager`** — `rename`, `delete` commands on the VFS

The AI streams responses with tool calls. On the client, `ChatContext` (`src/lib/contexts/chat-context.tsx`) uses `useAIChat` from `@ai-sdk/react`, forwarding tool calls to `FileSystemContext.handleToolCall` which applies them to the in-memory VFS.

When `ANTHROPIC_API_KEY` is absent, `getLanguageModel()` (`src/lib/provider.ts`) returns `MockLanguageModel`, which streams static component code through the same tool-call interface.

### Live Preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders the VFS contents into an `<iframe>` using `srcdoc`. The pipeline (`src/lib/transform/jsx-transformer.ts`):

1. Transforms JSX/TSX files with Babel Standalone (in-browser)
2. Creates blob URLs for each transformed file
3. Builds an import map — local files get blob URLs, third-party packages get `https://esm.sh/<package>` URLs
4. Generates the full preview HTML with Tailwind CDN, the import map, and a `<script type="module">` that dynamically imports the entry point (`/App.jsx` by default)

### Auth & Persistence

Auth uses JWT (via `jose`) stored as an `httpOnly` cookie — no NextAuth. Passwords are hashed with `bcrypt`. See `src/lib/auth.ts`.

Projects are persisted in SQLite via Prisma. The `Project` model stores `messages` and `data` (the serialized VFS) as JSON strings. Prisma client is generated to `src/generated/prisma/`. Anonymous sessions track work in `localStorage` via `src/lib/anon-work-tracker.ts`; on sign-in the work can be associated to the new account.

### Data Flow Summary

```
User message
  → ChatContext (useAIChat) → POST /api/chat
  → streamText with str_replace_editor / file_manager tools
  → tool call streamed back to client
  → FileSystemContext.handleToolCall mutates VFS
  → refreshTrigger increments
  → PreviewFrame re-renders iframe with updated VFS
```

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files live alongside source in `__tests__/` subdirectories.
