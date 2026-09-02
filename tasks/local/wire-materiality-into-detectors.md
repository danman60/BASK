# Task: make the retail-attachment detector use scale-invariant thresholds

## Target file (edit in place, it already exists)
`packages/core/src/insights/detectors.ts`

## Background — why this change exists
The retail-attachment detector currently judges a change using absolute percentage points only.
It asks for a fall of at least 3 percentage points, and for a staff member to sit at least 6
percentage points below the house rate before naming them.

Those numbers were tuned against synthetic demo fixtures where attachment runs about 21 percent.
On the real twelve-year dataset attachment is 5.28 percent. There a 3-point fall would be a 57
percent collapse, so the rule almost never fires, and a 6-point staff gap is arithmetically
impossible when the house rate is only 5.28. The detector is therefore silent on real data.

The fix is to judge both the fall and the staff gap with rules that clear on EITHER an absolute
test OR a relative test, so the same detector works on a large base and a small base without
retuning. Helper functions for exactly this already exist and are fully tested; they are given to
you as the contract. Use them. Do not write your own comparison arithmetic.

## What to change
There are three comparison sites in the retail-attachment detector.

1. The site that decides whether the overall attachment fall is a finding at all. It currently
   compares a drop in points against the absolute points threshold. It must instead ask the
   contract's drop helper whether the fall from the baseline rate to the current rate is
   material, using the attachment-drop rule from the thresholds module.
2. The site that decides whether an individual staff member sits far enough below the house rate
   to be named. It currently compares a difference in points against the staff-gap threshold. It
   must instead ask the contract's gap helper, using the staff-gap rule from the thresholds
   module, with the house rate as the reference and the staffer's rate as the candidate.
3. The site that decides whether an individual staffer's own rate fell far enough from their own
   baseline. It currently reuses the absolute attachment-points threshold. It must use the
   contract's drop helper with the attachment-drop rule.

The two rule objects are already defined for you in the sibling module
`packages/core/src/insights/thresholds.ts`. Import them from there. Do not redefine them, do not
inline their numbers, and do not invent new ones.

## Rules
- Edit only the three comparison sites and whatever import lines that requires.
- Leave the exported `THRESHOLDS` object in place and unchanged. Other detectors in this file
  still read from it, and removing or editing it will break them. The two attachment-related
  entries in it simply stop being read by the three sites above; that is expected and correct.
- Do not touch any other detector in this file. Do not reorder, rename or reformat anything.
- Do not change any detector's title, sentence, evidence, severity or impact arithmetic.
- Keep the file's existing comment voice.
- Write no tests in this file.

## Acceptance
- `pnpm --filter @bask/core typecheck` exits 0.
- `pnpm --filter @bask/core test` exits 0.
- The three sites call the contract helpers; no absolute-only point comparison remains in the
  retail-attachment detector.
