# Decipedia

Decipedia is a Next.js App Router frontend for a community knowledge commons. The interface runs in an explicitly labeled demo mode by default. Fixture content and locally created articles, revisions, bookmarks, drafts, preferences, activity, and notifications are stored in this browser only and are never presented as verified on-chain data.

## Development

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Routes

The App Router owns navigation and 404 behavior. The shared shell is in `app/decipedia-app.tsx`; page views are rendered by their route files under `app/`. Article content is rendered as sanitized GitHub-flavored Markdown.

## Data and integrations

`NEXT_PUBLIC_APP_DATA_MODE` defaults to `demo` and must be set explicitly for production. Demo fixtures plus browser-only articles, revision snapshots, bookmarks, drafts, theme, activity, and notifications are isolated in `lib/repositories.ts`. Setting the mode to `api` intentionally hides demo content and displays an adapter-required notice; the repository does not yet contain an agreed API schema, authentication contract, Gno article realm, or GnoConnect transaction adapter. No transaction is submitted by this frontend.

`lib/api-client.ts` provides a server-side, timeout-bounded, abortable JSON transport with Zod response validation. Endpoint paths and DTO schemas must be supplied from the backend contract before adding concrete API repositories. Do not put secrets in `NEXT_PUBLIC_*` variables.

See `.env.example` for supported configuration names. No wallet or backend credentials are required for demo mode.
