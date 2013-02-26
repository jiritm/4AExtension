/**
 * Soubor: rangeCreator.js
 * Autor: Jiri Trhlik
 * Datum: 24.11.2011
 * Popis: Funkce pro vytvoreni ranges z fragmentu anotace (XPath, offset, length)
 *        v aktualnim dokumentu (strance) (annotationExtensionChrome.annotationsView.frame_doc)
 * Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.rangeCreator =
{
	/**
	 * Vytvori jeden range pro vsechny fragmenty v fragmentList
	 * @returns {Array} vysledny range vrati v poli (kvuli zpetne kompatibilite)
	 */
	createRangeFromFragments : function(fragmentsList)
	{
		var ranges = new Array();
		
		for (var i = 0; i < fragmentsList.length; i++)
		{
			var startEndNode = this.getStartAndEndNode(fragmentsList[i]);
			
			if (startEndNode == null || startEndNode.startNode == null || startEndNode.endNode == null)
				continue;
	     	   
			var range = this.createRange(startEndNode);
			
			ranges.push(range);
		}
		
    //Spoj vsechny range do jednoho
		if (ranges.length > 1)
		{
			var newRange = this.joinTwoRanges(ranges[0], ranges[1]);
			for (var i = 2; i < ranges.length; i++)
			{
				newRange = this.joinTwoRanges(newRange, ranges[i]);
			}

			return newRange;
		}
    else
		{//V poli je jen jeden range, nemuse se spojovat
			if (ranges.length > 0)
				return ranges[0];
			else
				return null;
		}
	},
	
	/**
	 * Vytvori pro kazdy fragment v poli fragmentsList
	 * jeden range a vrati pole techto ranges (pokud ma fragment atribut connectToPrev == true).
	 * pripoji range tohoto fragmentu k range predchoziho fragmentu z fragmentsList
	 */
  createRangesFromFragments : function(fragmentsList)
  {
    var ranges = new Array();
		
		for (var i = 0; i < fragmentsList.length; i++)
		{
			var startEndNode = this.getStartAndEndNode(fragmentsList[i]);
			
			if (startEndNode == null || startEndNode.startNode == null || startEndNode.endNode == null)
				continue;
	     
			var range = this.createRange(startEndNode);
			
			if (fragmentsList[i].connectToPrev == true)
	    {//Pokud je u fragmentu ulozeno pripoj k predchozimu pripoj k naposledy ulozenemu range
				//Toto slouzi predevsim pro fragmenty, ktere se ukladaji kvuli
				//praci mezi zalozkama...
				var range1 = ranges.pop();
				if (range1 != null)
				{
					range = this.joinTwoRanges(range1, range);
					ranges.push(range);
					continue;
				}
			}
			
			ranges.push(range);
		}
		
		return ranges;
  },
	
	/**
	 * Vytvori range
	 * @param {Object} startEndNode, objekt obsahujici startNode - pocatecni element
	 *                 range a endNode - koncovy element range
	 * @returns {Range} nove vytvoreny range
	 */
	createRange : function(startEndNode)
	{
		var range = document.createRange();
		range.setStart(startEndNode.startNode, startEndNode.startNodeOffset);
		range.setEnd(startEndNode.endNode, startEndNode.endNodeOffset);
		
		return range;
	},	
  
	/**
	 * Spoji dva range.
	 * Nezalezi na poradi. Pokud je mezi range "mezera" -> bude patrit do noveho
	 * range.
	 */
	joinTwoRanges : function(range1, range2)
	{
		try
		{
			var newRange = document.createRange();
			
			//porovnej zacatecni body
			var start = range1.compareBoundaryPoints(Range.START_TO_START, range2);
			if (start == 1)
				//start range1 je za start range2
				newRange.setStart(range2.startContainer, range2.startOffset);
			else
				newRange.setStart(range1.startContainer, range1.startOffset);
				
			//porovnej koncove body
			var end = range1.compareBoundaryPoints(Range.END_TO_END, range2);
			if (end == -1)
				//end range 1 je pred end range2
				newRange.setEnd(range2.endContainer, range2.endOffset);
			else
				newRange.setEnd(range1.endContainer, range1.endOffset);
		
			return newRange;
		}
		catch(ex)
		{
			return null;
		}
	},
	
	/**
	 * Ziska uzly v DOMu a offsety v nich - reprezentujici fragment
	 * @param {annotationExtensionChrome.fragment} fragment
	 * @returns {Object} objekt obsahuje startNodeOffset,
	 * 				                           startNode,
	 *   			                           endNodeOffset,
	 *				                           endNode
	 */
  getStartAndEndNode : function(fragment)
  {//TODO: ERROR_ANNOT_TXT_FILE
    var xpath = fragment.xpath;
		var offset = fragment.offset;
    var len = fragment.length;
    
    /*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/
    var textNodeXPath = isTextNodeXPath(xpath);
    if (textNodeXPath)
    {//TODO: OPRAVIT PRO VSTUPY JAKO /html/body/text()[2]
			var newPathParams = this.convertTextNodeToElemNode(xpath, offset, len);
			if (newPathParams == null)
				return null;
			xpath = newPathParams[0];
			offset = newPathParams[1];
			len = newPathParams[2];
		}
		/*vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv*/
    var fragmentNode = getElementFromDoc(xpath, annotationExtensionChrome.annotationsView.frame_doc);
    if (fragmentNode == null)
        return null;
    
		var treeWalker = document.createTreeWalker(
          fragmentNode,
          NodeFilter.SHOW_TEXT, 
          {acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } },
          false) 
    
		var totalTextLen = 0;
		var startNodeOffset = 0;
		var startNode = null;
		var endNodeOffset = 0;
		var endNode = null;

		while(treeWalker.nextNode())
    {
			//alert(treeWalker.currentNode.nodeValue + ' ' + treeWalker.currentNode.nodeValue.length + '\nTotal: ' + totalTextLen + '\nOffset: ' + offset);
			if (totalTextLen + treeWalker.currentNode.length > offset)
			{
				startNodeOffset = offset - totalTextLen;
				startNode = treeWalker.currentNode;
				//ULOZENY START UZEL RANGE
				do
				{
					if (totalTextLen + treeWalker.currentNode.length >= offset + len)
					{
						endNodeOffset = treeWalker.currentNode.length - ((treeWalker.currentNode.length + totalTextLen) - (offset + len));
						endNode = treeWalker.currentNode;
						break;
					}
					else
					{
						totalTextLen += treeWalker.currentNode.length;
					}
				}
				while (treeWalker.nextNode());
				break;
			}
			else
			{
				totalTextLen += treeWalker.currentNode.length;
			}
    }
		
		return {startNodeOffset : startNodeOffset,
						startNode : startNode,
						endNodeOffset : endNodeOffset,
						endNode : endNode}
  },
	
	/**
	 * Pro parametry ("fragmentu"), ktere se vztahuji k uzlu typu TEXT_NODE
	 * prepocita parametry tak, aby se vztahovaly k ELEMENT_NODE, ktere odpovidaji
	 * dokumentu a nejsou naruseny jiz vlozenymi anotacemi 
	 */
	convertTextNodeToElemNode : function(xpathP, offsetP, lengthP)
	{
		var newPathParams = new Array();
		var xpathTextCount = getXPathTextCount(xpathP);
    var xpath = getAncestorXPathForTextNodeXPath(xpathP);
		var ancNode = getElementFromDoc(xpath, annotationExtensionChrome.annotationsView.frame_doc);
		//alert(annotationExtensionChrome.annotationsView.frame_doc.documentElement.innerHTML);
		var newOffset = this.getNewOffsetForAncestorElem(ancNode, offsetP, xpathTextCount);
		if (newOffset == null)
			return null;
		
		newPathParams.push(xpath, newOffset, lengthP);
		
		return newPathParams; 
	},
	
	/**
	 * Ziska offset tak, aby odpovidal v ramci nadrazeneho elementu
	 * Pro pouziti s funkci convertTextNodeToElemNode()
	 */
	getNewOffsetForAncestorElem : function(ancNode, oldOffset, textNodeSeq)
	{
		if (ancNode == null)
			return null;
    var childs = ancNode.childNodes;
		if (childs.length < 1)
			return null;
		
		var child = childs[0];
    var count = 1;
    var len = 0;
		
		var textCountPlus = false;
		
		while (count < textNodeSeq)
		{
			if (child == null)
				return null;
			
			len += this.textLengthOfNode(child);

			//TODO: OPRAV POCET TEXT()
			if (child.nodeType == Node.ELEMENT_NODE && !annotationExtensionChrome.functions.isAnnotationNode(child))
					textCountPlus = true;
										
			child = child.nextSibling;
			
			if (textCountPlus == true && (child.nodeType == Node.TEXT_NODE || annotationExtensionChrome.functions.isAnnotationNode(child)))
			{
				count++;
				textCountPlus = false;
			}
		}
    
		return len + oldOffset;
	},
	
	/**
	 * @param {Elem} node, uzel pro ktery chceme ziskat delku textu v nem
	 * @returns {Int} delku textu v uzlu
	 */
	textLengthOfNode : function(node)
	{
		if (node.nodeType == Node.TEXT_NODE)
			return node.nodeValue.length;
		else if (node.nodeType == Node.ELEMENT_NODE)
		{
			var len = 0;
			var childs = node.childNodes;
			for (var i = 0; i < childs.length; i++)
			{
				len += this.textLengthOfNode(childs[i]);
			}
			return len;
		}
		else
			return 0;
	}
}