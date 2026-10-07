/**
 * @type {import("prettier").Config}
 * Sama dengan fe-solutest + plugin pengurut class Tailwind.
 * Restart IDE setelah mengubah konfigurasi (Ctrl + Shift + P → Reload Window).
 */
const config = {
  semi: true,
  tabWidth: 2,
  endOfLine: 'lf',
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'es5',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/app/globals.css',
  tailwindFunctions: ['cn', 'cva'],
};

export default config;
