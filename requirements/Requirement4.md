# Unique mountobserver for mountobserver script elements

Method #setupMountObserver() should only be invoked once per element, regardless of how many custom elements utilize the MOSE mixin.  Please make sure only one observer is established.