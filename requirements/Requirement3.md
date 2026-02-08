# Monitor for mount-observer-script-elements

In the Mode.js mixin, after getting the highestCERNode, add a MountObserver observer, documented in node_modules/mount-observer/ReadME.md, that watches for elements of type:

```JavaScript
<script type="mountobserver"></script>
```

It should:

1.  Check if the script element has a src attribute.  If so, use a JSON import to read the JSON import.
2.  If no src attribute found, start with empty object {}
3.  Import assign-gingerly/object-extension.js, documented in node_modules/assign-gingerly/ReadMe.md
4.  if the script element contains non trivial innerHTML, sse JSON.parse in the script's innerHTML property, and do obj.assignGingerly(parsedJSOn).
5.  Apply mountObserver on the highestCERNode, with the object found in step 4 above.