# AI Assistant Instructions for Brandable Domain Name Generator

## Project Overview
This is a static web application that generates brandable, pronounceable domain names using linguistic phonotactics. The app runs entirely client-side with no backend dependencies - just HTML, CSS, and vanilla JavaScript.

## Architecture & Core Components

### File Structure
- `index.html` - Single-page application with inline configuration
- `css/style.css` - Custom CSS using CSS variables for theming
- `js/script.js` - Core generation engine with phonotactics algorithms
- `img/` - SVG assets (logo-mark, logo-wordmark)
- `.nojekyll` - GitHub Pages deployment marker

### Key Technical Patterns

**Phonotactics Engine**: The core algorithm in `js/script.js` generates pronounceable names using:
- `ONSETS_CORE` / `ONSETS_SOFT` - consonant clusters that start syllables
- `NUCLEI` - vowel combinations for syllable centers  
- `CODAS` - consonant endings for syllables
- Language flavours (English, Romance, Nordic) that modify these patterns

**Seeded Randomization**: Uses `mulberry32()` PRNG with string seeds for reproducible results:
```javascript
const rng = mulberry32(seedFromString(userSeed));
```

**Quality Scoring**: Names are scored based on length, syllable count, vowel distribution, and pronounceability rules in `scoreName()` and `isPronounceable()`.

### UI Conventions

**Form Controls**: All inputs use semantic HTML with proper labels and ARIA attributes. Multi-select uses `<select multiple>` with keyboard hints.

**Results Display**: Generated names are rendered as interactive cards with:
- Click-to-copy functionality on domain names
- Star button for favorites (stored in localStorage)
- TLD chips showing different extensions
- External registrar links (non-affiliate)

**CSS Architecture**: 
- CSS custom properties in `:root` for consistent theming
- Grid layout for responsive form controls (`grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))`)
- Dark theme with subtle gradients and shadows

## Development Workflow

**No Build Process**: This is intentionally a zero-dependency static site. Changes are made directly to source files.

**Deployment**: Uses GitHub Pages (indicated by `.nojekyll` file). Deploy by pushing to main branch.

**Local Development**: Serve via any static server (e.g., `python -m http.server` or VS Code Live Server extension).

## Code Style & Conventions

**JavaScript Patterns**:
- Utility functions: `$()` for querySelector, `$$()` for querySelectorAll  
- Functional approach with pure functions for name generation
- Event listeners bound once at bottom of script
- No classes or frameworks - vanilla JS throughout

**Naming Conventions**:
- Constants in SCREAMING_SNAKE_CASE (`ONSETS_CORE`, `FLAVOURS`)
- Functions in camelCase (`buildSyllable`, `isPronounceable`)
- DOM elements cached in variables when reused

**Content Filtering**: Built-in safety filter via `BLOCK` array and `banned()` function to avoid inappropriate generated names.

## Key Extension Points

When adding features, consider:
- **New Language Flavours**: Extend `FLAVOURS` object with onset/nuclei/coda patterns
- **Quality Filters**: Modify `isPronounceable()` rules or add new scoring criteria
- **Export Formats**: Add new export functions alongside `exportCSV()`
- **UI Controls**: Follow existing field structure in `.controls` grid

## Testing Approach
Test name generation manually via browser console:
```javascript
// Test specific syllable generation
const rng = mulberry32(123);
const opts = { flavour: FLAVOURS.english, preferSoft: false, yVowel: true };
console.log(buildSyllable(rng, opts));
```

Manual testing focuses on edge cases like extreme syllable counts, pattern anchoring, and quality filter effectiveness.