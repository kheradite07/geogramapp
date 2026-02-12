import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/login/**/*.{js,ts,jsx,tsx,mdx}", // Explicitly adding login
        "./src/app/profile/**/*.{js,ts,jsx,tsx,mdx}", // Explicitly adding profile
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                brand: {
                    950: "#10002b", // Deepest
                    900: "#240046",
                    800: "#3c096c",
                    700: "#5a189a",
                    600: "#7b2cbf", // Primary?
                    500: "#9d4edd",
                    400: "#c77dff",
                    300: "#e0aaff", // Lightest
                }
            },
        },
    },
    plugins: [],
} satisfies Config;
