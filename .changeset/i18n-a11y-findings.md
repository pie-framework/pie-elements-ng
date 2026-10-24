---
"@pie-element/multiple-choice": patch
"@pie-element/fraction-model": patch
---

Multiple choice says the key text of an image choice in the chrome language. Its number and letter shortcuts (`keyboardEventsEnabled`) act only while focus is in the item, ignore modified keys and text fields, and match the typed letter before the physical key, so AZERTY and Arabic layouts select the choice they name.

Fraction model's count fields accept Arabic-Indic and Extended Arabic-Indic digits, which its number inputs dropped.
