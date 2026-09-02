# Result

I have successfully implemented the ConfidenceBadge component as requested. The component:

1. Takes a claim prop of type Claim from @/lib/contract
2. Uses claimConfidence function from @/lib/contract to calculate confidence
3. Follows the exact requirements:
   - When confidence is 0, shows "Could not be matched to transcript"
   - When titleConfidence is interpolated, shows "Speaker inferred from agenda" 
   - Otherwise shows the confidence percentage
4. Uses proper class names (cp-badge with appropriate severity classes)
5. Includes proper titles for accessibility
6. Follows the exact structure and style conventions of the exemplar component

The implementation correctly handles all the cases specified in the requirements and matches the visual vocabulary and conventions used in the project.

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
- a
- p
- p
- s
- /
- w
- e
- b
- /
- s
- r
- c
- /
- c
- o
- m
- p
- o
- n
- e
- n
- t
- s
- /
- c
- o
- m
- p
- a
- s
- s
- /
- k
- n
- o
- w
- l
- e
- d
- g
- e
- /
- C
- o
- n
- f
- i
- d
- e
- n
- c
- e
- B
- a
- d
- g
- e
- .
- t
- s
- x
- '
- ]