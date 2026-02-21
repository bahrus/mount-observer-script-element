# Access To Mount Observer

We need the custom elements that apply the MOSE mixin:

```TypeScript
import { MOSE } from 'mount-observer-script-element/MOSE.js';

class MyElement extends MOSE(HTMLElement) {
    constructor() {
        super();
    }
}

customElements.define('my-element', MyElement);
```

We need MyElement to be able to access each script element and the mount observer instance created from it.

## Suggested Approaches

### Option 1: Lifecycle Callback Method (Recommended)

Add a protected/public method that subclasses can override to receive notifications:

```typescript
class MyElement extends MOSE(HTMLElement) {
    // Override this method to receive script/observer pairs
    onMountObserverCreated(scriptElement: HTMLScriptElement, observer: MountObserver, rootNode: Node) {
        console.log('Script processed:', scriptElement);
        console.log('Observer created:', observer);
        
        // Can add custom event listeners
        observer.addEventListener('mount', (e) => {
            console.log('Element mounted:', e.mountedElement);
        });
    }
}
```

**Implementation**: In `#processScriptElement`, after creating the observer, check if `this.onMountObserverCreated` exists and call it.

**Pros**: 
- Clean, object-oriented approach
- Easy to understand and use
- Type-safe
- Follows common lifecycle pattern

**Cons**: 
- Requires subclass to override method
- Only works for direct subclasses

---

### Option 2: Custom Events

Dispatch custom events from the MOSE element when observers are created:

```typescript
class MyElement extends MOSE(HTMLElement) {
    constructor() {
        super();
        this.addEventListener('mose:observer-created', (e: CustomEvent) => {
            const { scriptElement, observer, rootNode } = e.detail;
            console.log('Observer created:', observer);
        });
    }
}
```

**Implementation**: In `#processScriptElement`, dispatch a custom event with the details.

**Pros**:
- Flexible - can listen from anywhere
- Doesn't require method override
- Multiple listeners possible
- Works with event delegation

**Cons**:
- Less type-safe (unless using custom event classes)
- Event detail is untyped by default

---

### Option 3: Public Property/Map

Store observers in a public property that can be accessed:

```typescript
class MyElement extends MOSE(HTMLElement) {
    // Automatically populated by MOSE mixin
    mountObservers: Map<HTMLScriptElement, MountObserver>;
    
    someMethod() {
        // Access all observers
        for (const [script, observer] of this.mountObservers) {
            console.log('Script:', script, 'Observer:', observer);
        }
    }
}
```

**Implementation**: Add a public `mountObservers` Map property and populate it in `#processScriptElement`.

**Pros**:
- Direct access to all observers
- Can iterate over all script/observer pairs
- Simple to implement

**Cons**:
- No notification when new observers are added
- Requires polling or manual checking
- Memory management concerns (should use WeakMap?)

---

### Option 4: Hybrid Approach (Best of All Worlds)

Combine multiple approaches:

```typescript
export function MOSE<T extends Constructor<HTMLElement>>(Base: T) {
    return class extends Base {
        // Public map for direct access
        readonly mountObservers = new Map<HTMLScriptElement, MountObserver>();
        
        // Optional callback method
        protected onMountObserverCreated?(
            scriptElement: HTMLScriptElement, 
            observer: MountObserver, 
            rootNode: Node
        ): void;
        
        async #processScriptElement(scriptElement: HTMLScriptElement, rootNode: Node) {
            // ... existing processing code ...
            
            const observer = new MountObserver(config);
            observer.observe(rootNode);
            
            // Store in map
            this.mountObservers.set(scriptElement, observer);
            
            // Call lifecycle method if defined
            this.onMountObserverCreated?.(scriptElement, observer, rootNode);
            
            // Dispatch event
            this.dispatchEvent(new CustomEvent('mose:observer-created', {
                detail: { scriptElement, observer, rootNode }
            }));
        }
    };
}
```

**Pros**:
- Maximum flexibility
- Supports all use cases
- Type-safe callback method
- Event-based for loose coupling
- Direct access via map

**Cons**:
- More complex implementation
- Multiple ways to do the same thing (could be confusing)

---

## Recommendation

I recommend **Option 4 (Hybrid Approach)** because:

1. The `mountObservers` Map provides direct access for simple cases
2. The `onMountObserverCreated` callback is clean and type-safe for subclasses
3. The custom event allows external code to listen without subclassing
4. All three mechanisms work together without conflict

This gives maximum flexibility while maintaining clean, idiomatic TypeScript code.

