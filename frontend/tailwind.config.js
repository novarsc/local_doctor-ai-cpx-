// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      // colors 객체를 추가합니다.
      colors: {
        primary: {
          light: '#60a5fa', // 밝은 파란색
          DEFAULT: '#3b82f6', // 기본 파란색 (주조색)
          dark: '#2563eb',  // 어두운 파란색
        },
        secondary: {
          light: '#fde047', // 밝은 노란색
          DEFAULT: '#facc15', // 기본 노란색 (포인트색)
          dark: '#eab308',  // 어두운 노란색
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}