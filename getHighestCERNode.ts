/**
 * Recursively traverses up the DOM tree to find the highest node
 * that shares the same customElementRegistry as the passed in element.
 * 
 * @param {Node} node - The starting node to check
 * @returns {Node | null} The highest node with matching customElementRegistry, or null if node is invalid
 */
export function getHighestCERNode(node: Node): Node | null {
    if (!node) {
        return null;
    }

    const startRegistry = (node as any).customElementRegistry;
    let currentNode: Node | null = node;
    let highestMatch: Node = node;

    while (currentNode) {
        // Check if current node has matching customElementRegistry
        if ((currentNode as any).customElementRegistry === startRegistry) {
            highestMatch = currentNode;
        }

        // Try to get parent element first
        const parent = (currentNode as any).parentElement as Element | null;
        if (parent) {
            currentNode = parent;
            continue;
        }

        // If no parent element, check for rootNode (shadow root case)
        const root = currentNode.getRootNode?.();
        if (root && root !== currentNode && root !== document) {
            // We're in a shadow root, get the host element
            currentNode = (root as ShadowRoot).host;
        } else {
            // Reached the top
            break;
        }
    }

    return highestMatch;
}
