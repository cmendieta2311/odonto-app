/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#14b8a6", // teal-500
                "primary-hover": "#0d9488", // teal-600
                "background-light": "#f6f8f8",
                "background-dark": "#101f22",
                "surface-light": "#ffffff",
                "surface-dark": "#182d32",
                "border-light": "#dbe4e6",
                "border-dark": "#2a3e42",
                "text-main-light": "#111718",
                "text-main-dark": "#e0e6e7",
                "text-secondary-light": "#618389",
                "text-secondary-dark": "#8faeb3",
                "text-main": "#111718",
                "text-sub": "#618389",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
