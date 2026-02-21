# Copy mountobserver script elements from container

Add a method `#getContainerMOSEs(highestCERNode: Node)` that is called at the end of `#checkForDuplicateRegistration()`.

What this method does:

1. If highestCERNode is the document root, return early (don't do anything)
2. Get the parent node:
   - If highestCERNode is an Element, get its parentElement
   - If highestCERNode is a ShadowRoot, get its host property
3. Find the highestCERNode of the parent node obtained from step 2
4. If the parent's highestCERNode exists and has a querySelector method, search for an element with the same localName as the current element instance. Call it "parentCE". If not found, exit.
5. If the highestCERNode passed into the method contains the parentCE, exit quietly
6. Call `#cloneAndAppendScripts(parentCE)` to clone all script elements with type="mountobserver" from parentCE
7. Add an event listener to parentCE for the "mount" event (using mountEventName). When a mount event occurs, check if the mountedElement is an HTMLScriptElement with type="mountobserver", and if so, call `#cloneAndAppendScripts(parentCE)` again

Create a helper method `#cloneAndAppendScripts(sourceElement: Element)`:

1. Find all script elements with type="mountobserver" in the sourceElement
2. For each script, get its src attribute
3. Check if a script with the same src attribute already exists in the current element
4. Only clone and append scripts that don't already exist (to avoid duplicates)

