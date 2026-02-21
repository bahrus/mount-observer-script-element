# getHighestCERNode

Chrome Canary now has support for Scoped Custom Element Registries.

Because it is so cutting edge, we can't create and run playwright tests for now.

However, it makes sense to create test html pages in the tests folder that can be used to test this functionality manually for now.

See demo/scopedCustomElementRegistry.html as an example of such a page.

Each element now has a property, "customElementRegistry". "Scoping" is allowed within a shadowRoot, meaning elements within a shadowRoot can have their own customElementRegistry.

Define a module, 'getHighestCERNode.ts' with a function of the same name that takes as a parameter a Node, and recursively traverses up using parentElement and getRootNode(), checking if the customElementRegistry matches. Stop at the root node and return the highest node with a customElementRegistry that matches the passed in element.

