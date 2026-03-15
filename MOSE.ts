import { getRegistryRoot } from 'mount-observer/getRegistryRoot.js';
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
        
        /**
         * Public map of script elements to their created MountObserver instances
         */
        readonly mountObservers = new Map<HTMLScriptElement, MountObserver>();
        
        /**
         * Optional callback method that subclasses can override to receive notifications
         * when a MountObserver is created from a script element
         */
        protected onMountObserverCreated?(
            scriptElement: HTMLScriptElement, 
            observer: MountObserver, 
            rootNode: Node
        ): void;

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
            const rootRegContainer = getRegistryRoot(this) as DocumentFragment;

            if (!rootRegContainer) {
                return;
            }

            // Get the custom element registry for this scope
            // const registry = (highestCERNode as any).customElementRegistry as CustomElementRegistry | undefined;

            // // If there's no custom registry, use the global one
            // const targetRegistry = registry || customElements;

            // Check if an element with this name is already defined in this registry
            try {
                const existingTags =Array.from(rootRegContainer.querySelectorAll(localName)).filter(x => x !== this);
                
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

            // Copy mountobserver script elements from container
            this.#getContainerMOSEs(rootRegContainer);
        }

        #getContainerMOSEs(highestCERNode: Node) {
            // Step 1: Don't do anything if highestCERNode is the document root
            if (highestCERNode === document) {
                return;
            }

            // Step 2: Get parent element or host
            let parentNode: Element | null = null;
            if (highestCERNode instanceof Element) {
                parentNode = highestCERNode.parentElement;
            } else if (highestCERNode instanceof ShadowRoot) {
                parentNode = highestCERNode.host;
            }

            if (!parentNode) {
                return;
            }

            // Step 3: Find the highestCERNode of the parent
            const parentHighestCERNode = getRegistryRoot(parentNode);

            // Find parent custom element with same localName
            if (!parentHighestCERNode || !('querySelector' in parentHighestCERNode)) {
                return;
            }

            const parentCE = (parentHighestCERNode as DocumentFragment).querySelector(this.localName);
            if (!parentCE) {
                return;
            }

            // If highestCERNode contains parentCE, exit
            if ((highestCERNode as DocumentFragment).contains?.(parentCE)) {
                return;
            }

            // Clone and append script elements
            this.#cloneAndAppendScripts(parentCE);

            // Add event listener for future mount events
            parentCE.addEventListener(mountEventName, (e: Event) => {
                const mountedElement = (e as MountEvent).mountedElement;
                if (mountedElement instanceof HTMLScriptElement && mountedElement.type === 'mountobserver') {
                    this.#cloneAndAppendScripts(parentCE);
                }
            });
        }

        #cloneAndAppendScripts(sourceElement: Element) {
            const scripts = Array.from(sourceElement.querySelectorAll('script[type="mountobserver"]')) as HTMLScriptElement[];
            
            // Get exclude value from property or attribute
            const exclude = (this as any).exclude ?? this.getAttribute('exclude');
            
            for (const script of scripts) {
                // Check if script matches exclude criteria
                if (exclude && script.matches(exclude)) {
                    continue;
                }
                
                const src = script.getAttribute('src');
                
                // Check if we already have a script with the same src
                const existingScripts = Array.from(this.querySelectorAll('script[type="mountobserver"]')) as HTMLScriptElement[];
                const alreadyExists = existingScripts.some(existing => {
                    const existingSrc = existing.getAttribute('src');
                    return existingSrc === src;
                });

                if (!alreadyExists) {
                    const clonedScript = script.cloneNode(true) as HTMLScriptElement;
                    this.appendChild(clonedScript);
                }
            }
        }

        async #setupMountObserver() {
            // Find the highest node with the same custom element registry
            const highestCERNode = getRegistryRoot(this);

            if (!highestCERNode) {
                return;
            }

            // Check if MountObserver has already been set up for this element
            const existingObserver = (highestCERNode as any)[MOUNT_OBSERVER_SETUP];
            if (existingObserver) {
                // Subscribe to the existing observer's mount event and re-dispatch from this element
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
                        
                        const highestCERNode = getRegistryRoot(parentElement);
                        if(!highestCERNode) return;
                        
                        this.#processScriptElement(mountedScriptElement, highestCERNode);
                    }
                });
                return;
            }

            // Set up MountObserver to watch for <script type="mountobserver"> elements
            this.#mountObserver = new MountObserver({
                matching: 'script[type="mountobserver"]',
                do: async (scriptElement: Element) => {
                    await this.#processScriptElement(scriptElement as HTMLScriptElement, highestCERNode);
                }
            });

            // Mark that we've set up the MountObserver for this element
            (highestCERNode as any)[MOUNT_OBSERVER_SETUP] = this.#mountObserver;

            await this.#mountObserver.observe(highestCERNode);
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
                    
                    // Store in map for direct access
                    this.mountObservers.set(scriptElement, observer);
                    
                    // Call lifecycle method if defined
                    this.onMountObserverCreated?.(scriptElement, observer, rootNode);
                    
                    // Dispatch custom event
                    this.dispatchEvent(new CustomEvent('mose:observer-created', {
                        detail: { scriptElement, observer, rootNode },
                        bubbles: true,
                        composed: true
                    }));
                } catch (error) {
                    console.error('Failed to create MountObserver with config:', error);
                }
            }
        }
    };
}
