# Notify of mount observer children

In #setupMountObserver line 80, if an observer is already found, it returns.

Instead, we need to add some code that does the following:

1.  Subscribes to the mountObserver's mount event, and dispatches that event from the custom element instance that MOSE mixin applies to.