import { BRAND } from "./src/data/brand.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Brand tokens sourced from the single palette in src/data/brand.js,
        // which the category data also consumes for runtime pin colors — so a
        // brand color changes in exactly one place.
        ...BRAND,
        // Non-brand one-off text browns, tokenized so no raw hex lives in components.
        cocoa: "#5C4A35",   // SpotCard description text
        taupe: "#7A6248",   // SpotCard detail grid text
        sandstone: "#A08060", // subtitles / list address text
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "20px",   // pills
        card: "20px",   // cards
        field: "12px",  // inputs / directions button
        cta: "14px",    // submit button / toast
        chip: "10px",   // small badges / hide-show button
        sheet: "20px 20px 0 0", // bottom sheet top corners
      },
      boxShadow: {
        header: "0 2px 12px rgba(106,90,72,0.08)",
        pill: "0 4px 16px rgba(106,90,72,0.15)",
        card: "0 24px 64px rgba(106,90,72,0.2)",
        sheet: "0 -8px 40px rgba(106,90,72,0.2)",
        fab: "0 4px 20px rgba(106,90,72,0.2)",
        chip: "0 2px 8px rgba(0,0,0,0.08)",
        toast: "0 8px 24px rgba(0,0,0,0.2)",
        "watermelon-sm": `0 3px 10px ${BRAND.watermelon}44`,
        "watermelon-md": `0 4px 14px ${BRAND.watermelon}44`,
        "watermelon-lg": `0 4px 16px ${BRAND.watermelon}44`,
      },
      dropShadow: {
        pin: "0 2px 6px rgba(0,0,0,0.25)",
        "pin-selected": "0 6px 12px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        // Striped divider used across cards, form, sidebar footer.
        stripes: `repeating-linear-gradient(90deg, ${BRAND.stripe} 0px, ${BRAND.stripe} 10px, ${BRAND.cream} 10px, ${BRAND.cream} 20px)`,
        // Watermelon CTA gradient (#F4907A is the gradient-only lighter partner).
        "watermelon-gradient": `linear-gradient(135deg, ${BRAND.watermelon}, #F4907A)`,
        // Top-bar fade behind the mobile header.
        "topbar-fade": "linear-gradient(to bottom, rgba(250,246,240,0.98) 70%, transparent)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(.34,1.56,.64,1)",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        toastPop: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        slideUp: "slideUp 0.3s cubic-bezier(.34,1.56,.64,1)",
        toastPop: "toastPop 0.3s ease",
      },
    },
  },
  plugins: [],
};
