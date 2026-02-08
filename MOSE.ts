import { getHighestCERNode } from './getHighestCERNode.js';
import { MountObserver } from 'mount-observer/MountObserver.js';
import { MountEvent, mountEventName } from 'mount-observer/Events.js'

/**
 * Type for a constructor that can be extended
 */
type Constructor<T = HTMLElement> = new (...args: any[]) => T;

/**
 * Symbol to track if MountObserver has been set up for an element
 */
const MOUNT_OBSERVER_SETUP = Symbol.for('cteH9dMG-UWwxVaMwFgvQA');

/**
 * MOSE (Mount Observer Script Element) Mixin
 * 
 * This mixin adds functionality to:
 * 1. Check for duplicate custom element registrations within the same custom element registry scope
 * 2. Monitor for <script type="mountobserver"> elements and apply their configurations
 * 
 * @param Base - The base class to extend
 * @returns Extended class with MOSE functionality
 */
export function MOSE<T extends Constructor<HTMLElement>>(Base: T) {
    return class extends Base {
        #mountObserver: MountObserver | undefined;

        constructor(...args: any[]) {
            super(...args);
            this.#checkForDuplicateRegistration();
            this.#setupMountObserver();
        }

        #checkForDuplicateRegistration() {
            // Get the tag name of this element
            // const tagName = this.tagName.toLowerCase();
            const {localName} = this;

            // Find the highest node with the same custom element registry
            const highestCERNode = getHighestCERNode(this) as DocumentFragment;

            if (!highestCERNode) {
                return;
            }

            // Get the custom element registry for this scope
            // const registry = (highestCERNode as any).customElementRegistry as CustomElementRegistry | undefined;

            // // If there's no custom registry, use the global one
            // const targetRegistry = registry || customElements;

            // Check if an element with this name is already defined in this registry
            try {
                const existingTags =Array.from(highestCERNode.querySelectorAll(localName)).filter(x => x !== this);
                
                if (existingTags.length > 0) {
                    throw new Error(
                        `Custom element "${localName}" is already defined in this custom element registry scope.`
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

        async #setupMountObserver() {
            // Find the highest node with the same custom element registry
            const highestCERNode = getHighestCERNode(this);

            if (!highestCERNode) {
                return;
            }

            // Check if MountObserver has already been set up for this element
            const existingObserver = (highestCERNode as any)[MOUNT_OBSERVER_SETUP];
            if (existingObserver) {
                // Subscribe to the existing observer's mount event and re-dispatch from this element
                existingObserver.addEventListener(mountEventName, (e: MountEvent) => {
                    const {mountedElement} = e;
                    if(this.contains(mountedElement)){
                        this.dispatchEvent(e);
                    }
                });
                return;
            }

            // Set up MountObserver to watch for <script type="mountobserver"> elements
            this.#mountObserver = new MountObserver({
                whereElementMatches: 'script[type="mountobserver"]',
                do: async (scriptElement: Element) => {
                    await this.#processScriptElement(scriptElement as HTMLScriptElement, highestCERNode);
                }
            });

            // Mark that we've set up the MountObserver for this element
            (highestCERNode as any)[MOUNT_OBSERVER_SETUP] = this.#mountObserver;

            this.#mountObserver.observe(highestCERNode);
        }

        async #processScriptElement(scriptElement: HTMLScriptElement, rootNode: Node) {
            let config: any = {};

            // Step 1: Check if script has src attribute and load JSON
            const src = scriptElement.getAttribute('src')
            if (src) {
                try {
                    const response = await import(src, {with: {type: 'json'}});
                    config = structuredClone(response.default);
                } catch (error) {
                    console.error(`Failed to load JSON from ${scriptElement.src}:`, error);
                    return;
                }
            }

            // Step 2: If innerHTML is non-trivial, parse and merge it
            const innerHTML = scriptElement.innerHTML.trim();
            if (innerHTML) {
                try {
                    const parsedJSON = JSON.parse(innerHTML);
                    
                    // Step 3: Import assignGingerly and merge
                    const { assignGingerly } = await import('assign-gingerly/assignGingerly.js');
                    config = assignGingerly(config, parsedJSON, {
                        registry: (<any>scriptElement).customElementRegistry.assignGingerlyRegistry
                    });
                } catch (error) {
                    console.error('Failed to parse script innerHTML as JSON:', error);
                    return;
                }
            }

            // Step 4: Apply MountObserver with the merged config
            if (Object.keys(config).length > 0) {
                try {
                    const observer = new MountObserver(config);
                    observer.observe(rootNode);
                } catch (error) {
                    console.error('Failed to create MountObserver with config:', error);
                }
            }
        }
    };
}
