# Smoke Tests

These manual smoke tests verify SharedWorker communication across browsing contexts. They should be automated into a proper e2e suite.

## Echo Example (`/echo/`)

### Single-tab

1. Click "Send Echo" — a response appears with a client ID and message (e.g. `[<uuid>] Hello World! [0]`)
2. Click "Subscribe" — "Waiting for messages..." appears
3. Click "Send Echo" again — the subscription section updates with the new message

### Cross-tab

4. With the subscription active in tab 1, open a second tab to `/echo/`
5. In tab 2, click "Send Echo"
6. Switch to tab 1 — the subscription shows the message sent from tab 2 (different client ID)

## User Profile Example (`/user-profile/`)

### Single-tab

1. Click "Get User 1" — user details appear (name, email, age)
2. Click "Watch User 1" — the watch section appears with user data
3. Select "User 1" in the update dropdown, fill in a new name, click "Update User" — the watch section updates with the new name

### Cross-tab

4. In tab 1, click "Watch User 1" (if not already watching)
5. Open a second tab to `/user-profile/`
6. In tab 2, select User 1, enter a new name, click "Update User"
7. Switch to tab 1 — the watch section shows the name updated from tab 2
