/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#EAEFEA',
        primary: '#0B8A7D',
        secondary: '#F2C94C',
        sidebar: '#FFFFFF',
        columnToDo: '#FDECF4',
        columnInProgress: '#FEF0D9',
        columnInReview: '#DFF6FC',
        columnDone: '#E9E3FA',
        card: '#FFFFFF',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
        badgeHigh: '#EF4444',
        badgeHighBg: '#FEE2E2',
        badgeMedium: '#F59E0B',
        badgeMediumBg: '#FEF3C7',
        badgeLow: '#10B981',
        badgeLowBg: '#D1FAE5',
      }
    },
  },
  plugins: [],
}
