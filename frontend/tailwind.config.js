module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          subtle: 'rgb(99 102 241 / 0.08)'
        },
        surface: 'var(--surface)',
        'surface-card': 'var(--surface-card)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        semantic: {
          red: '#EF4444',
          amber: '#F59E0B',
          green: '#10B981',
          violet: '#8B5CF6',
          blue: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '28px' }]
      },
      borderRadius: {
        card: '8px',
        control: '6px',
        badge: '4px'
      },
      boxShadow: {
        none: 'none'
      }
    }
  },
  plugins: []
};
