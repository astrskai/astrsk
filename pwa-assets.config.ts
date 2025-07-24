import { defineConfig } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    png: {
      quality: 100,
    },
    transparent: {
      sizes: [48, 64, 192, 512],
      favicons: [[48, "favicon.ico"]],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      padding: 0,
    },
    apple: {
      sizes: [512],
      padding: 0,
      resizeOptions: {
        background: {
          r: 32,
          g: 32,
          b: 32,
          alpha: 100,
        },
      },
    },
  },
  images: ["public/icon.svg"],
});
