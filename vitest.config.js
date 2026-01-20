import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        include: ['app/kwc/**/__tests__/**/*.test.jsx', 'app/kwc/**/__tests__/**/*.test.js'],
        globals: true
    }
});
