import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "390px",   // Fold 7 cover screen & compact phones
        sm: "640px",
        md: "768px",
        // ~900px = Fold 7 inner screen — treated as mobile/tablet (< lg)
        lg: "1024px",  // Desktop nav kicks in here
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
