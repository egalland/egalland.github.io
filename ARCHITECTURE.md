# Product Lab architecture

Vinext/React renders public routes on the server. The WebGL universe is an isolated client component and loads Three.js only when that view is active. The 2D index is available on mobile and without WebGL.

Cloudflare D1 stores projects and work sessions. Drizzle migrations own schema changes. Public pages read projects from D1 and fall back to the initial catalogue if the database is temporarily unavailable. Private mutations validate inputs with Zod and require the authenticated user's stable Site ID to match the server-side PRODUCT_LAB_OWNER_ID binding.

Routes: /, /projects, /projects/[slug], /activity, /about, /lab, /lab/projects/[id]. The private API endpoints are /api/projects and /api/sessions.
