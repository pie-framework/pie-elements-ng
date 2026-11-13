---
"@pie-element/placement-ordering": minor
---

An item without response areas (`placementArea: false`) is reordered by keyboard through buttons on each object instead of the keyboard drag. Each object has an up/left and a down/right button that move it one position, the first having no up/left and the last no down/right. Tab visits down/right of position 1, then up/left and down/right of each next position, and no longer stops on the objects themselves. Focus stays on the object that moved, a move is announced, and dragging from a button still drags the object. Items with response areas are unchanged.
