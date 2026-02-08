# Monitor for mount-observer-script-elements

In the MOSE.ts mixin, after getting the highestCERNode, add a MountObserver observer, documented in node_modules/mount-observer/ReadME.md, that watches for elements of type:

```JavaScript
<script type="mountobserver"></script>
```

It should:

1.  Check if the script element has a src attribute using getAttribute('src').  If so, use a JSON import with `import(src, {with: {type: 'json'}})` to read the JSON, and use response.default as the config.
2.  If no src attribute found, start with empty object {}
3.  If the script element contains non-trivial innerHTML, use JSON.parse on the script's innerHTML property.
4.  Import assign-gingerly/assignGingerly.js (documented in node_modules/assign-gingerly/ReadMe.md) and use assignGingerly to merge the parsed JSON into the config object.
5.  Apply MountObserver on the highestCERNode with the merged config object.