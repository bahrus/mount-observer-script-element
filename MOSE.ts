import { getHighestCERNode } from './getHighestCERNode.js';

/**
 * Type for a constructor that can be extended
 */
type Constructor<T = HTMLElement> = new (...args: any[]) => T;

/**
 * MOSE (Mount Observer Script Element) Mixin
 * 
 * This mixin adds functionality to check for duplicate custom element registrations
 * within the same custom element registry scope.
 * 
 * @param Base - The base class to extend
 * @returns Extended class with MOSE functionality
 */
export function MOSE<T extends Constructor<HTMLElement>>(Base: T) {
    return class extends Base {
        constructor(...args: any[]) {
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
            const registry = (highestCERNode as any).customElementRegistry as CustomElementRegistry | undefined;

            // If there's no custom registry, use the global one
            const targetRegistry = registry || customElements;

            // Check if an element with this name is already defined in this registry
            try {
                const existingDefinition = targetRegistry.get(tagName);
                
                if (existingDefinition) {
                    throw new Error(
                        `Custom element "${tagName}" is already defined in this custom element registry scope.`
                    );
                }
            } catch (error) {
                // If get() throws, it means the element isn't registered yet, which is fine
                // But if it's our error, re-throw it
                if (error instanceof Error && error.message.includes('already defined')) {
                    throw error;
                }
            }
        }
    };
}
