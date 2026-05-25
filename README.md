# Basketball Rotation

Mobile-first pickup basketball rotation app.

## Development

```sh
pnpm install
pnpm run dev
pnpm test
pnpm build
```

The app is frontend-only and persists data in browser `localStorage` under
`basketball-rotation-app`.

## Deployment

The included GitHub Actions workflow builds the static Vite app and deploys it
to GitHub Pages.
