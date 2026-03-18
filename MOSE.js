import { getRegistryRoot } from 'mount-observer/getRegistryRoot.js';
import { mountEventName } from 'mount-observer/Events.js';
import 'mount-observer/ElementMountExtension.js';
import 'mount-observer/handlers/MountObserverScript.js';
import { mos } from 'mount-observer/handlers/MountObserverScript.js';
import 'mount-observer/handlers/ScriptExport.js';
import { scriptExport } from 'mount-observer/handlers/ScriptExport.js';
import 'mount-observer/handlers/HTMLInclude.js';
import { include } from 'mount-observer/handlers/HTMLInclude.js';
import 'mount-observer/handlers/HoistTemplate.js';
import { hoist } from 'mount-observer/handlers/HoistTemplate.js';
import { emc } from 'mount-observer/handlers/EMCScript.js';
import 'mount-observer/handlers/EMCScript.js';
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
export function MOSE(Base) {
    return class extends Base {
        #mountObserver;
        /**
         * Public map of script elements to their created MountObserver instances
         */
        mountObservers = new Map();
        constructor(...args) {
            super(...args);
            this.#checkForDuplicateRegistration();
            document.mountGlobally({
                do: mos
            });
            document.mountGlobally({
                do: scriptExport
            });
            document.mountGlobally({
                do: include
            });
            document.mountGlobally({
                do: hoist
            });
            document.mountGlobally({
                do: emc
            });
        }
        #checkForDuplicateRegistration() {
            // Get the tag name of this element
            // const tagName = this.tagName.toLowerCase();
            const { localName } = this;
            // Find the highest node with the same custom element registry
            const rootRegContainer = getRegistryRoot(this);
            if (!rootRegContainer) {
                return;
            }
            // Get the custom element registry for this scope
            // const registry = (highestCERNode as any).customElementRegistry as CustomElementRegistry | undefined;
            // // If there's no custom registry, use the global one
            // const targetRegistry = registry || customElements;
            // Check if an element with this name is already defined in this registry
            try {
                const existingTags = Array.from(rootRegContainer.querySelectorAll(localName)).filter(x => x !== this);
                if (existingTags.length > 0) {
                    throw new Error(`Custom element "${localName}" is already defined in this custom element registry scope.`);
                }
            }
            catch (error) {
                // If get() throws, it means the element isn't registered yet, which is fine
                // But if it's our error, re-throw it
                if (error instanceof Error && error.message.includes('already defined')) {
                    throw error;
                }
            }
            // Copy mountobserver script elements from container
            this.#getContainerMOSEs(rootRegContainer);
        }
        #getContainerMOSEs(highestCERNode) {
            // Step 1: Don't do anything if highestCERNode is the document root
            if (highestCERNode === document) {
                return;
            }
            // Step 2: Get parent element or host
            let parentNode = null;
            if (highestCERNode instanceof Element) {
                parentNode = highestCERNode.parentElement;
            }
            else if (highestCERNode instanceof ShadowRoot) {
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
            const parentCE = parentHighestCERNode.querySelector(this.localName);
            if (!parentCE) {
                return;
            }
            // If highestCERNode contains parentCE, exit
            if (highestCERNode.contains?.(parentCE)) {
                return;
            }
            // Clone and append script elements
            this.#cloneAndAppendScripts(parentCE);
            // Add event listener for future mount events
            parentCE.addEventListener(mountEventName, (e) => {
                const mountedElement = e.mountedElement;
                if (mountedElement instanceof HTMLScriptElement && mountedElement.type === 'mountobserver') {
                    this.#cloneAndAppendScripts(parentCE);
                }
            });
        }
        #cloneAndAppendScripts(sourceElement) {
            const scripts = Array.from(sourceElement.querySelectorAll('script[type="mountobserver"]'));
            // Get exclude value from property or attribute
            const exclude = this.exclude ?? this.getAttribute('exclude');
            for (const script of scripts) {
                // Check if script matches exclude criteria
                if (exclude && script.matches(exclude)) {
                    continue;
                }
                const src = script.getAttribute('src');
                // Check if we already have a script with the same src
                const existingScripts = Array.from(this.querySelectorAll('script[type="mountobserver"]'));
                const alreadyExists = existingScripts.some(existing => {
                    const existingSrc = existing.getAttribute('src');
                    return existingSrc === src;
                });
                if (!alreadyExists) {
                    const clonedScript = script.cloneNode(true);
                    this.appendChild(clonedScript);
                }
            }
        }
    };
}
