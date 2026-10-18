# HARVEST design direction

Treat HARVEST as a field-planning tool. Prioritize readable data, clear inputs and specific agricultural language.

- Use a light, warm background, solid surfaces and restrained forest-green accents. Keep text readable on dark field and summary panels. Avoid purple-blue gradients, gradient headline text, glass effects and low-contrast dark themes.
- Use system fonts for controls and data, with Georgia for the harvest date range. Do not use Inter throughout the interface.
- Use a four-pixel spacing scale, with 16px between compact data cards and 24px between major sections. Align labels, numbers and controls consistently.
- Use task headings such as “Field conditions” and “Supply balance.” Avoid emojis, decorative badges above headlines, frequent em dashes and generic product slogans.
- Keep operational status labels next to their data, using plain text and sufficient contrast. Do not use colored left borders as card decoration.
- Limit icons to controls where they help identify an action, such as refresh, location, download and the mobile menu. Do not put icons on every metric, navigation item or heading, or use three decorative icon boxes as a section layout.
- Use the app's own simple forms, tables and source lists. Avoid unmodified component-library defaults.
- Keep sections visible immediately. Do not add scroll reveals, entrance fades, cursor-following beams, card zoom, floating decorations or hover effects that fade buttons.
- Reserve short transitions for control state changes, the mobile navigation and data updates. Honor reduced-motion preferences in CSS and any future JavaScript chart animations.

Yield fixtures, actual weather and unavailable measurements must remain distinguishable. Visual cleanup must not remove data provenance or imply a connected trained model.
