---
"@pie-element/multiple-choice": patch
"@pie-element/fraction-model": patch
---

Multiple choice keeps math out of choice names for content in a language other than English, since its math names are English speech, and says the default key text in the chrome language. Its number and letter shortcuts (`keyboardEventsEnabled`) act only while focus is in the item, ignore modified keys and text fields, and match the typed letter before the physical key, so AZERTY and Arabic layouts select the choice they name.

Fraction model's count fields accept Arabic-Indic and Extended Arabic-Indic digits, which its number inputs dropped.
