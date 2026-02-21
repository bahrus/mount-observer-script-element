# mount-observer-script-element custom element mixin

Please define a custom element mixin called MOSE that:

1. Finds the highest CERNode containing the element using getHighestCERNode.ts
2. Checks if there is already a custom element with the same localName as the current element within the highestCERNode scope by using querySelectorAll and filtering out the current element. If any matching elements are found, throws an error.
3. After the duplicate check, calls `#getContainerMOSEs(highestCERNode)` to copy mountobserver script elements from parent containers (see Requirement 6).
