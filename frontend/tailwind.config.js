/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'valle-green': {
                    DEFAULT: '#2E5235',
                    dark: '#1b3120',
                    light: '#4d8256',
                },
                'valle-gold': {
                    DEFAULT: '#B49650',
                    light: '#cfb57a',
                },
                'valle-black': {
                    DEFAULT: '#191E17',
                    light: '#2d362a',
                }
            },
        },
    },
    plugins: [],
}