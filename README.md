# PIE Elements NG

This project is meant to eventually replace the current pie-elements project with the following improvements:

- Current libraries (work underway in pie-elements to upgrade React, MUI, migrate to Tiptap, etc)
- PIE full on board with ESM
- Vite builds, improved tools (like CLI support, demos, etc)
- Better testing support

It includes scripting to help pie-elements migrate to this project.

## Getting started

For now, pre-migration, use these scripts:

`bun cli upstream:update` - This assumes that pie-elements is checked out as a sibling project; it will analyze the current state of that project and copy over what it thinks is ready for ESM packaging. It includes some rewrites and restructuring to make sure it fits in the new project layout.

`bun cli dev:demo multiple-choice` - Test one of the migrated PIE elements in this project. Besides starting a simple demo server, it also starts what is basically an ESM proxy so that references to @pie-element and @pie-lib load from the local system and all other dependencies go to esm.sh.

TODO [fill in more documentation when this comes closer to switching to]
