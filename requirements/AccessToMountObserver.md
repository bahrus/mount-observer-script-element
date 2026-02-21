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

We need MyElement to be able to passed each script element and the mount observer instance created from it.

