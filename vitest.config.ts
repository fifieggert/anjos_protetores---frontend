import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Fuso fixo: as datas "só dia" (utils/datas.ts) são formatadas no horário local. Definido
// aqui, antes de os workers subirem, para o resultado não depender da máquina.
process.env.TZ = 'America/Sao_Paulo'

export default mergeConfig(
  viteConfig,
  defineConfig({
    // Os testes nunca leem o .env: as variáveis VITE_* vêm só de test.env, abaixo.
    envDir: false,
    test: {
      environment: 'jsdom',
      include: ['src/__tests__/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/__tests__/setup.ts'],
      css: false,
      // Telas inteiras do antd no jsdom são lentas, principalmente no CI.
      testTimeout: 20_000,
      env: {
        VITE_API_URL: '/api',
        VITE_WHATSAPP_ABRIGO: '5547999990000',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/types/**', 'src/**/*.d.ts', 'src/__tests__/**', 'src/**/*.{test,spec}.{ts,tsx}'],
        // Mínimo exigido pela faculdade: abaixo disso o "test:coverage" (e o CI) falha.
        thresholds: {
          lines: 25,
          statements: 25,
          functions: 25,
          branches: 25,
        },
      },
    },
  }),
)
