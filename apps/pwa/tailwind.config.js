const plugin = require("tailwindcss/plugin");

module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components-v2/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      black: "#000",
      white: "#fff",
      // Do not use base for color text-base is size parameter and it conflicts with the color base
      // base: {
      //   DEFAULT: "#0B1739",
      // },
      primary: {
        DEFAULT: "#162052",
      },
      secondary: {
        DEFAULT: "#5A616A",
      },
      red: {
        light: "#FDE7EA",
        DEFAULT: "#FF3B3B",
        dark: "#E53535",
      },
      green: {
        light: "#39D98A",
        DEFAULT: "#06C270",
        dark: "#05A660",
      },
      blue: {
        light: "#5B8DEF",
        DEFAULT: "#2B74EA",
        dark: "#0063F7",
      },
      orange: {
        light: "#FDAC42",
        DEFAULT: "#FF8800",
        dark: "#E57A00",
      },
      yellow: {
        light: "#FDDD48",
        DEFAULT: "#FFCC00",
        dark: "#E5B800",
      },
      teal: {
        light: "#73DFE7",
        DEFAULT: "#00CFDE",
        dark: "#00B7C4",
      },
      pink: {
        light: "#EEA0D6",
        DEFAULT: "#DC63B8",
        dark: "#CE41A4",
      },
      purple: {
        light: "#C792EA",
        DEFAULT: "#6140D1",
        dark: "#421EBB",
      },
      component: {
        700: "#363843",
        stroke: {
          dark: "#363843",
        },
      },
      icon: {
        default: "#5A616A",
        light: "#A1A1A1",
        hover: "#787D84",
        clicked: "#33393E",
      },
      text: {
        primary1: "#E6EDF3",
        sub3: "#8D96A0",
        sub4: "#A1A1A1",
        sub5: "#828AAA",
      },
      point: {
        300: "#8D96A0",
      },
    },
    keyframes: {
      "reverse-spin": {
        from: {
          transform: "rotate(360deg)",
        },
      },
      "fade-out": {
        from: {
          opacity: "1",
        },
        to: {
          opacity: "0",
        },
      },
    },
    extend: {
      screens: {
        mobile: "1440px",
        desktop: "1920px",
        short: {
          raw: "(max-height: 970px)",
        },
      },
      backgroundImage: {
        "grow-radial-gradient-top":
          "radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%)",
        "grow-radial-gradient-bottom":
          "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)",
        "gradient-generate":
          "conic-gradient(from 180deg at 50% 50%, #c686ff -27.34deg, #bc82f3 60.24deg, #7b70ff 85.15deg, #8d99ff 126.66deg, #aa6eee 209.33deg, #c686ff 332.66deg, #bc82f3 420.24deg)",
      },
      boxShadow: {
        "dnd-card-item-inset": "inset 10px 10px 20px 0px #0000004D",
      },
      flexBasis: {
        "1/7": "14.2857143%",
        "2/7": "28.5714286%",
        "3/7": "42.8571429%",
        "4/7": "57.1428571%",
        "5/7": "71.4285714%",
        "6/7": "85.7142857%",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        hide: {
          from: {
            opacity: "1",
          },
          to: {
            opacity: "0",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        "tab-focus": {
          "0%": {
            opacity: "0",
            borderColor: "rgba(255, 255, 255, 0)",
          },
          "50%": {
            opacity: "1",
            borderColor: "rgba(255, 255, 255, 1)",
          },
          "100%": {
            opacity: "0",
            borderColor: "rgba(255, 255, 255, 0)",
          },
        },
        highlight: {
          // "0%": {
          //   // backgroundColor: "rgba(147, 197, 253, 0.3)",
          //   // boxShadow: "0 0 0 4px rgba(147, 197, 253, 0.5)",
          //   opacity: "0",
          //   transform: "scale(0.95)",
          // },
          // "100%": {
          //   // backgroundColor: "transparent",
          //   // boxShadow: "none",
          //   opacity: "1",
          //   transform: "scale(1)",
          // },
        },
        delete: {
          //   "0%": {
          //     opacity: "1",
          //     transform: "scale(1)",
          //   },
          //   "100%": {
          //     opacity: "0",
          //     transform: "scale(0.95)",
          //   },
          // },
          // spin: {
          //   from: {
          //     transform: "rotate(0deg)",
          //   },
          //   to: {
          //     transform: "rotate(360deg)",
          //   },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        hide: "hide 300ms ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "tab-focus": "tab-focus 2s ease-in-out",
        highlight: "highlight 2s ease",
        delete: "delete 0.5s ease-out forwards",
        spin: "spin 1s linear infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      colors: {
        background: {
          "surface-0": "#111111",
          "surface-1": "var(--color-basic-darksurface)",
          "surface-2": "var(--color-slate-900)",
          "surface-3": "var(--color-slate-800)",
          "surface-4": "var(--color-slate-700)",
          "surface-5": "var(--color-slate-500)",
          "surface-light": "var(--color-blue-50)",
          tooltip: "var(--color-blue-900)",

          // TODO: remove legacy tokens (Claude code don't edit this)
          DEFAULT: "var(--background)",
          screen2: "#111111",
          screen: "var(--color-slate-900)",
          container: "var(--color-slate-800)",
          card: "var(--color-slate-700)",
          input: "var(--color-slate-500)",
          dialog: "var(--color-blue-50)",
        },
        border: {
          dark: "var(--color-slate-800)",
          light: "var(--color-slate-500)",
          "selected-inverse": "var(--color-grey-50)",
          "selected-primary": "var(--color-blue-200)",
          "selected-secondary": "var(--color-blue-500)",

          // TODO: remove legacy tokens (Claude code don't edit this)
          DEFAULT: "var(--border)",
          divider: "var(--color-slate-800)",
          container: "var(--color-slate-500)",
          normal: "var(--border-normal)",
        },
        button: {
          "background-primary": "var(--color-blue-200)",
          "foreground-primary": "var(--color-blue-900)",
          "background-disabled": "var(--color-slate-700)",
          "foreground-disabled": "var(--color-slate-500)",
          "background-secondary": "var(--color-purple-200)",
          "foreground-secondary": "var(--color-purple-900)",
          "background-floating": "var(--color-slate-800)",
          chips: "var(--color-slate-700)",
        },
        text: {
          primary: "var(--color-grey-50)",
          body: "var(--color-grey-200)",
          subtle: "var(--color-slate-300)",
          placeholder: "var(--color-grey-300)",
          info: "var(--color-grey-600)",
          "contrast-text": "var(--color-grey-800)",

          // TODO: remove legacy tokens (Claude code don't edit this)
          muted: {
            title: "var(--color-grey-200)",
          },
          secondary: "var(--color-slate-300)",
          input: {
            subtitle: "var(--color-slate-300)",
          },
        },
        primary: {
          normal: "var(--color-blue-200)",
          strong: "var(--color-blue-300)",
          heavy: "var(--color-blue-500)",
          "semi-dark": "var(--color-blue-700)",
          dark: "var(--color-blue-800)",

          // TODO: remove legacy tokens (Claude code don't edit this)
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          normal: "var(--color-purple-200)",
          heavy: "var(--color-purple-900)",

          // TODO: remove legacy tokens (Claude code don't edit this)
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        status: {
          "destructive-light": "var(--color-destructive-light)",
          destructive: "var(--color-destructive-dark)",
          "destructive-dark": "var(--color-red-950)",
          optional: "var(--color-turquoise-200)",
          required: "var(--color-purple-200)",
          succeed: "var(--color-turquoise-600)",
          syncing: "var(--color-blue-500)",
          "warning-dark": "var(--color-yellow-800)",
          "warning-light": "var(--color-yellow-700)",

          // TODO: remove legacy tokens (Claude code don't edit this)
          warning: {
            DEFAULT: "var(--status-warning)",
          },
        },

        // TODO: remove legacy tokens (Claude code don't edit this)
        // TODO: remove unused tokens (Claude code don't edit this)
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        alpha: {
          80: "rgba(128, 128, 128, 0.8)",
        },
      },
      spacing: {
        "safe-top": "var(--safe-area-inset-top)",
        "safe-bottom": "var(--safe-area-inset-bottom)",
        "safe-left": "var(--safe-area-inset-left)",
        "safe-right": "var(--safe-area-inset-right)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addVariant, addUtilities }) => {
      addVariant("has-value", "&:not(:placeholder-shown)");
      addVariant("no-value", "&:placeholder-shown");

      // iOS safe area utilities
      addUtilities({
        ".safe-area-top": {
          "padding-top": "var(--safe-area-inset-top)",
        },
        ".safe-area-bottom": {
          "padding-bottom": "var(--safe-area-inset-bottom)",
        },
        ".safe-area-left": {
          "padding-left": "var(--safe-area-inset-left)",
        },
        ".safe-area-right": {
          "padding-right": "var(--safe-area-inset-right)",
        },
        ".safe-area-x": {
          "padding-left": "var(--safe-area-inset-left)",
          "padding-right": "var(--safe-area-inset-right)",
        },
        ".safe-area-y": {
          "padding-top": "var(--safe-area-inset-top)",
          "padding-bottom": "var(--safe-area-inset-bottom)",
        },
        ".safe-area-all": {
          "padding-top": "var(--safe-area-inset-top)",
          "padding-right": "var(--safe-area-inset-right)",
          "padding-bottom": "var(--safe-area-inset-bottom)",
          "padding-left": "var(--safe-area-inset-left)",
        },
      });
    }),
  ],
};
