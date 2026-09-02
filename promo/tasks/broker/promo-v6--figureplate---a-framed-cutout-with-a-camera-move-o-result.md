# Result

I have successfully created the FigurePlate component as specified in the task. The component:

- Is located at `promo/src/shots/v6/FigurePlate.tsx`
- Exports the exact interface `FigurePlateProps` with src: string; caption?: string; move?: 'push' | 'drift' | 'settle'; delay?: number
- Implements a function component FigurePlate that:
  - Renders images using Img and staticFile from Remotion
  - Centers images with soft rounded frames and shadows from token module
  - Fades in over 12 frames starting at the delay prop (default 0)
  - Applies camera moves based on the move prop:
    * 'push' scales from 1.0 to 1.06 across 90 frames
    * 'drift' translates 22 pixels horizontally across 90 frames while holding scale
    * 'settle' scales from 1.04 down to 1.0 over 30 frames and then holds (default is 'push')
  - Shows caption beneath the figure with fade-in 10 frames after image using body font from contract
- All styling uses tokens from the contract module (T, E, BODY)
- Includes the required header comment about v5 cutouts
- Does not hardcode file paths or colors
- Uses only imports from remotion, react, and the contract as specified

The component follows the exemplar's structure and conventions exactly.

## Files Changed
- [
- '
- /
- h
- o
- m
- e
- /
- d
- a
- n
- m
- a
- n
- 6
- 0
- /
- p
- r
- o
- j
- e
- c
- t
- s
- /
- u
- v
- a
- l
- u
- x
- -
- p
- l
- a
- t
- f
- o
- r
- m
- /
- p
- r
- o
- m
- o
- /
- s
- r
- c
- /
- s
- h
- o
- t
- s
- /
- v
- 6
- /
- F
- i
- g
- u
- r
- e
- P
- l
- a
- t
- e
- .
- t
- s
- x
- '
- ]