/**
 * Recursively traverses up the DOM tree to find the highest node
 * that shares the same customElementRegistry as the passed in element.
 * 
 * @param {Node} node - The starting node to check
 * @returns {Node} The highest node with matching customElementRegistry
 */
export function getHighestCERNode(node) {
    if (!node) {
        return null;
    }

    const startRegistry = node.customElementRegistry;
    let currentNode = node;
    let highestMatch = node;

    while (currentNode) {
        // Check if current node has matching customElementRegistry
        if (currentNode.customElementRegistry === startRegistry) {
            highestMatch = currentNode;
        }

        // Try to get parent element first
        const parent = currentNode.parentElement;
        if (parent) {
            currentNode = parent;
            continue;
        }

        // If no parent element, check for rootNode (shadow root case)
        const root = currentNode.getRootNode?.();
        if (root && root !== currentNode && root !== document) {
            // We're in a shadow root, get the host element
            currentNode = root.host;
        } else {
            // Reached the top
            break;
        }
    }

    return highestMatch;
}
