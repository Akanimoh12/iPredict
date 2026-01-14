import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			modal: 'hsl(var(--modal))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			// Semantic colors for iPredict
  			yes: {
  				DEFAULT: 'hsl(var(--yes))',
  				foreground: 'hsl(var(--yes-foreground))'
  			},
  			no: {
  				DEFAULT: 'hsl(var(--no))',
  				foreground: 'hsl(var(--no-foreground))'
  			},
  			gold: {
  				DEFAULT: 'hsl(var(--gold))',
  				foreground: 'hsl(var(--gold-foreground))'
  			},
  			// Injective brand colors
  			injective: {
  				cyan: '#00F2FE',
  				blue: '#4FACFE',
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  			mono: ['JetBrains Mono', 'Menlo', 'monospace'],
  		},
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius-md)',
  			DEFAULT: 'var(--radius)',
  			sm: 'var(--radius-sm)',
  			xl: 'var(--radius-xl)',
  			full: 'var(--radius-full)',
  		},
  		spacing: {
  			'1': 'var(--space-1)',
  			'2': 'var(--space-2)',
  			'3': 'var(--space-3)',
  			'4': 'var(--space-4)',
  			'5': 'var(--space-5)',
  			'6': 'var(--space-6)',
  			'8': 'var(--space-8)',
  			'10': 'var(--space-10)',
  			'12': 'var(--space-12)',
  			'16': 'var(--space-16)',
  		},
  		animation: {
  			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'gradient': 'gradient 8s linear infinite',
  			'float': 'float 6s ease-in-out infinite',
  		},
  		keyframes: {
  			gradient: {
  				'0%, 100%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  			},
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' },
  			},
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-injective': 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
