# categorize: screen reader manual test cases

Checks the delivery element against the screen reader announcement spec (rows 1–15). The page-level text is also covered by `apps/element-demo/test/e2e/categorize-screen-reader.spec.ts`, which proves the page puts the text in the right place but not that a screen reader speaks it. These cases are for that.

## Before you start

1. From the repo root run `bun run dev:demo` (serves http://localhost:5222).
2. Turn on VoiceOver (Cmd+F5) and its caption panel (VO+F8, Speech tab, "Show caption panel"). Use Safari. Repeat on Windows with NVDA in Firefox or Chrome when you can.
3. Keyboard only: **Tab**, **Shift+Tab**, **Enter** (or Space), **Esc**. Don't use the mouse except where a step says so.
4. **Reload the page before each case** so every case starts with nothing placed.
5. "Hear" means the sentence shows in the caption panel. After most keyboard moves the screen reader also reads the focused choice's name and "Press ENTER to select." — that is expected.

## The two demos

**List** — http://localhost:5222/categorize/deliver?demo=screen-reader-list
- Categories: **Category 1** "Structure of Say Yes to Solar Energy", **Category 2** "Structure of Say No to Solar Energy"; each holds up to 2 choices.
- Choices (cannot be reused): A "identifies a problem and suggests a solution", B "gives main arguments supported by details", C "lists specifics between an introduction and conclusion", D "explains ideas with comparisons and contrasts", E "highlights key points by grouping them together", F "tells about events in time order".

**Matrix** — http://localhost:5222/categorize/deliver?demo=screen-reader-matrix
- 6 categories, 2 columns (Volume, Pitch) by 3 rows (Range, Unit of Measure, What is Measured); each holds 1 choice.
- Choices (cannot be reused): "soft to loud", "low to high", "decibel", "hertz", "amplitude", "frequency".

**Main idea** — http://localhost:5222/categorize/deliver?demo=screen-reader-main-idea (item E225426)
- 2 categories side by side: **Category 1** "Main Idea", **Category 2** "Supporting Detail"; no limit per category; the choices are **below** the categories.
- Choices (cannot be reused): P "Anime is an animated cartoon from Japan.", Q "American fans enjoy anime clubs and stores.", R "Anime is popular in the United States.", S "The first color anime feature film was shown in the U.S. in 1961."
- Correct answer: Main Idea = P, R; Supporting Detail = Q, S.

**Fractions** — http://localhost:5222/categorize/deliver?demo=screen-reader-fractions (item E194321)
- 3 categories side by side: **Category 1** "Less than 1/2", **Category 2** "Equal to 1/2", **Category 3** "Greater than 1/2"; no limit per category; choices below. Math is written as MathML, and is read as "1 over 2".
- 12 choices (cannot be reused), in this order: 1/3, 1/4, 2/4, 2/3, 3/6, 2/5, 5/10, 12/10, 6/12, 3/12, 50/100, 5/3.
- Correct answer: Less than = 1/3, 1/4, 2/5, 3/12; Equal to = 2/4, 3/6, 5/10, 6/12, 50/100; Greater than = 2/3, 12/10, 5/3.

**Sentence purpose** — http://localhost:5222/categorize/deliver?demo=screen-reader-sentence-purpose (item E216659)
- One column headed "Purpose of the Sentence" and six rows labelled 1 to 6 (a 1 by 6 matrix); each cell holds 1 choice. The choices are below.
- Choices (cannot be reused), in this order: "to present limitations of the theory", "to state the theory", "to give evidence that the theory is correct", "to explain the purpose of the paragraph", "to explain how the theory was reached", "to explain the science behind the theory".

While a choice is selected, **Tab** visits Category 1, Category 2, … (left to right, top to bottom), then the choices pool.

Mark each case Pass, or Fail with what you heard.

Copy the case IDs below into your own sheet.

---

## Reading the item (rows 1–4)

### IN-1 List: structure (rows 1, 2)
1. Open the List demo and reload.
2. Put the screen reader cursor on the prompt ("Sort each text structure…") and read on (VO+A, or arrow down).

**Hear, in order:**
- "The question has 2 categories, which can each hold up to 2 answer choices. There are 6 answer choices, which cannot be reused."
- "Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel."

### IN-2 List: categories and the pool (rows 3, 4)
1. Continue reading from IN-1.

**Hear:**
- "Category 1 Structure of Say Yes to Solar Energy contains 0 answer choices."
- "Category 2 Structure of Say No to Solar Energy contains 0 answer choices."
- "6 available answer choices. Answer choice: identifies a problem and suggests a solution Answer choice: gives main arguments … (all six) End of available answer choices. Use TAB to move to an answer choice."

### IN-3 Matrix: structure and labels (rows 1, 2)
1. Open the Matrix demo and reload. Read on from the prompt.

**Hear:**
- "The question has 6 categories, arranged in a 2 by 3 matrix. Each category can hold 1 answer choice."
- "The column labels are: Column 1: Volume Column 2: Pitch"
- "The row labels are: Row 1: Range Row 2: Unit of Measure Row 3: What is Measured"
- "There are 6 answer choices, which cannot be reused."
- "Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel."

### IN-4 Matrix: each cell (row 3)
1. Continue reading from IN-3.

**Hear, six lines:** "The category in row Range and column Volume is empty." … through "The category in row What is Measured and column Pitch is empty." (order: Range/Volume, Range/Pitch, Unit of Measure/Volume, Unit of Measure/Pitch, What is Measured/Volume, What is Measured/Pitch), then "6 available answer choices. …".

---

## Moving through choices (rows 5, 7, 8, 15)

### FO-1 Focus a choice in the pool (row 5) — List
1. Reload. Press **Tab** once.

**Hear:** "Answer choice: identifies a problem and suggests a solution", then "Press ENTER to select."
2. Press **Tab** again. **Hear:** "Answer choice: gives main arguments supported by details", then "Press ENTER to select."

### SE-1 Select a choice (row 7) — List
1. Reload. **Tab** to choice A. Press **Enter**.

**Hear:** "Selected answer choice identifies a problem and suggests a solution. Use TAB to move to a drop area."

### SE-2 Cancel with Esc (rows 8, 15) — List
1. Reload. **Tab** to choice A. Press **Enter**. Press **Esc**.

**Hear:** "Answer choice identifies a problem and suggests a solution is no longer selected. Use TAB to move to an answer choice."
2. Check that nothing was placed (the choice is still in the pool) and that **Tab** goes to a choice again.

---

## While a choice is selected (rows 9, 10, 11)

### SE-3 Focus a category (row 9) — List
1. Reload. **Tab** to choice A, press **Enter**, press **Tab**.

**Hear:** "Selected drop area for category Structure of Say Yes to Solar Energy. Press ENTER to move selected answer choice identifies a problem and suggests a solution here or TAB to move to a different drop area."
2. Press **Tab**. **Hear** the same with "Structure of Say No to Solar Energy".

### SE-4 Focus a category — Matrix (row 9)
1. Open Matrix, reload. **Tab** to "soft to loud", press **Enter**, press **Tab**.

**Hear:** "Selected drop area for category in row Range and column Volume. Press ENTER to move selected answer choice soft to loud here or TAB to move to a different drop area."
2. Keep pressing **Tab** and check each: Range/Pitch, Unit of Measure/Volume, Unit of Measure/Pitch, What is Measured/Volume, What is Measured/Pitch.

### SE-5 Focus the pool with a choice that is not placed (row 11) — List
1. Reload. **Tab** to choice A, **Enter**, then **Tab** three times (Category 1, Category 2, pool).

**Hear:** "Press ENTER to leave selected answer choice identifies a problem and suggests a solution unplaced or TAB to move to a category drop area."
2. Press **Enter**. **Hear:** "Answer choice identifies a problem and suggests a solution is no longer selected. Use TAB to move to an answer choice." (row 15). Nothing is placed.

---

## Placing, moving, removing (rows 6, 12, 13, 14)

### PL-1 Place a choice (rows 12, 6) — List
1. Reload. **Tab** to choice A, **Enter**, **Tab** (Category 1), **Enter**.

**Hear:** "Placed answer choice identifies a problem and suggests a solution in drop area for category Structure of Say Yes to Solar Energy." followed by the focused choice's name, "Answer choice: identifies a problem and suggests a solution in category Structure of Say Yes to Solar Energy".
2. Check that **focus stayed on that choice** (it did not jump to the top of the page).
3. Move focus away and back (Shift+Tab, Tab). **Hear** the name with "in category Structure of Say Yes to Solar Energy" (row 6).

### PL-2 Place into a matrix cell (rows 12, 6) — Matrix
1. Reload. **Tab** to "soft to loud", **Enter**, **Tab**, **Enter** (Range / Volume).

**Hear:** "Placed answer choice soft to loud in drop area for category in row Range and column Volume." then "Answer choice: soft to loud in category in row Range and column Volume".

### PL-3 Replace the choice in a one-choice cell (row 12) — Matrix
1. Continue from PL-2. **Tab** to "low to high", **Enter**, **Tab** (Range / Volume again), **Enter**.

**Hear:** "Placed answer choice low to high in drop area for category in row Range and column Volume. To make room for it, answer choice soft to loud was removed."
2. Check "soft to loud" is back in the pool.

### PL-4 Category that is full (row 12 error) — List
1. Reload. Place A in Category 1 (as PL-1). Place B in Category 1 (**Tab** to B, **Enter**, **Tab**, **Enter**).
2. Select C and try to drop it in Category 1 (**Tab** to C, **Enter**, **Tab**, **Enter**).

**Hear:** the warning dialog: "Warning … You've reached the limit of 2 responses per area. To add another response, one must first be removed." Press **Cancel**. Nothing was placed; C is still in the pool.

### MV-1 Move to another category (rows 13, 6) — List
1. Continue from PL-1 (A in Category 1). **Tab** to A in Category 1.

**Hear:** "Answer choice: identifies a problem and suggests a solution in category Structure of Say Yes to Solar Energy"
2. Press **Enter**. **Tab** to Category 2. **Enter**.

**Hear:** "Moved answer choice identifies a problem and suggests a solution from drop area for category Structure of Say Yes to Solar Energy to drop area for category Structure of Say No to Solar Energy."

### MV-2 Move between matrix cells (row 13) — Matrix
1. Place "soft to loud" in Range / Volume (PL-2). **Tab** to it, **Enter**, **Tab** once (Range / Pitch), **Enter**.

**Hear:** "Moved answer choice soft to loud from drop area for category in row Range and column Volume to drop area for category in row Range and column Pitch."

### RM-1 Return a choice to the pool (rows 10, 14) — List
1. With A in Category 1, **Tab** to it and press **Enter**.
2. Press **Tab** until the pool (Category 1, Category 2, pool).

**Hear:** "Press ENTER to remove selected answer choice identifies a problem and suggests a solution from drop area for category Structure of Say Yes to Solar Energy or TAB to move to a category drop area."
3. Press **Enter**.

**Hear:** "Removed answer choice identifies a problem and suggests a solution from drop area for category Structure of Say Yes to Solar Energy." The choice is back in the pool.

### RM-2 Same in the matrix (rows 10, 14)
1. With "soft to loud" in Range / Volume, **Tab** to it, **Enter**, **Tab** until the pool.

**Hear:** "Press ENTER to remove selected answer choice soft to loud from drop area for category in row Range and column Volume or TAB to move to a category drop area."
2. **Enter**. **Hear:** "Removed answer choice soft to loud from drop area for category in row Range and column Volume."

---

## The intro follows your answers (row 3, row 4)

### UP-1 List
1. Place A and B in Category 1, C in Category 2 (PL-1 steps).
2. Put the screen reader cursor back on the intro and read it.

**Hear:**
- "Category 1 Structure of Say Yes to Solar Energy contains 2 answer choices. answer choice identifies a problem and suggests a solution answer choice gives main arguments supported by details End of answer choices."
- "Category 2 Structure of Say No to Solar Energy contains 1 answer choice. answer choice lists specifics between an introduction and conclusion"
- "3 available answer choices. …"

### UP-2 Matrix
1. Place "soft to loud" in Range / Volume. Read the intro.

**Hear:** "The category in row Range and column Volume contains answer choice soft to loud." and "5 available answer choices. …".

---

## NVDA or JAWS in browse mode (the click path)

In browse mode NVDA and JAWS turn **Enter** into a click, so the choice is selected by click, not picked up as a keyboard drag. **Tab** then moves real focus onto the categories and the pool, and their names carry rows 9 to 11. Run these with NVDA in Firefox or Chrome. Stay in browse mode; if NVDA switches to focus mode, press **NVDA+Space** to switch back. Use the List demo and reload before each case.

### BR-1 Select, then tab through the targets (rows 7, 9, 11) — List
1. **Tab** to choice A. Press **Enter**.

**Hear:** "Selected answer choice identifies a problem and suggests a solution. Use TAB to move to a drop area."
2. Press **Tab**. **Hear:** "Selected drop area for category Structure of Say Yes to Solar Energy. Press ENTER to move selected answer choice identifies a problem and suggests a solution here or TAB to move to a different drop area." The screen reader may add "grouping".
3. Press **Tab**. **Hear** the same with "Structure of Say No to Solar Energy".
4. Press **Shift+Tab** twice to reach the pool. **Hear:** "Press ENTER to leave selected answer choice identifies a problem and suggests a solution unplaced or TAB to move to a category drop area."

### BR-2 Cancel with Esc (rows 8, 15) — List
1. Do BR-1 steps 1 and 2, then press **Esc**.

**Hear:** "Answer choice identifies a problem and suggests a solution is no longer selected. Use TAB to move to an answer choice."
2. Check that nothing was placed, and that **Tab** goes to a choice again.

### BR-3 Place, then remove (rows 12, 6, 10, 14) — List
1. **Tab** to choice A, **Enter**, **Tab** (Category 1), **Enter**.

**Hear**, after a short pause: "Placed answer choice identifies a problem and suggests a solution in drop area for category Structure of Say Yes to Solar Energy." Focus stays on Category 1.
2. Move to A in Category 1. **Hear** "Answer choice: identifies a problem and suggests a solution in category Structure of Say Yes to Solar Energy" (row 6). Press **Enter**.
3. Press **Shift+Tab** until you reach the pool. **Hear:** "Press ENTER to remove selected answer choice identifies a problem and suggests a solution from drop area for category Structure of Say Yes to Solar Energy or TAB to move to a category drop area."
4. Press **Enter**. **Hear:** "Removed answer choice identifies a problem and suggests a solution from drop area for category Structure of Say Yes to Solar Energy." A is back in the pool.

### BR-4 Category that is full (row 12 error) — List
1. Place A and then B in Category 1 as in BR-3 step 1.
2. Select C and press **Enter** on Category 1.

**Hear:** "Warning", then "You've reached the limit of 2 responses per area. To add another response, one must first be removed." as the dialog opens. Press **Cancel**. C is still in the pool.

---

## Things that must not happen

### NO-1 No progress talk
After any placement above, check that nothing says things like "2 of 6 categories have an answer choice", "complete" or "incomplete".

### NO-2 Mouse
1. Reload. **Click** a choice.

**Hear:** "Selected answer choice …. Use TAB to move to a drop area." (no "Press ENTER to move selected answer choice…" text).
2. Click a category. The choice is placed; the placement sentence is read after a short pause.

### NO-3 Focus is not lost
After every keyboard drop above (PL-1, PL-2, PL-3, MV-1, MV-2, RM-1, RM-2) check that **focus is on a choice**, never on the page body (Tab afterwards continues from the choice, not from the top of the page). After a browse-mode drop (BR-3), focus stays on the category or pool you pressed **Enter** on.

### NO-4 A result is said once
1. Do PL-1, then wait 10 seconds without pressing anything. Nothing more is read.
2. Press **Shift+Tab**, then **Tab** back to the choice. **Hear** only "Answer choice: identifies a problem and suggests a solution in category Structure of Say Yes to Solar Energy", not the "Placed answer choice …" sentence again.

### NO-5 A reusable choice: focus goes to the one that landed
1. Open http://localhost:5222/categorize/deliver?demo=calculus-concepts (its choices can be reused, so a placed choice also stays in the pool). Reload.
2. **Tab** to a choice, **Enter**, **Tab**, **Enter**.

**Hear:** "Placed answer choice … in drop area for category …". Check that focus is on the choice inside the category, not on its copy in the pool. These choices are math, so they are named by their number ("number 1").

---

## Main idea demo (no limit per category, choices below)

Open http://localhost:5222/categorize/deliver?demo=screen-reader-main-idea and reload before each case. Press **Tab** until the screen reader says "Answer choice: …" (other page controls may come first).

### MI-1 Read the item (rows 1–4)
1. Put the screen reader cursor on the prompt "Drag each sentence into the correct category." and read on.

**Hear, in order:**
- "The question has 2 categories, which can each hold any number of answer choices. There are 4 answer choices, which cannot be reused."
- "Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel."
- "Category 1 Main Idea contains 0 answer choices."
- "Category 2 Supporting Detail contains 0 answer choices."
- "4 available answer choices. Answer choice: Anime is an animated cartoon from Japan. Answer choice: American fans enjoy anime clubs and stores. Answer choice: Anime is popular in the United States. Answer choice: The first color anime feature film was shown in the U.S. in 1961. End of available answer choices. Use TAB to move to an answer choice."

### MI-2 The simple success path (rows 5, 7, 9, 12)
1. **Tab** to choice P. **Hear:** "Answer choice: Anime is an animated cartoon from Japan." then "Press ENTER to select."
2. Press **Enter**. **Hear:** "Selected answer choice Anime is an animated cartoon from Japan.. Use TAB to move to a drop area." (the double full stop is just the sentence's own full stop followed by the spec's).
3. Press **Tab**. **Hear:** "Selected drop area for category Main Idea. Press ENTER to move selected answer choice Anime is an animated cartoon from Japan. here or TAB to move to a different drop area."
4. Press **Enter**. **Hear:** "Placed answer choice Anime is an animated cartoon from Japan. in drop area for category Main Idea." then "Answer choice: Anime is an animated cartoon from Japan. in category Main Idea". Focus stays on that choice.
5. **Tab** to choice R, press **Enter**, **Tab**, **Enter** (Main Idea again). **Hear** the same pattern with "Anime is popular in the United States." — no "limit reached" message, because there is no limit.
6. Read the intro again. **Hear:** "Category 1 Main Idea contains 2 answer choices. answer choice Anime is an animated cartoon from Japan. answer choice Anime is popular in the United States. End of answer choices." and "2 available answer choices. …".

### MI-3 Tab order while carrying a choice (rows 9, 10, 11)
1. **Tab** to choice Q, press **Enter**.
2. Press **Tab**: **Hear** "Selected drop area for category Main Idea. …".
3. Press **Tab**: **Hear** "Selected drop area for category Supporting Detail. …".
4. Press **Tab**: **Hear** "Press ENTER to leave selected answer choice American fans enjoy anime clubs and stores. unplaced or TAB to move to a category drop area."
5. Press **Shift+Tab**: **Hear** the Supporting Detail sentence again (reverse order works).
6. Press **Esc**. **Hear:** "Answer choice American fans enjoy anime clubs and stores. is no longer selected. Use TAB to move to an answer choice."

### MI-4 Move and remove (rows 6, 13, 10, 14)
1. Place P in Main Idea (MI-2 steps 1–4). **Tab** to it.
   **Hear:** "Answer choice: Anime is an animated cartoon from Japan. in category Main Idea".
2. **Enter**, **Tab** to Supporting Detail, **Enter**.
   **Hear:** "Moved answer choice Anime is an animated cartoon from Japan. from drop area for category Main Idea to drop area for category Supporting Detail."
3. **Tab** to that choice again, **Enter**, **Tab** until the pool.
   **Hear:** "Press ENTER to remove selected answer choice Anime is an animated cartoon from Japan. from drop area for category Supporting Detail or TAB to move to a category drop area."
4. **Enter**. **Hear:** "Removed answer choice Anime is an animated cartoon from Japan. from drop area for category Supporting Detail." The choice is back in the pool.

### MI-5 Mouse (nothing spoken for the keyboard)
1. **Click** choice Q. **Hear:** "Selected answer choice American fans enjoy anime clubs and stores.. Use TAB to move to a drop area." only — no "Press ENTER to move selected answer choice…".
2. **Click** the Supporting Detail category. Q is placed; after a short pause **hear** "Placed answer choice American fans enjoy anime clubs and stores. in drop area for category Supporting Detail."

### MI-6 Evaluate mode (no intro)
1. Switch the demo to **evaluate** mode (mode switch in the demo toolbar).
2. Read the page. **Hear no** structure/category/available-choices intro, and no "Press ENTER to select."

---

## Fractions demo (math read aloud, three categories)

Open http://localhost:5222/categorize/deliver?demo=screen-reader-fractions and reload before each case. Math is read as speech: a fraction such as 1/3 is "1 over 3". Your screen reader may also read the math in the prompt and on the page in its own way; the cases below are about the hidden text and the names this element supplies.

### FR-1 Read the item (rows 1–4)
1. Put the screen reader cursor on the prompt ("All of the fractions below have the same whole…") and read on past it.

**Hear, in order:**
- "The question has 3 categories, which can each hold any number of answer choices. There are 12 answer choices, which cannot be reused."
- "Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel."
- "Category 1 Less than 1 over 2 contains 0 answer choices."
- "Category 2 Equal to 1 over 2 contains 0 answer choices."
- "Category 3 Greater than 1 over 2 contains 0 answer choices."
- "12 available answer choices. Answer choice: 1 over 3 Answer choice: 1 over 4 Answer choice: 2 over 4 Answer choice: 2 over 3 Answer choice: 3 over 6 Answer choice: 2 over 5 Answer choice: 5 over 10 Answer choice: 12 over 10 Answer choice: 6 over 12 Answer choice: 3 over 12 Answer choice: 50 over 100 Answer choice: 5 over 3 End of available answer choices. Use TAB to move to an answer choice."

**Fail if** you hear "number 1", "number 2"… instead of the fractions.

### FR-2 Focus and select a fraction (rows 5, 7)
1. **Tab** until you hear a choice. **Hear:** "Answer choice: 1 over 3" then "Press ENTER to select."
2. Press **Tab** once more. **Hear:** "Answer choice: 1 over 4" then "Press ENTER to select."
3. Press **Shift+Tab** to return to 1/3 and press **Enter**.
   **Hear:** "Selected answer choice 1 over 3. Use TAB to move to a drop area."

### FR-3 Tab through all three categories and the pool (rows 9, 11)
Continue from FR-2 (1/3 is selected).

| # | You do | You should hear |
|---|---|---|
| 1 | Press **Tab**. | "Selected drop area for category Less than 1 over 2. Press ENTER to move selected answer choice 1 over 3 here or TAB to move to a different drop area." |
| 2 | Press **Tab**. | Same, with "category Equal to 1 over 2". |
| 3 | Press **Tab**. | Same, with "category Greater than 1 over 2". |
| 4 | Press **Tab**. | "Press ENTER to leave selected answer choice 1 over 3 unplaced or TAB to move to a category drop area." |
| 5 | Press **Shift+Tab**. | The "Greater than 1 over 2" sentence again. |
| 6 | Press **Esc**. | "Answer choice 1 over 3 is no longer selected. Use TAB to move to an answer choice." |

### FR-4 Place a fraction (rows 12, 6)
1. **Tab** to 1/3, press **Enter**, press **Tab** (Less than 1/2), press **Enter**.

**Hear:** "Placed answer choice 1 over 3 in drop area for category Less than 1 over 2." followed by "Answer choice: 1 over 3 in category Less than 1 over 2". Focus stays on that choice.

2. Place 5/3 in "Greater than 1/2" the same way (**Tab** to 5/3, **Enter**, **Tab** twice, **Enter**).

**Hear:** "Placed answer choice 5 over 3 in drop area for category Greater than 1 over 2."

3. Place 1/4 in "Less than 1/2" too. There is no limit, so there is no warning. Read the intro again.

**Hear:** "Category 1 Less than 1 over 2 contains 2 answer choices. answer choice 1 over 3 answer choice 1 over 4 End of answer choices." and "Category 3 Greater than 1 over 2 contains 1 answer choice. answer choice 5 over 3" and "9 available answer choices. …".

### FR-5 Move and remove (rows 13, 10, 14)
1. With 1/3 in "Less than 1/2", **Tab** to it. **Hear:** "Answer choice: 1 over 3 in category Less than 1 over 2".
2. Press **Enter**, **Tab** to "Equal to 1/2", press **Enter**.
   **Hear:** "Moved answer choice 1 over 3 from drop area for category Less than 1 over 2 to drop area for category Equal to 1 over 2."
3. With focus on 1/3, press **Enter**, then **Tab** until you hear the pool sentence.
   **Hear:** "Press ENTER to remove selected answer choice 1 over 3 from drop area for category Equal to 1 over 2 or TAB to move to a category drop area."
4. Press **Enter**. **Hear:** "Removed answer choice 1 over 3 from drop area for category Equal to 1 over 2." 1/3 is back in the pool.

### FR-6 Mouse
1. **Click** the fraction 2/3. **Hear:** "Selected answer choice 2 over 3. Use TAB to move to a drop area." and nothing about "Press ENTER to move…".
2. **Click** the "Greater than 1/2" box. After a short pause **hear:** "Placed answer choice 2 over 3 in drop area for category Greater than 1 over 2."

---

## Sentence purpose demo (one column, six numbered rows)

Open http://localhost:5222/categorize/deliver?demo=screen-reader-sentence-purpose and reload before each case. Below, "row N" means the table row labelled N, and every cell is in the one column "Purpose of the Sentence". While a choice is selected, **Tab** visits row 1, row 2 … row 6, then the pool.

### SP-1 Read the item (rows 1–4)
1. Put the screen reader cursor on the prompt ("Drag the purpose of each sentence…") and read on past the numbered sentences.

**Hear, in order:**
- "The question has 6 categories, arranged in a 1 by 6 matrix. Each category can hold 1 answer choice."
- "The column labels are: Column 1: Purpose of the Sentence"
- "The row labels are: Row 1: 1 Row 2: 2 Row 3: 3 Row 4: 4 Row 5: 5 Row 6: 6"
- "There are 6 answer choices, which cannot be reused."
- "Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel."
- Six lines: "The category in row 1 and column Purpose of the Sentence is empty." … through "The category in row 6 and column Purpose of the Sentence is empty."
- "6 available answer choices. Answer choice: to present limitations of the theory Answer choice: to state the theory … End of available answer choices. Use TAB to move to an answer choice."

**Fail if** any of the six lines says "column number 1" instead of the column heading.

### SP-2 Select a choice and visit every row (rows 5, 7, 9, 11)
1. **Tab** until you hear a choice. **Hear:** "Answer choice: to present limitations of the theory" then "Press ENTER to select."
2. Press **Enter**. **Hear:** "Selected answer choice to present limitations of the theory. Use TAB to move to a drop area."
3. Press **Tab**. **Hear:** "Selected drop area for category in row 1 and column Purpose of the Sentence. Press ENTER to move selected answer choice to present limitations of the theory here or TAB to move to a different drop area."
4. Press **Tab** five more times. Each time **hear** the same sentence for the next row ("in row 2 …", "in row 3 …" … "in row 6 …").
5. Press **Tab** once more. **Hear:** "Press ENTER to leave selected answer choice to present limitations of the theory unplaced or TAB to move to a category drop area."
6. Press **Esc**. **Hear:** "Answer choice to present limitations of the theory is no longer selected. Use TAB to move to an answer choice."

### SP-3 Place a choice (rows 12, 6)
1. **Tab** to "to state the theory". Press **Enter**, **Tab** twice (row 2), **Enter**.

**Hear:** "Placed answer choice to state the theory in drop area for category in row 2 and column Purpose of the Sentence." followed by "Answer choice: to state the theory in category in row 2 and column Purpose of the Sentence". Focus stays on that choice.

2. Read the intro again. **Hear:** "The category in row 2 and column Purpose of the Sentence contains answer choice to state the theory." and "5 available answer choices. …".

### SP-4 Replace the choice in a cell (row 12)
Continue from SP-3 ("to state the theory" is in row 2).
1. **Tab** to "to give evidence that the theory is correct". Press **Enter**, **Tab** twice (row 2), **Enter**.

**Hear:** "Placed answer choice to give evidence that the theory is correct in drop area for category in row 2 and column Purpose of the Sentence. To make room for it, answer choice to state the theory was removed." followed by the new name of the choice that landed.

2. Check that "to state the theory" is back in the pool.

### SP-5 Move between rows (rows 6, 13)
1. Place "to state the theory" in row 1 (**Tab** to it, **Enter**, **Tab** once, **Enter**).
2. **Tab** to it. **Hear:** "Answer choice: to state the theory in category in row 1 and column Purpose of the Sentence"
3. Press **Enter**, **Tab** twice (row 3), **Enter**.

**Hear:** "Moved answer choice to state the theory from drop area for category in row 1 and column Purpose of the Sentence to drop area for category in row 3 and column Purpose of the Sentence."

### SP-6 Remove a choice (rows 10, 14)
Continue from SP-5 ("to state the theory" is in row 3).
1. With focus on it, press **Enter**, then press **Tab** until you hear the pool sentence (rows 4, 5, 6, then the pool).

**Hear:** "Press ENTER to remove selected answer choice to state the theory from drop area for category in row 3 and column Purpose of the Sentence or TAB to move to a category drop area."

2. Press **Enter**. **Hear:** "Removed answer choice to state the theory from drop area for category in row 3 and column Purpose of the Sentence." The choice is back in the pool.

### SP-7 Mouse
1. **Click** "to explain the purpose of the paragraph". **Hear:** "Selected answer choice to explain the purpose of the paragraph. Use TAB to move to a drop area." and nothing about "Press ENTER to move…".
2. **Click** the row 1 cell. After a short pause **hear:** "Placed answer choice to explain the purpose of the paragraph in drop area for category in row 1 and column Purpose of the Sentence."
