
# 30A Mom Map — Feature Spec: Hover Popover on Map Pins

## Assumptions

- The re-architecture rebuild is already complete: the app is split into components, with all Mapbox-specific API calls isolated behind `MapView.jsx` (per the earlier re-architecture spec's goal of keeping the map provider swappable). Confirm this file exists before starting; if the map rendering logic lives somewhere else (e.g. still inline in `App.jsx`), adjust the file paths below accordingly.
- Styling has been migrated to Tailwind with design tokens in `tailwind.config.js` (colors, radii, shadows, fonts). This feature should use those tokens, not new inline styles.

## Current behavior (as of the rebuild)

There is no hover interaction on map pins. Hovering a pin does nothing visually. Clicking a pin opens the full spot detail view (`SpotCard`, shown as a bottom sheet on mobile or an absolute-positioned card on desktop). Only clicking a sidebar list item highlights that row.

## Goal

Hovering a pin on the map (desktop only) shows a small popover right next to the pin, with just the spot's name, address, and description — a quick preview. Clicking a pin keeps its existing behavior unchanged (opens the full `SpotCard`). This is an additional, separate interaction layer, not a replacement for the click behavior.

## Design

- **Desktop only.** Hover has no real equivalent on touch devices — do not change any mobile/touch behavior. Tapping a pin on mobile continues to open `SpotCard` exactly as it does today.
- Add `hoveredSpotId` state local to `MapView.jsx`. This is purely visual and map-scoped — it should not leak into `App.jsx` or any other component, and should not be persisted anywhere.
- On `onMouseEnter` of a `<Marker>`, set `hoveredSpotId` to that spot's id; on `onMouseLeave`, clear it. A small debounce/delay is optional (to avoid flicker when moving the mouse between adjacent pins) but not required.
- Render a `<Popup>` from `react-map-gl`, anchored to the hovered spot's `lng`/`lat`, containing:
  - Spot name (bold)
  - Address (secondary/muted text)
  - Description (truncate to ~2 lines with ellipsis if long)
  - Nothing else — no chips, tags, hours, or directions button. That's what the full `SpotCard` on click is for.
- The popover must not intercept or interfere with the click that opens `SpotCard` — hovering shows the preview, clicking still does what it does today, independently.
- Style with the existing Tailwind design tokens (brand colors, radius, shadow tokens) established during the rebuild, so the popover looks consistent with the rest of the app.

## Claude Code prompt

> Add a hover popover to map pins in `MapView.jsx` (or wherever the Mapbox map rendering currently lives in this codebase — confirm the file first). On `onMouseEnter` of a `<Marker>`, show a `react-map-gl` `<Popup>` anchored to that spot's `lng`/`lat` containing the spot's name, address, and description (truncate description to ~2 lines). Clear it on `onMouseLeave`.
>
> This is desktop-only — do not change any mobile (touch) behavior. Do not change what happens on click — clicking a pin should still open the existing `SpotCard` detail view exactly as it does today; the hover popover is a separate, additional quick-preview layer that doesn't interfere with it.
>
> Keep this state (`hoveredSpotId`) local to the map component — don't lift it into `App.jsx` or any other component. Style the popover using the existing Tailwind design tokens (`tailwind.config.js`) already established in this codebase, matching the app's existing look (colors, radius, shadow).
>
> Confirm: hovering a pin shows the popover, moving the mouse away hides it, and clicking a pin still opens the full `SpotCard` exactly as before, unaffected by the hover state.

## Verification checklist

- [ ] Hovering any pin on desktop shows a popover with name, address, and description positioned next to that pin.
- [ ] Moving the mouse off the pin hides the popover.
- [ ] Clicking a pin still opens the existing full `SpotCard` exactly as before — unchanged.
- [ ] No change to mobile/touch behavior — tapping a pin on mobile works exactly as it did before this change.
- [ ] `hoveredSpotId` state lives only inside the map component, not lifted into `App.jsx`.
- [ ] Popover styling uses existing Tailwind tokens, not new hardcoded colors/values.
- [ ] `npm run build` succeeds with no new console errors.
