### Do you want to add a new language/localization?

Follow these steps:

1. Clone `src/lang/locale/en.ts` inside the same folder
2. Rename it to your selected language [standard abbreviation](https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages), so Obsidian can recognize it
3. Modify **only** the values of each property, without touching anything else
4. Import the created file into `src/lang/helpers.ts` and add it to `localeMap` (inside the same file)
5. Create a pull-request with the changes

Note that, if no translation is provided, it will fall back to the values inside `en.ts`
