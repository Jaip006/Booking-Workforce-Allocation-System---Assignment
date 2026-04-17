import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: { DEFAULT: '#4F7942', light: '#6B9E5E', dark: '#3A5C31' },
        clay: { DEFAULT: '#B87333', light: '#D4924A', dark: '#8C5722' },
        cream: { DEFAULT: '#F5F0E8', dark: '#EDE5D4' },
        bark: '#2C1A0E',
      },
      fontFamily: {
        serif: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        organic: '12px 4px 14px 6px',
        'organic-lg': '18px 6px 20px 8px',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
} satisfies Config;
