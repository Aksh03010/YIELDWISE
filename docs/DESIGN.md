# HARVEST design direction

Treat HARVEST as a field-planning tool. Prioritize readable data, clear inputs and specific agricultural language.

- Use a light, warm background, solid surfaces and restrained forest-green accents. Keep text readable on dark field and summary panels. Avoid purple-blue gradients, gradient headline text, glass effects and low-contrast dark themes.
- Use system fonts for controls and data, with Georgia for the harvest date range. Do not use Inter throughout the interface.
- Use a four-pixel spacing scale, with 16px between compact data cards and 24px between major sections. Align labels, numbers and controls consistently.
- Use task headings such as “Field conditions” and “Harvest planning.” Avoid emojis, decorative badges above headlines, frequent em dashes and generic product slogans.
- Keep operational status labels next to their data, using plain text and sufficient contrast. Do not use colored left borders as card decoration.
- Limit icons to controls where they help identify an action, such as refresh, location, download and the mobile menu. Do not put icons on every metric, navigation item or heading, or use three decorative icon boxes as a section layout.
- Use the app's own simple forms, tables and source lists. Avoid unmodified component-library defaults.
- Keep sections visible immediately. Do not add scroll reveals, entrance fades, cursor-following beams, card zoom, floating decorations or hover effects that fade buttons.
- Reserve short transitions for control state changes, the mobile navigation and data updates. Honor reduced-motion preferences in CSS and any future JavaScript chart animations.
- Page titles type once at about 44 milliseconds per character when their page opens or the field name changes. Each new character makes its own small bounce into place; the complete heading stays still. Keep navigation labels static. Currency counts start when at least 20% of the amount is visible, pause offscreen, and continue toward the latest result when visible again. Money values only count, with no bounce. Completed amounts do not recount on repeat scrolling. Reserve final text dimensions and expose complete titles and amounts to assistive technology; reduced motion shows final values immediately without bouncing.
- Avoid preview banners and sample/hypothetical pills. Keep source context in plain text and full calculation limitations on the methodology page and in exports.

Research predictions, actual weather, manual planning assumptions and unavailable measurements must remain distinguishable. Show model scope and held-out errors alongside research results. Missing services never substitute sample predictions or weather. A registered research model does not imply a validated farm forecast.
