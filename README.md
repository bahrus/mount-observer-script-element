# mount-observer-script-element

This package provides a TypeScript mixin (MOSE) that enables inherited, declarative configuration of [MountObserver](https://www.npmjs.com/package/mount-observer) instances through `<script type="mountobserver">` elements.  Inheritance is applied via Scoped Custom Element Registry hierarchies (tested with Chrome 146+).  Safari/WebKit in theory supports this also, but for some reason is not yet supported by Playwright on windows.

## Overview

The MOSE (Mount Observer Script Element):

1. Causes some much needed global browser enhancements to get applied globally, namely:
    1.  [Makes declarative script elements able to export modules](https://github.com/bahrus/mount-observer?tab=readme-ov-file#exposing-module-exports-from-script-elements)
    2.  Bootstraps support for [mountobserver script elements ](https://github.com/bahrus/mount-observer?tab=readme-ov-file#exposing-module-exports-from-script-elements)
    3.  Optimizes repeated use of templates by [hoisting them to the document root](https://github.com/bahrus/mount-observer?tab=readme-ov-file#hoisting-templates-for-performance).
    4.  Enables [intra document HTML Includes](https://github.com/bahrus/mount-observer?tab=readme-ov-file#intra-document-html-includes-with-htmlinclude) with support for dynamic weaving of dynamic content.
2.  Syncs up mountobserver script elements from the parent ShadowRoot, while enabling the ability to exclude / include groups of mountobservers that are applicable to the ShadowRoot 

## Basic Usage

```TypeScript

import { MOSE } from 'mount-observer-script-element/MOSE.js';

class BeHive extends MOSE(HTMLElement) {
    constructor() {
        super();
    }
}

customElements.define('be-hive', BeHive);
```

```html
<be-hive include="beABeacon beCounted">
    <b></b>
</be-hive>
```

Typically, in practice, there will not be such an attribute (include-ids), but it is an option that the MOSE mixin supports.  The property of the mixin, includeIds, corresponds to this attribute

What this does:

If the element has no light children with matching id's, it births light children matching the included ids, after discovering the 

```html
<be-hive>
    <b></b>
    <template src="#be-hive.beABeacon"></template>
    <template src="#be-hive.beCounted"></template>
</be-hive>
```

It might insert more (see below for why):



For all existing mount-observer script element children that my-element finds, which lack id's, it adds (numbered) id's:

```html
<my-element>
    <script type=mountobserver>{
        "whenDefined": "my-element",
        ...
    }</script>
    <script type=mountobserver src="myConfig.json"></script>
    <script type=mountobserver id=your-config src="myConfig.json"></script>
</my-element>
```

becomes:

```html
<my-element>
    <script id=my-element-src-0 type=mountobserver>{
        "whenDefined": "my-element",
        ...
    }</script>
    <script id=my-element-src-1 type=mountobserver src="myConfig.json"></script>
    <script type=mountobserver id=your-config src="myConfig.json"></script>
</my-element>
```

## Specifications [TODO]

1.  `<script type="mountobserver">` elements whose parent element name matches that of a custom element don't become activated from externally.  This package proposal polyfill does provide a mixin that framework authors can use to define a 

## Features

### 1. Declarative MountObserver Configuration

Place `<script type="mountobserver">` elements inside your custom element that  to configure proper scoped custom element registry inheritance and activating mountobserver script elements (MOSEs):

```html
<my-element>
    <script type="mountobserver">
    {
        "matching": "input",
        "assignOnMount": {
            "placeholder": "Enter text...",
            "?.style?.backgroundColor": "#f0f0f0"
        }
    }
    </script>
</my-element>
```

### 2. External JSON Configuration

Load configuration from external JSON files:

```html
<script type="mountobserver" src="./config.json"></script>
```

The JSON file will be loaded using JSON import with `import(src, {with: {type: 'json'}})`.

### 3. Merging Configurations 

We can combine external and inline configurations. The inline JSON will be merged with the external configuration using [assign-gingerly](https://www.npmjs.com/package/assign-gingerly):

```html
<script type="mountobserver" src="./base-config.json">
{
    "assignOnMount": {
        "?.style?.color": "red"
    }
}
</script>
```

### 4. Script Inheritance

Child custom elements automatically inherit mountobserver scripts from parent Custom Element Registry scopes:

```html
<!-- outer custom element scope -->
<my-element>
    <script type="mountobserver" src="./shared-config.json"></script>
    
    ...
    <!-- inner custom element scope -->
    <my-element>
        <!-- This child element automatically inherits the outer registry MOSEs -->
        <button>I inherit the configuration</button>
    </my-element>
</my-element>
```

**How it works:**
- When a MOSE element is created, it searches for a containing scope element with the same `localName`
- It clones all `<script type="mountobserver">` elements from the parent
- Scripts with duplicate `src` attributes are not cloned (avoiding duplicates)
- The child element listens for mount events on the containing scope element to inherit dynamically added scripts

### 5. Excluding Inherited Scripts

Use the `exclude` property or attribute to prevent specific scripts from being inherited:

```html
<my-element exclude="script[src*='unwanted']">
    <!-- Scripts matching the exclude selector won't be inherited -->
</my-element>
```

```typescript
class MyElement extends MOSE(HTMLElement) {
    exclude = "script[data-skip]";
}
```

### 6. Scoped Custom Element Registry Support

The mixin works with Chrome's scoped custom element registries:

```typescript
const customRegistry = new CustomElementRegistry();

class ScopedElement extends MOSE(HTMLElement) {
    constructor() {
        super();
    }
}

customRegistry.define('scoped-element', ScopedElement);

const element = document.createElement('scoped-element', {
    customElementRegistry: customRegistry
});
```

### 7. Duplicate Element Detection

The mixin prevents multiple instances of the same custom element within the same registry scope:

```typescript
// This will throw an error if another element with the same localName
// already exists in the same highestCERNode scope
```

### 8. Event Propagation

When multiple MOSE elements share the same highestCERNode, mount events are propagated:

```typescript
myElement.addEventListener('mount', (e) => {
    // Receives mount events for elements within this element
    console.log('Element mounted:', e.mountedElement);
});
```

### 9. Stray Script Element Support

MOSE also processes "stray" mountobserver script elements that are not direct children of a MOSE custom element. This allows you to place script elements anywhere in the DOM, and they will be processed when their parent is a custom element:

```html
<my-custom-element>
    <div>
        <script type="mountobserver">
        {
            "matching": "button",
            "assignOnMount": {
                "disabled": true
            }
        }
        </script>
        <button>I will be disabled</button>
    </div>
</my-custom-element>
```

**How it works:**
- When a mountobserver script is detected that's not contained within a MOSE element
- The script's parent element is checked to see if it's a custom element (has a hyphen in localName)
- If so, the script is processed using the parent's registry scope
- Each script is marked as processed (via `data-mose-processed`) to prevent duplicate processing

This feature enables more flexible placement of configuration scripts throughout your component tree.

### 10. Accessing MountObserver Instances

MOSE provides three ways to access the MountObserver instances created from script elements:

#### A. Direct Access via Map

```typescript
class MyElement extends MOSE(HTMLElement) {
    someMethod() {
        // Access all observers
        for (const [script, observer] of this.mountObservers) {
            console.log('Script:', script);
            console.log('Observer:', observer);
        }
    }
}
```

#### B. Lifecycle Callback Method

```typescript
class MyElement extends MOSE(HTMLElement) {
    // Override this method to receive notifications
    protected onMountObserverCreated(
        scriptElement: HTMLScriptElement, 
        observer: MountObserver, 
        rootNode: Node
    ) {
        console.log('Observer created for script:', scriptElement);
        
        // Add custom event listeners
        observer.addEventListener('mount', (e) => {
            console.log('Element mounted:', e.mountedElement);
        });
    }
}
```

#### C. Custom Events

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

**When to use each approach:**
- **Map**: When you need to query all observers at once
- **Callback**: When subclassing and want type-safe notifications
- **Events**: When listening from external code or need loose coupling

## API

### MOSE Mixin

```typescript
function MOSE<T extends Constructor<HTMLElement>>(Base: T): T
```

A TypeScript mixin that adds MountObserver script element functionality to any HTMLElement class.


## How It Works

1. **Initialization**: When a MOSE element is constructed:
   - Checks for duplicate elements in the same registry scope
   - Copies mountobserver scripts from parent elements (inheritance)
   - Sets up a MountObserver to watch for `<script type="mountobserver">` elements

2. **Script Processing**: When a mountobserver script is found:
   - Loads external JSON if `src` attribute is present
   - Parses inline JSON from `innerHTML`
   - Merges configurations using assignOnMount
   - Creates a MountObserver with the merged configuration

3. **Registry Scoping**: 
   - Uses `mountObserver/getRootRegistryContainr.js` to find the appropriate scope
   - Ensures only one MOSE element with that name per rootRegistryNode.
   - Stores observer reference using `Symbol.for('cteH9dMG-UWwxVaMwFgvQA')`

## Example: Complete Setup

```html
<!DOCTYPE html>
<html>
<head>
    <script type="importmap">
    {
        "imports": {
            "mount-observer/": "/node_modules/mount-observer/",
            "assign-gingerly/": "/node_modules/assign-gingerly/"
        }
    }
    </script>
</head>
<body>
    <script type="module">
        import { MOSE } from './MOSE.js';

        class MyElement extends MOSE(HTMLElement) {
            constructor() {
                super();
            }
        }

        customElements.define('my-element', MyElement);
    </script>

    <my-element>
        <script type="mountobserver">
        {
            "matching": "button",
            "assignOnMount": {
                "disabled": false,
                "?.dataset?.action": "submit",
                "?.style": {
                    "color": "green",
                    "height": "25px"
                }
            }
        }
        </script>
        <button>I am here</button>
    </my-element>
</body>
</html>
```

Result:
```html
<button 
    data-action="submit" 
    style="color: green; height: 25px;">
    I am here
</button>
```

## Dependencies

- [mount-observer](https://www.npmjs.com/package/mount-observer) - Core MountObserver functionality
- [assign-gingerly](https://www.npmjs.com/package/assign-gingerly) - Property assignment with nested support

## Browser Support

Requires Chrome 146+ with Scoped Custom Element Registry support enabled.

## Testing

Manual test files are available in the `tests/` directory:

- `tests/simple.html` - Basic usage example
- `tests/inheritance.html` - Script inheritance example
- `tests/exclude.html` - Exclude functionality example
- `tests/getHighestCERNode.html` - Registry scoping tests

Run the development server:

```bash
npm run serve
```

Then open test files in Chrome Canary with scoped custom element registries enabled.

## TypeScript

The package is written in TypeScript and includes type definitions. Both `.ts` and compiled `.js` files are included in the repository.

To compile:

```bash
tsc
```

## License

MIT
