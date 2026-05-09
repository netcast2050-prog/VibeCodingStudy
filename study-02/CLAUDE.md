# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step required. Open `index.html` directly in a browser, or serve it with any static file server:

```
npx serve .
python -m http.server
```

## Architecture

Three-file vanilla JS SPA with a Korean-language UI for task management.

- **index.html** — Static shell; the `<ul id="task-list">` is the only dynamic mount point.
- **style.css** — Flexbox card layout; indigo primary (`#6366f1`), mobile-first at `max-width: 600px`.
- **script.js** — All application logic (~82 lines). No framework, no bundler.

### Data model

Tasks live in `localStorage` under the key `'my-tasks'` as a JSON array:

```js
{ id: Date.now(), text: string, completed: boolean, createdAt: timestamp }
```

### State flow

`addTask` / `toggleTask` / `deleteTask` each mutate the in-memory `tasks` array, then call `save()` (writes to localStorage) and `render()` (rebuilds the entire `<ul>` from scratch via `innerHTML`). There is no virtual DOM or diffing — every state change fully re-renders the list.
