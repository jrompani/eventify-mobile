---
name: Nocturnal Pulse
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393e'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b20'
  surface-container: '#1f1f24'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343439'
  on-surface: '#e3e2e8'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e3e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb3b5'
  on-secondary: '#680018'
  secondary-container: '#a8002d'
  on-secondary-container: '#ffb2b4'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffdada'
  secondary-fixed-dim: '#ffb3b5'
  on-secondary-fixed: '#40000b'
  on-secondary-fixed-variant: '#920026'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121317'
  on-background: '#e3e2e8'
  surface-variant: '#343439'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets urban explorers, nightlife culture seekers, social instigators, and community-driven event creators who crave authentic real-world connections. The brand personality balances underground exclusivity with hyper-accessible social vibrancy—drawing atmospheric cues from ticketing disruptors like DICE and Resident Advisor while infusing the candid, ephemeral playfulness of modern social products like Partiful and BeReal.

The aesthetic direction fuses **Dark Mode Neo-Brutalist Elegance** with **Luminous Glassmorphism**:
- **Atmospheric & Subterranean:** Deep, pitch-black and cosmic obsidian canvases absorb glare, creating an intimate, late-night club environment.
- **Electric Energy:** Pinpoint bursts of electric violet, radiant magenta, and kinetic neon coral inject sensory excitement without overwhelming cognitive ease.
- **Radical Trust & Social Presence:** High-contrast verified mint badges, gold gaming micro-accents, and overlapping friend activity circles bridge the gap between anonymous digital discovery and high-stakes real-world attendance.
- **Haptic & Tactile:** Micro-interactions mimic physical wristbands, guest list stamps, and dynamic holographic tickets.

## Colors

The color architecture is built strictly on deep, immersive tonal darks accented by focused, high-voltage luminescent tones.

### Canvas & Surfaces
- **Background Root (`#0B0C10`):** Ultra-dark, blue-tinted void used for root viewports, canvas backdrops, and bottom sheets.
- **Surface Level 1 (`#13151D`):** Default card background, sheet containers, and search bars.
- **Surface Level 2 (`#1B1E2B`):** Elevated elements, modal dialogs, flyout menus, and active card states.
- **Surface Stroke (`rgba(255, 255, 255, 0.08)`): Ghost borders defining structure against pitch-black depths.

### Core Accents
- **Electric Violet (`#8B5CF6`) & Hyper Magenta (`#A855F7`):** The primary identity tier. Applied to main action buttons, active tab indicators, audio wave visualizers, and core brand milestones.
- **Kinetic Coral (`#FF4F64`):** The secondary social tier. Signals spontaneous gathering invites, RSVP triggers, live countdown pulses, and burning ticket tiers.
- **Verified Mint (`#10B981`):** The trust tier. Reserved for identity verification checkmarks, 100% attendance track records, confirmed transactions, and active safe zones.
- **Gamified Amber Gold (`#F59E0B`):** Applied exclusively to Level/XP progress dials, VIP access perks, streak counts, and community milestone badges.

### Neutrals & Text Hierarchy
- **Text Primary (`#FFFFFF`):** High-impact headlines, critical data, active labels.
- **Text Secondary (`#94A3B8`):** Meta descriptions, timestamps, venue details, subheadings.
- **Text Tertiary (`#64748B`):** Inactive indicators, micro-labels, fine print.

## Typography

Typography relies on **Plus Jakarta Sans** across all breakpoints. Its geometric precision, generous counterforms, and confident terminal angles deliver legible, assertive utility in dark environments.

### Hierarchy Rules
- **Headline XL / Mobile XL:** Used for event headliners, hero lineup titles, and ticket access countdowns. Uppercase transformations are permitted when creating editorial poster moments.
- **Headline Large & Medium:** Structural module dividers, event drawer sheet titles, and user profile monikers.
- **Body Regulars (LG/MD/SM):** Clean reading text for venue bios, match descriptions, and chat messaging.
- **Labels (SM/MD):** Tracked slightly loose (`+0.02em` to `+0.04em`) and rendered in bold weights for XP counters, intent badges, event type tags, and verification statuses.

## Layout & Spacing

Designed primarily for a mobile-first 390px viewport, layout logic prioritizes effortless one-thumb control, full-bleed media, and breathable horizontal card carousels.

### Layout Specs
- **Mobile (390px - 430px base):** 4-column layout, outer section margin of `1.25rem` (20px), gutter of `1rem` (16px). Bottom nav bar height is fixed at 84px with safe-area spacing to avoid blocking sticky primary action buttons.
- **Tablet / Expanded (600px - 1024px):** 8-column layout, outer canvas margin of `2rem` (32px), gutter of `1.5rem` (24px). Event cards reflow to a 2-column masonry or multi-row grid.
- **Desktop (1025px+):** 12-column layout centered with a maximum container width of 1200px, flanked by auto side margins.

