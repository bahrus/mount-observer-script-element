# mount-observer-script-element


## Mount Observer Script Elements (MOSEs)

The [mount-observer api](https://www.npmjs.com/package/mount-observer) provides a pure JS API for providing css-like mapping between DOM element state and actions and events.

This proposal / polyfill goes one step further and provides true, 100% declarative css-like support.

This polyfill is awaiting implementation of scoped custom element registry before finalizing the requirements and beginning the implementation.

Following an approach similar to the [speculation api](https://developer.chrome.com/blog/speculation-rules-improvements), we can add a script element anywhere in the DOM:

```html
<script type="mountobserver" onload="{...}"  onmount="{
   const {matchingElement} = event;
   const {localName} = matchingElement;
   if(!customElements.get(localName)) {
      customElements.define(localName, modules[1].MyElement);
   }
   observer.disconnectedSignal.abort();
}">
{
   "select":"my-element",
   "import": [
      ["./my-element-small.css", {type: "css"}],
      "./my-element.js",
   ]
}
</script>
```

The things that make this API work together, namely the "modules", "observer", and "mountedElements" (an array of an array of weak refs to elements that match all the criteria for the i<sup>th</sup> "on" selector) would be accessible as properties of the script element:

```JavaScript
const {modules, observer, mountedElements, mountInit} = myMountObserver;
```

The "scope" of the observer would be the ShadowRoot containing the script element (or the document outside Shadow if placed outside any shadow DOM, like in the head element).

Once again, arrays of settings could be supported, which, in practice, would greatly increase the ratio between declarative, JSON-parsable instructions that could be performed in low-level c++/rust threads, vs custom JavaScript in the example above.  The events / callbacks would need to provide the index of which set of criteria was just fulfilled.

> [!Note]
> To support the event handlers above, I believe it would require that CSP solutions factor in both the inner content of the script element as well as all the event handlers via the string concatenation operator.  I actually think such support is quite critical due to lack of support of import.meta.[some reference to the script element] not being available, as it was pre-ES Modules.

## Specific solution for lazy loading custom element definitions

Since the example we've been dwelling on so far (lazy custom element definition) seems like such a pressing, common requirement, and was in fact the originating impetus for this proposal, we can go a step further and make the example above 100% declarative, thus resulting in a less clunky interplay between JSON and custom script.  This is meant as a way of illustrating how the platform could continue to extend this proposal going forward.

The syntax below is just one, "spit-balling" way this could be done, as an example, and would require absorbing final heuristics from other custom element initiatives (such as declarative custom elements) when they get added to the platform.

```html
<script type="mountobserver">
{
   "select":"my-element",
   "import": [
      ["./my-element-small.css", {type: "css"}],
      "./my-element.js",
   ],
   "define": {
      "targetRegistry": "CustomElements",
      "targetScope": "global",
      "styleModules": [0],
      "classDefinition": {
         "module": 1,
         "exportSymbol": 'MyElement'
      }
   }
}
</script>
```

## Shadow Root inheritance

Inside a shadow root, we can plop a script element, also with type "mountobserver", optionally giving it the same id as above:

```html
#shadowRoot
<script id=myMountObserver type=mountobserver>
{
   "select":"your-element"
}
</script>
```

If no id is found in the parent ShadowRoot (or in the parent window if the shadow root is at the top level), then this becomes a new set of rules to observe.

But if a matching id is found, then the values from the parent script element get merged in with the one in the child, with the child settings, including the event handling attributes. 

> [!Note]
> The onload event is critical for a number of reasons, among them:
> 1. We need a way to inject non JSON serializable settings (described below) when necessary, and 
> 2. We need a way to override settings in child Shadow DOM's programmatically in some cases.

We will come back to some important [additional features](#creating-frameworks-that-revolve-around-moses) of using these script elements later, but first we want to cover the highlights of this proposal, in order to give more context as to what kinds of functionality these MOSEs can provide.

## Creating "frameworks" that revolve around MOSEs.

Often, we will want to define a large number of "mount observer script elements (MOSEs)" programmatically, and we need it to be done in a generic way, that can be published and easily referenced.  

This is a problem space that [be-hive](https://github.com/bahrus/be-hive) is grappling with, and is used as an example for this section, to simply make things more concrete.  But we can certainly envision other "frameworks" that could leverage this feature for a variety of purposes, including other families of behaviors/enhancements, or "binding from a distance" syntaxes.  

In particular, *be-hive* supports publishing [enhancements](https://github.com/bahrus/be-enhanced) that take advantage of the DOM filtering ability that the MountObserver provides, that "ties the knot" based on CSS matches in the DOM to behaviors/enhancements that we want to attach directly onto the matching elements.  *be-hive* seeks to take advantage of the inheritable infrastructure that MOSEs provide, but we don't want to burden the developer with having to manually list all these configurations, we want it to happen automatically, only expecting manual intervention when we need some special customizations within a specific ShadowDOM realm.

To support this, we propose these highlights:

1.  Adding a static "synthesize" method to the MountObserver api.  This would provide a kind of passage-way from the imperative api to the declarative one.  
2.  As the *synthesize* method is called repeatedly from different packages that work within that framework, it creates a cluster of MOSEs wrapped inside the "synthesizing" custom element ("be-hive") that the framework developer authors.  It appends script elements with type="mountobserver" to the custom element instance sitting in the DOM, that dispatches events from the synthesizing custom element it gets appended to, so subscribers in child Shadow DOM's don't need to add a general mutation observer in order to know when parent shadow roots had a MOSE inserted that it needs to act on.  This allows the child Shadow DOM's to inherit (in this case) behaviors/enhancements from the parent Shadow DOM.

So framework developers can develop a bespoke custom element that inherits from the "abstract" class "*Synthesizer*" that is part of this package / proposal, that is used to group families of MountObserver's together. 

Some attributes that the base "Synthesizer" supports are listed below.  They are all related to allowing individual ShadowDOM realms to be able to easily opt in or opt out, depending on the level of control/trust that is exerted by a web component / Shadow Root, as far as the HTML it imports in. 

1.  passthrough.  Allows for the inheritance of behaviors to flow through from above (or from the root document), while not actually activating any of them within the Shadow DOM realm itself.
2.  exclude.  List of specific MOSE id's to block.  Allows them to flow through to child Shadow Roots.
3.  include.  List of specific MOSE id's to allow.

What functionality do these "synthesizing" custom elements provide, what value-add proposition do they fulfill over what is built into the MountObserver polyfill / package?

The sky is the limit, but focusing on the first example, be-hive, they are:

1.  Managing, interpreting and parsing the attributes that add semantic enhancement vocabularies onto exiting elements.
2.  Establishing the "handshake" that imports the enhancement package, instantiates the enhancement, and passes properties that were previously assigned to the pre-enhanced element to the attached enhancement/behavior.
3.  Providing an inheritable "registry" of reusable scriptlets that can be leveraged in a declarative way.

If one inspects the DOM, one will see grouped (already "parsed") MOSEs, like so:

```html
<be-hive>
   <script type=mountobserver id=be-hive.be-searching></script>
   <script type=mountobserver id=be-hive.be-counted></script>
</be-hive>
```

Without the help of the synthesize method / Synthesizer base class, the developer would need to set these up manually, so this lifts a significant burden from the shoulders of people who want to leverage these behaviors/enhancements in a seamless way.  

The developer of each package defines their MOSE "template", and then syndicates it via the synthesize method:

```JavaScript
MountObserver.synthesize(root: document | shadowRootNode, ctr:  ({new() => Synthesizer}), mose: MOSE)
```

What this method does is it:

1.  Uses [customElements.getName](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/getName) to get the name of the custom element (say it is 'be-hive') from the provided constructor.
2.  Searches for a be-hive tag inside the root node (with special logic for the "head" element).  If not found, creates it.
3.  Places the MOSE inside.


Then in our shadowroot, rather than adding a script type=mountobserver for every single mount observer we want to inherit, we could reference the group via simply:

```html
<be-hive></be-hive>
```

And we can give each inheriting ShadowRoot a personality of its own by customizing the settings within that shadow scope, by manually adding a MOSE with matching id that overrides the inheriting settings with custom settings:

```html
<be-hive>
   <script type=mountobserver id=be-hive.be-searching>
      {
         ...my custom settings
      }
   </script>
</be-hive>
```



