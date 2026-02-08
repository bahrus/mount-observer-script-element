# Copy mountobserver script elements from container

Add some code after line 45 of MOSE.ts:



Create a method:  #getContainerMOSEs.  pass i the highestCENode found at line 41.  

What this method does:

1. if(highestCERNode) is the document root, don't do anything (return).  Otherwise:  
2.  If highestCERNode is an element, get the parentElement.  If it is a shadowRoot, get the "host" property of the shadowRoot.
3.  Find the highestCERNode of the element obtained from step 1.

If the Node found in step 2 exists and has method querySelector, do a querySelector for the localName of the current element instance.  If not found, exit.  Call it "parentCE".

If the highestCERNode found at line 41, the one that is passed in to the method, contains the "parentCE", just exit the method quietly.

Clone all the script element children of parentCE have type="mountobserver" and append as children of the current instance unless a script element child with type="mountobserver" already exists with the same attribute value of "src".

Add an event listener to the parentCE for event type "mount", and get the mountedElement from the event, and do the same clone, append, subject to the same condition (maybe create a shareable private method for checking that condition)

