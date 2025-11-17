import typescriptEslint from "typescript-eslint";

export default [{
	files: ["**/*.ts"],
}, {
	plugins: {
		"@typescript-eslint": typescriptEslint.plugin,
	},

	languageOptions: {
		parser: typescriptEslint.parser,
		ecmaVersion: 2020,
		sourceType: "module",
	},

	rules: {
		"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-explicit-any": "warn",
	},
}];
