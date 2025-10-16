# VS Code Settings for Pricey

This file contains recommended VS Code settings and extensions for this project.

## Recommended Extensions

Install these extensions for the best development experience:

### Essential

- **ESLint** (dbaeumer.vscode-eslint) - JavaScript/TypeScript linting
- **Prettier** (esbenp.prettier-vscode) - Code formatting
- **Prisma** (Prisma.prisma) - Prisma schema support
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss) - Tailwind autocomplete

### Helpful

- **TypeScript Error Translator** (mattpocock.ts-error-translator) - Better TS errors
- **Error Lens** (usernamehw.errorlens) - Inline error messages
- **Docker** (ms-azuretools.vscode-docker) - Docker support
- **GitLens** (eamodio.gitlens) - Git supercharged
- **Better Comments** (aaron-bond.better-comments) - Colorful comments

## Recommended Settings

Add these to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "prisma.showPrismaDataPlatformNotification": false
}
```

## Tasks

Add these to `.vscode/tasks.json` for quick commands:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "isBackground": true
    },
    {
      "label": "Start Docker Services",
      "type": "npm",
      "script": "docker:dev",
      "problemMatcher": []
    }
  ]
}
```

## Quick Tips

- Use `Cmd/Ctrl + Shift + P` -> "TypeScript: Restart TS Server" if types aren't updating
- Use `Cmd/Ctrl + Shift + P` -> "Tailwind CSS: Show Output" for Tailwind debugging
- Press `F5` to start debugging (after configuring launch.json)
