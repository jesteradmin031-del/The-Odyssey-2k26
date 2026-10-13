# Nexus 3d Vision

I am attaching the existing VERITAS frontend project.

IMPORTANT:
DO NOT rebuild the project from scratch.

Use the attached project as the current source of truth.
Preserve the existing architecture, components, animations, 3D scene, layout structure, typography style, and overall visual quality.

I am extremely happy with the current design.

I only want targeted visual and UX improvements.

==================================================
1. CHANGE THE COLOR / VISUAL THEME
==================================================

The current design uses a warm white/cream + gold visual language.

I want to evolve it into a more futuristic CYBER / INTELLIGENCE aesthetic.

Do NOT turn it into a stereotypical neon cyberpunk website.

Keep the premium editorial feel.

New visual direction:

- Deep near-black background
- Electric blue
- Deep indigo
- Subtle violet/purple
- Small amounts of cyan
- Very subtle gradients
- Dark glass surfaces where appropriate
- Soft blue/purple glow
- Thin luminous borders
- Subtle particle/light effects

Think:

"premium cyber intelligence platform"

NOT:

"gaming website"
"RGB cyberpunk"
"crypto website"

The current typography and editorial composition are excellent.
KEEP THEM.

The existing 3D evidence network is also excellent.
KEEP THE SAME CONCEPT AND STRUCTURE.

However, recolor the 3D network from the current beige/gold tones toward:

- electric blue
- indigo
- violet
- subtle cyan highlights

The main central evidence node can have a stronger blue/violet glow.

Keep the 3D scene sophisticated and restrained.

==================================================
2. IMPROVE THE VERIFICATION / USER SECTION
==================================================

This is the most important change.

The landing page currently looks excellent visually, but once a user reaches the actual verification interface, I want the experience to become much clearer and easier to understand.

The user should immediately understand:

1. What they entered
2. What VERITAS found
3. Whether the claim is true/misleading/false/unverified
4. Why that verdict was reached
5. What evidence supports the verdict
6. Which sources were used

Do NOT make the user dig through complicated cards.

==================================================
3. VERIFICATION INPUT
==================================================

Create a very clean and prominent verification input.

Heading:

"VERIFY A CLAIM"

Supporting text:

"Paste a statement, headline, or claim and let VERITAS investigate it."

Large input area:

"Enter the claim you want to verify..."

Primary button:

"VERIFY CLAIM →"

Make the input feel premium but extremely simple.

The user should know exactly what to do without explanation.

==================================================
4. VERIFICATION PROCESS
==================================================

When the user presses VERIFY CLAIM, preserve the existing cinematic verification animation.

Show the stages clearly:

01  ANALYZING CLAIM
02  RETRIEVING EVIDENCE
03  COMPARING SOURCES
04  ASSESSING EVIDENCE
05  GENERATING VERDICT

Use subtle blue/purple progress animations.

Do not make this overly flashy.

==================================================
5. RESULTS SHOULD BE MUCH CLEARER
==================================================

After verification, create a strong result hierarchy.

At the top:

VERIFICATION RESULT

Then show the verdict very clearly.

Example:

MISLEADING

or

SUPPORTED

or

CONTRADICTED

or

UNVERIFIED

The verdict should be the most visually obvious element after the heading.

Also show:

CONFIDENCE
87%

Make the confidence value visually clear.

Use a restrained color system:

SUPPORTED
→ blue/cyan

MISLEADING
→ violet/amber accent

CONTRADICTED
→ red/pink accent

UNVERIFIED
→ muted blue/gray

Do not rely on color alone.
Always include the text verdict.

==================================================
6. SHOW THE ORIGINAL CLAIM
==================================================

Immediately below the verdict:

YOUR CLAIM

Display the exact claim entered by the user in a clean readable block.

Do not make it tiny.

The user should instantly recognize:

"This is the statement I asked VERITAS to verify."

==================================================
7. EXPLANATION
==================================================

Add a prominent section:

WHY?

Give a short plain-language explanation of the verdict.

Example:

"Multiple reliable sources support the underlying claim, but the statement exaggerates the size of the effect. The available evidence does not support the claim as written."

The explanation should be easy for a normal person to understand.

Avoid overly technical AI language.

==================================================
8. EVIDENCE
==================================================

Create a highly readable evidence section.

Heading:

"EVIDENCE"

Show evidence items in a clean hierarchy.

Each evidence item should contain:

SOURCE
TITLE
DATE
RELEVANCE
SUPPORTS / CONTRADICTS
SHORT SUMMARY

Example:

SOURCE
Nature

TITLE
Lifecycle emissions of electric vehicles

DATE
2024

RELEVANCE
HIGH

STATUS
CONTRADICTS CLAIM

SUMMARY
"Recent lifecycle studies generally find that EVs produce lower total emissions than comparable petrol vehicles over their lifetime."

Make the source name and evidence status easy to scan.

Do not put everything into tiny text.

==================================================
9. SOURCE VISUALIZATION
==================================================

Keep the existing evidence-network concept.

But make it secondary to the readable evidence list.

The visual network should help users understand relationships between:

CLAIM
↓
EVIDENCE
↓
SOURCES

It should NOT replace the readable evidence.

If a user clicks/hover over a source node, highlight the corresponding evidence item.

==================================================
10. USER EXPERIENCE
==================================================

The verification result should follow this visual hierarchy:

VERDICT
↓
CONFIDENCE
↓
YOUR CLAIM
↓
WHY?
↓
EVIDENCE
↓
SOURCES
↓
EVIDENCE NETWORK

The user should be able to understand the result by simply scanning from top to bottom.

Avoid excessive cards and unnecessary UI elements.

Use whitespace to separate sections.

==================================================
11. CYBER VISUAL LANGUAGE
==================================================

Introduce subtle details throughout the verification interface:

- blue/purple glow
- thin technical lines
- tiny metadata labels
- subtle grid patterns
- small animated indicators
- faint scan-line/noise texture
- minimal data-point animations
- subtle blue/purple highlights

But keep the overall interface premium and clean.

The goal is:

EDITORIAL + CYBER INTELLIGENCE

not:

CYBERPUNK GAMING UI

==================================================
12. RESPONSIVENESS
==================================================

Make sure the verification result is excellent on mobile.

On mobile:

- verdict first
- confidence second
- claim third
- explanation fourth
- evidence fifth
- sources afterward

The evidence cards should become vertical and easy to read.

Do not force wide desktop layouts onto mobile.

==================================================
13. IMPORTANT — PRESERVE THE EXISTING DESIGN
==================================================

DO NOT remove or replace:

- current hero composition
- current typography direction
- current 3D evidence network concept
- current navigation structure
- current cinematic animations
- current section structure unless necessary for the improved verification UX

DO NOT redesign the entire site.

This is a refinement pass.

The current version is already visually strong.

Make the smallest changes necessary to achieve:

"premium cyber intelligence + extremely clear verification UX."

Before modifying code, inspect the attached project and understand the existing implementation.

Then modify the existing components rather than creating an entirely new application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexus-3d-vision.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/43af2704-118c-4c2a-bdd2-31d72467dcb5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
