# Unique mountobserver for mountobserver script elements

Method #setupMountObserver() should only be invoked once per highestCERNode, regardless of how many custom elements utilize the MOSE mixin. 

Implementation:

1. Use `Symbol.for('cteH9dMG-UWwxVaMwFgvQA')` as the key to track if a MountObserver has been set up
2. Store the actual MountObserver instance (not just a boolean) in `(highestCERNode as any)[MOUNT_OBSERVER_SETUP]`
3. When an existing observer is found, subscribe to its mount events and re-dispatch them from the current element (see Requirement 5)