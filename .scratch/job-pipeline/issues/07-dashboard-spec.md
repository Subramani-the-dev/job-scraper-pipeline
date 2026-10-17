Type: grilling
Status: open
Blocked by: 02

## Question

Spec the Next.js dashboard: the screen list (job list with live filters, a Posting detail view, a FilterConfig settings screen, a per-company health view showing last Run status/count and flagging Run Anomalies), the API routes `client/` needs to serve them (reads of Postings/health, writes of Tracking Status and FilterConfig), and the auth flow (password form → session cookie, middleware gate on every route). Confirm the exact React Query + Redux Toolkit split per screen: which state is server state (fetched/cached via React Query) versus client UI state (filters-in-progress, selected rows — Redux Toolkit).
