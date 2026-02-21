# Look for strays or stand-alone mount observer script elements

The MOSE mixin is mostly focused on MOSEs (MountObserver Script Elements) contained within its node.

However, it would be nice to also support "stray" MOSEs that are not children of a custom element.

So in the code where we have:

```JavaScript
existingObserver.addEventListener(mountEventName, (e: MountEvent) => {
    const {mountedElement} = e;
    if(this.contains(mountedElement)){
        this.dispatchEvent(e);
    }
});
```

We should add an else condition, with code something like this:

```JavaScript
existingObserver.addEventListener(mountEventName, (e: MountEvent) => {
    const {mountedElement} = e;
    const mountedScriptElement = mountedElement as HTMLScriptElement;
    
    // Skip if already processed
    if(mountedScriptElement.dataset?.moseProcessed) return;
    mountedScriptElement.dataset.moseProcessed = 'true';
    
    if(this.contains(mountedElement)){
        this.dispatchEvent(e);
    } else {
        // Handle stray script elements
        const {parentElement} = mountedScriptElement;
        if(parentElement === null) return;
        
        const {localName} = parentElement;
        if(!localName.includes('-')) return;
        
        const highestCERNode = getRootRegistryContainer(parentElement);
        if(!highestCERNode) return;
        
        this.#processScriptElement(mountedScriptElement, highestCERNode);
    }
});
```

## Notes:

- The `matching: 'script[type="mountobserver"]'` selector guarantees that `mountedElement` is an HTMLScriptElement with type="mountobserver", so no additional type checking is needed
- Using `const mountedScriptElement = mountedElement as HTMLScriptElement` makes the code cleaner and provides proper typing throughout