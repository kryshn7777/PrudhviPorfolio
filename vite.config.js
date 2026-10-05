import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: works at a domain root or a sub-path like username.github.io/repo/
export default defineConfig({ base: './', plugins: [react()] });
