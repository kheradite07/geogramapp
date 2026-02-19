# Localization Manifest & Roadmap

This document outlines the mandatory workflow for adding or modifying text within the Geogram application to maintain full support for all 17 languages.

## 1. Source of Truth
All user-facing strings MUST reside in `src/lib/translations.ts`.
- **Primary Object**: `translations`
- **Supported Languages**: `en` (Reference), `tr`, `es`, `de`, `fr`, `ru`, `zh-Hans`, `zh-Hant`, `ar`, `ja`, `id`, `th`, `hi`, `it`, `pt`, `pl`, `ko`.

## 2. Mandatory Rules

### No Hardcoding
Never use plain strings (e.g., `<span>Search</span>`) in TSX files. Use the `t()` function from `useTranslation`.

### Holistic Updates
When a new key is added to the `en` dictionary, it **must** be added to all other 16 language dictionaries in the same session.

### Semantic Key Naming
Use descriptive, lowercase, snake_case keys that describe the context (e.g., `login_welcome_message`) rather than the content (e.g., `welcome_to_geogram`).

### Dynamic Text
For strings with variables, use `{placeholder}` syntax:
- **Dictionary**: `share_text: "Check out this post by {name}!"`
- **Implementation**: `t('share_text').replace('{name}', userName)`

## 3. Implementation Workflow

1.  **Define Key**: Add the new key to the `en` section of `src/lib/translations.ts`.
2.  **Localize**: Add the same key with translated values to all other languages. Use AI assistance to ensure consistent and contextual translations.
3.  **Import**: Import `useTranslation` in the target component.
4.  **Inject**: Use `const { t } = useTranslation();` and replace the hardcoded string with `{t('your_key')}`.

## 4. Maintenance Roadmap
- **Automatic Audit**: Periodically run a grep search for hardcoded strings: `grep -r 'placeholder="[^{]"\|> [^<{]' src/`.
- **Translation Quality**: As the user base grows, professional review for RTL (Arabic) and Asian languages (Chinese, Japanese, Korean) is recommended.
- **Dynamic Language Detection**: In the future, implement geolocation-based default language selection.
