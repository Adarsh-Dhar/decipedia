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

Content and account storage are configured independently. `NEXT_PUBLIC_CONTENT_MODE` selects `demo` or `api` content and must be set explicitly for production. `NEXT_PUBLIC_ACCOUNT_MODE` selects `local` or `supabase`; it defaults to Supabase when the Supabase public URL and key are configured, and to local demo-account storage otherwise. This lets demo articles run with real Supabase authentication, profiles, drafts, bookmarks, and reading preferences.

Demo content mode still keeps created article revisions, activity, and notifications in browser demo storage. API content mode continues to display an adapter-required notice: the repository does not yet contain an agreed API schema or authentication contract. `lib/api-client.ts` provides a server-side, timeout-bounded, abortable JSON transport with Zod response validation; concrete HTTP repositories require the backend team’s API contract. No transaction is submitted by this frontend.

The Supabase account tables use owner-scoped RLS, with matching explicit user filters in account queries. Supabase browser and server clients use the live account-table schema in `lib/supabase/database.types.ts`. Do not expose Supabase secret/service-role keys or other credentials in `NEXT_PUBLIC_*` variables.

See `.env.example` for supported configuration names. No wallet or backend credentials are required for demo content.
