# Remove possible redundancy

## Analysis

After comparing `getRootRegistryContainer` from 'mount-observer/getRootRegistryContainer.js' with `getHighestCERNode` from './getHighestCERNode.js', I found they have **similar but not identical** functionality:

### Key Differences (Original):

1. **Input Type**:
   - `getRootRegistryContainer`: Takes `Element` only
   - `getHighestCERNode`: Takes `Node` (more flexible, handles any node type)

2. **Null Handling**:
   - `getRootRegistryContainer`: No null check, assumes valid element
   - `getHighestCERNode`: Returns `null` if node is invalid

3. **Root Node Handling**:
   - `getRootRegistryContainer`: Checks root node first, then walks up parents
   - `getHighestCERNode`: Walks up continuously, checking each node, and returns root if it's a shadow root

4. **Shadow Root Detection**:
   - `getRootRegistryContainer`: Doesn't explicitly handle shadow root traversal
   - `getHighestCERNode`: Explicitly checks for shadow roots and returns them when appropriate

5. **Return Value**:
   - `getRootRegistryContainer`: Always returns a `Node`, falls back to element itself
   - `getHighestCERNode`: Returns `Node | null`

## Resolution: ✅ COMPLETED

The mount-observer package has been updated with an enhanced `getRootRegistryContainer` that now matches all the functionality of `getHighestCERNode`.

### Changes Made:

1. ✅ Replaced all imports of `getHighestCERNode` with `getRootRegistryContainer` from mount-observer
2. ✅ Replaced all function calls from `getHighestCERNode()` to `getRootRegistryContainer()`
3. ✅ Updated `index.ts` to export `getRootRegistryContainer` from mount-observer instead of local implementation
4. ✅ Deleted `getHighestCERNode.ts` and `getHighestCERNode.js` files
5. ✅ Updated `tsconfig.json` to remove getHighestCERNode.ts from files list
6. ✅ Updated `package.json` exports to remove getHighestCERNode.js export
7. ✅ Updated property name from `whereElementMatches` to `matching` (mount-observer v2 API change)
8. ✅ Compiled successfully with no errors

The redundancy has been successfully removed!