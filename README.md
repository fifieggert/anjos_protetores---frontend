# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Testes

Testes com [Vitest](https://vitest.dev) e [Testing Library](https://testing-library.com), na pasta `src/__tests__`. Só as bordas são falsas (axios ou services): nenhum teste acessa a rede nem lê o `.env`.

```bash
npm test                 # roda todos os testes
npm run test:coverage    # roda com cobertura (resumo no terminal e coverage/lcov.info)
npx vitest src/__tests__/pages/Login.test.tsx   # um arquivo, em modo watch
npx tsc -p tsconfig.test.json                   # checa os tipos dos testes (o build não checa)
```

O `test:coverage` falha abaixo do mínimo de 25% de cobertura. O CI roda esse comando antes do build e envia o `coverage/lcov.info` para o SonarCloud.
