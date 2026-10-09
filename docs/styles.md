# Room styles

Choose a style with `look.style` in `museum.config.json`. Each sets the walls, floor, frames, ceiling and light.
`look.wall` (a `#rrggbb` colour) replaces the style's wall colour, and `look.ground` its floor (`marble`,
`concrete`, `oak-light`, `oak-dark`, `parquet`). The styles are defined in `src/components/museum/theme.ts`
(`THEMES`, `ROOM_STYLES`).

```json
"look": { "style": "print-room", "wall": null, "ground": null }
```

## Contemporary and neutral

| `style` | Walls | Floor | Frames | What it's like |
| --- | --- | --- | --- | --- |
| `postwar` (default) | White | Polished concrete | Thin black float frames | The white cube of a contemporary gallery, under a luminous ceiling. The example config gives it warm grey walls (`#a9a59f`). |
| `early-modern` | Off-white | Pale oak boards | Thin dark wood | An early modern museum such as MoMA, with a flat luminous ceiling. |
| `print-room` | Warm grey | Light oak | Thin black, with white mats | A print room: works matted and hung close together under softer light. Suits photographs well. |
| `museum` | Grey-blue | Pale stone slabs | Simple gilt | A renovated museum of today, with a luminous ceiling and no mouldings. |
| `impressionist` | Warm mid-grey | Pale oak | Simple gilt | The Musée d'Orsay: a glazed skylight overhead. |
| `east-asian` | Paper-toned plaster | Dark wood | Cream silk mounts, thin dark-wood edges | Asian galleries such as the Met's: warm, low light, no gilding. |

## Dark and dramatic

| `style` | Walls | Floor | Frames | What it's like |
| --- | --- | --- | --- | --- |
| `secession` | Deep charcoal | Light oak | Flat gold | Vienna 1900, the Belvedere's Klimt room, with gilded trim bands. Colour glows against the dark walls. |
| `northern` | Slate blue | Dark oak | Black ebonised wood | The Rijksmuseum's Dutch Golden Age rooms. |
| `court-miniature` | Deep teal | Dark oak | Gilt, with wide cream mats | A jewel cabinet: a dim ceiling and focused spotlights. |

## Coloured historic rooms

| `style` | Walls | Floor | Frames | What it's like |
| --- | --- | --- | --- | --- |
| `sacred` | Cool stone grey, pietra serena trim | Dark oak | Ornate gold tabernacles | An early Italian chapel, like the National Gallery's Sainsbury Wing. |
| `old-master` | Crimson damask | Dark oak | Carved gilt | A Baroque gallery such as the Galleria Borghese. |
| `eighteenth` | Sage-green silk, cream trim | Dark oak | Carved gilt | The 18th century, as in the Wallace Collection. |
| `nineteenth` | Deep green | Dark oak | Simple gilt | A 19th-century gallery such as the Alte Nationalgalerie. |
| `victorian` | Peacock-blue silk | Dark oak | Carved gilt | A Victorian Aesthetic interior such as Leighton House. |

## Grand architecture

| `style` | Walls | Floor | Frames | What it's like |
| --- | --- | --- | --- | --- |
| `palace` | Warm stone, white and gold above | Herringbone parquet | Carved gilt | The Louvre's Grande Galerie: bays on marble columns under arches, skylights in the vault. |
| `salon` | Pompeian red | Herringbone parquet | Carved gilt | The Louvre's red rooms: a gilded coved ceiling around a great skylight. |

## For photographs

- **Quiet, letting the photos lead:** `postwar` with a grey `look.wall`, `print-room` or `early-modern`.
- **Dark walls that make colour photos glow:** `secession`, or `northern`.
- **Gilt frames** (`museum`, `impressionist` and the historic rooms) tend to look odd around Instagram photos.
