import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config()

const isBackup = process.env.USE_BACKUP === 'true';

export default defineConfig({
  plugins: [react()],
  server: {
    host: isBackup ? process.env.BACKUP_HOST : process.env.PRIMARY_HOST,
    port: isBackup ? parseInt(process.env.BACKUP_PORT) : parseInt(process.env.PRIMARY_PORT),
  },
});