### Spacing Cadence
- **Atomic Gaps (`space-xs`, `space-sm`):** Micro-spacing within avatar stacks, badge label iconography, and XP progress pill margins.
- **Component Breathing Room (`space-md`, `space-lg`):** Internal padding for immersive cards, sticky action sheet trays, and intent pill wrap layouts.
- **Section Dividers (`space-xl`):** Vertical separation between carousel tracks (e.g., "Trending Now" to "Live Spontaneous Circles").

## Elevation & Depth

Visual hierarchy uses layered dark surfaces, backdrop glass refraction, and tinted neon glows rather than harsh drop shadows.

- **Level 0 (Floor):** Canvas background `#0B0C10`. Flat, non-reflective.
- **Level 1 (Cards & Carousels):** Surface `#13151D` with a subtle 1px top-and-side outline of `rgba(255, 255, 255, 0.08)`. No directional shadow.
- **Level 2 (Popovers, Sticky Footers & Dialogs):** Surface `#1B1E2B` with 16px background blur (`backdrop-filter: blur(16px)`), combined with a delicate ambient shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.65)`.
- **Level 3 (Action Glows & Live Indicators):** Key floating interactions (e.g., "Join Plan", "Active QR Pass") utilize tinted perimeter halos:
  - Primary button: `0 4px 20px rgba(139, 92, 246, 0.35)`
  - Spontaneous/Live button: `0 4px 20px rgba(255, 79, 100, 0.35)`
  - Trust verification elements: `0 0 12px rgba(16, 185, 129, 0.25)`

## Shapes

The shape system embraces dynamic pill curves and pronounced squircle geometries (`roundedness: 3`). 

- **Primary Interactive Elements:** Buttons, intent chips, status pills, and search prompts use complete pill profiles (`border-radius: 9999px`).
- **Cards & Visual Containers:** Event hero cards and dynamic ticket wrappers use oversized curves (`24px` to `32px` / `rounded-2xl` to `rounded-3xl`) to establish a soft, tactile, modern social appearance.
- **Ticket Stubs & Passes:** Feature custom concave semi-circle notch cutouts on the horizontal seam between the event header and the QR redemption zone.

## Components

### 1. Immersive Event Cards
- **Structure:** 16:9 or 4:5 aspect ratio image wrapper topped with a linear vertical gradient (`rgba(11, 12, 16, 0)` to `#13151D` at 100% bottom).
- **Classification Badge (Top Left):** Pill with a dark backdrop blur (`rgba(0, 0, 0, 0.6)`) and 1px border. Shows "Commercial", "Social Plan", or "Flash Crowd" in vibrant brand colors.
- **Social Proofing (Bottom Left):** Overlapping 28px circular avatar stacks of mutual friends attending, with a `+X` count and a subtle 2px boundary ring of `#13151D`.
- **Metadata (Bottom):** Event name in Headline Medium, followed by venue, distance (e.g., "0.8 km"), and price/XP earn tags.

### 2. Social Intent Chips
- **Variants:** "Find a Group" (Violet border), "Casual Hang" (Coral border), "Networking" (Slate border), "Dating / Flirt" (Magenta border).
- **State:** Inactive chips have `#1B1E2B` background with secondary text. Active chips fill with the tinted accent at 20% opacity, solid accent border, and white text.

### 3. Trust & Gamification Badges
- **Verification Stamp:** Emerald pill containing a checkmark icon, attendance reliability score (e.g., "98% Shows Up"), and subtle glow.
- **XP / Level Indicator:** Amber badge (`#F59E0B`) styled like a tactile medallion or micro-capsule displaying the user's level and tier (e.g., "LVL 14 Night Owl").

### 4. Interactive Ticket & QR Token
- **Format:** Double-deck container with dashed line perforation and side cutouts.
- **Top:** Event key art, date, countdown timer, entry gate.
- **Bottom:** Dynamic, animated glowing QR code with rolling timestamps to prevent screen capture fraud, wrapped in a verified mint container.

### 5. Buttons
- **Primary CTA:** Pill shape, solid Electric Violet gradient (`#8B5CF6` to `#A855F7`), white high-contrast bold text, haptic down-scale state on mobile touch (`transform: scale(0.97)`).
- **Secondary Social:** Kinetic Coral (`#FF4F64`) with 12px pill geometry for quick RSVP, "I'm Going", and spontaneous plan initiation.
- **Ghost/Tertiary:** Pure translucent stroke with text matching category intent.

### 6. Lists & Spontaneous Feeds
- **Plan Items:** Compact horizontal cards highlighting the organizer's verified avatar, plan duration (e.g., "Happening for next 2h"), live attendees count, and one-tap join request.