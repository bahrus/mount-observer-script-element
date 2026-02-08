import { getHighestCERNode } from './getHighestCERNode.js';
/**
 * MOSE (Mount Observer Script Element) Mixin
 *
 * This mixin adds functionality to check for duplicate custom element registrations
 * within the same custom element registry scope.
 *
 * @param Base - The base class to extend
 * @returns Extended class with MOSE functionality
 */
export function MOSE(Base) {
    return class extends Base {
        constructor(...args) {
            super(...args);
            this.#checkForDuplicateRegistration();
        }
        #checkForDuplicateRegistration() {
            // Get the tag name of this element
            const tagName = this.tagName.toLowerCase();
            // Find the highest node with the same custom element registry
            const highestCERNode = getHighestCERNode(this);
            if (!highestCERNode) {
                return;
            }
            // Get the custom element registry for this scope
            const registry = highestCERNode.customElementRegistry;
            // If there's no custom registry, use the global one
            const targetRegistry = registry || customElements;
            // Check if an element with this name is already defined in this registry
            try {
                const existingDefinition = targetRegistry.get(tagName);
                if (existingDefinition) {
                    throw new Error(`Custom element "${tagName}" is already defined in this custom element registry scope.`);
                }
            }
            catch (error) {
                // If get() throws, it means the element isn't registered yet, which is fine
                // But if it's our error, re-throw it
                if (error instanceof Error && error.message.includes('already defined')) {
                    throw error;
                }
            }
        }
    };
}
