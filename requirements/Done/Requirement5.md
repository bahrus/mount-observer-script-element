# Notify of mount observer children

In #setupMountObserver, if an observer is already found, instead of just returning, we need to add code that does the following:

1. Import `MountEvent` and `mountEventName` from 'mount-observer/Events.js'
2. Subscribe to the existing observer's mount event using `mountEventName`
3. In the event handler, extract the `mountedElement` from the `MountEvent`
4. Check if `this.contains(mountedElement)` - only proceed if the mounted element is within this custom element
5. If the check passes, re-dispatch the event from this custom element instance using `this.dispatchEvent(e)`

Additionally:

6. Change the `MOUNT_OBSERVER_SETUP` symbol to use `Symbol.for('cteH9dMG-UWwxVaMwFgvQA')` instead of a regular Symbol
7. Store the actual MountObserver instance (not just `true`) in `(highestCERNode as any)[MOUNT_OBSERVER_SETUP]`
8. In `#processScriptElement`, when loading JSON from src, use `structuredClone(response.default)` instead of just `response.default`
9. When calling `assignGingerly`, pass a third parameter with the registry: `{registry: (<any>scriptElement).customElementRegistry.assignGingerlyRegistry}`
