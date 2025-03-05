import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({ baseDirectory: process.cwd() });

export default [
	js.configs.recommended,
	// Convert the legacy TypeScript ESLint config to flat config format:
	...compat.extends("plugin:@typescript-eslint/recommended"),
	{
		files: ["**/*.{js,ts}"],
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		ignores: ["node_modules/", "main.js"],
	},
];
