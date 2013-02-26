/**
 * Soubor: fragments.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Obsahuje funkce pro vytvoreni kolekce fragmentu, ktere se odeslou na server v anotaci.
 * Posledni uprava: 5.6.2012
 */

/**
 * Konstruktor
 */
annotationExtensionChrome.fragments = function(rangesArray, selected)
{
  //Inicializace
  this.rangesFragments = [];  /**< Pole s "ranges", kazdy prvek obsahuje pole fragmentu pro odeslani na server. */
  //-----------------------------------------------------------------------//
  //vvv   private   vvv//
  //-----------------------------------------------------------------------//
  this.fragmentList = [];    /**< List fragmentu, pro jeden range. POMOCNA*/
  this.nodeList = [];        /**< List vsech vybranych elementu v ranges k anotaci. POMOCNA*/
  this.range;
  
  this.load(rangesArray, selected);
};

annotationExtensionChrome.fragments.prototype =
{
  /**
   * Projde vsechen vybrany text a rozseka ho na casti neobsahujici html elementy.
   * Pro kazdou cast(anotaci) vypocita XPath a ulozi do 'nodeList'.
   * Mela by se volat pri odeslani anotace na server.
   * @param {aeArray} ranges, pole ranges
   * @param {Int} selecte, vybrany range k anotaci, -1 znamena vsechny range
   */
  load : function(rangesArray, selected)
  {
    try
    {//Zpracuj vsechny ranges, ktere chce uzivatel anotovat.
      if (rangesArray == undefined || rangesArray == null || selected == undefined || selected == null)
        return;
      
      var i = selected;
      var j = rangesArray.length;
     
      //-1 znamena anotuj vsechny ranges
      if (i == -1)
      {
        i = 0;
      }
      else
        j = i + 1;
        
      if (rangesArray.length > i)
        for(i; i < j; i++)
        {
          this.range = rangesArray[i];
  
          var ancestor = this.range.commonAncestorContainer;
          if(ancestor.nodeType != Node.ELEMENT_NODE)
            ancestor = ancestor.parentNode;
          
          //Projdi vsechny nodes, ktere jsou v range
          this.getElemsInRange(ancestor);
          
          this.fragmentList = [];
          this.makeFragmentsListFromNodes();
          
          this.rangesFragments.push(this.fragmentList);
        }
    }
    catch(ex)
    {
      alert('fragments.js : load:\n' + ex.message);
    }
  },
  
  /**
   * Projde nodes, pomoci treeWalkeru od 'containerNode'
   * Pokud je node obsazen v range(objektu this) zpracuje ho a prida ho do 'nodeList'(objektu this).
   * @param {Node} containerNode, ktery je navrcholu treeWalkeru
   */
  getElemsInRange : function(containerNode)
  {
    var treeWalker = document.createTreeWalker(
          containerNode,
          NodeFilter.SHOW_TEXT, 
          this,
          false)
    
    this.nodeList = [];
    
    while(treeWalker.nextNode())
    {
      this.nodeList.push(treeWalker.currentNode);
    }
  },  
  
  /**
   * Funkce pro potreby TreeWalkeru
   */
  acceptNode : function(node)
  {
    //Pokud node neni v range, zahod ho
    return this.rangeIntersectsNode(this.range, node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  },
  
  /**
   * Vytvori objekty fragmentu z pole 'nodeList' (objektu this)
   * a ulozi je do pole 'fragmentList'
   */
  makeFragmentsListFromNodes : function()
  {
    if (this.nodeList == undefined || this.nodeList == null || !this.range)
      return;
    
    //Vytvoreni anotaci
    //V kazdem cyklu je zpracovan jeden uzel typu TEXT_NODE.
    for(var i=0; i < this.nodeList.length; i++)
    {
      var node = this.nodeList[i];
      var sibling = node.previousSibling;
      
      var newAnnotFrag = this.makeFragmentObj(node, this.range);
      if (newAnnotFrag == null)
        continue;
      
      var connectToPrevious = this.checkIfConnectNodeToPrevious(node);      

      if (node == this.range.startContainer)
      {//Dopocitani spravneho offsetu, pocatecni uzel
        //Uzel "po ceste" muze byt TEXT_NODE nebo uzel obsahujici anotaci
        newAnnotFrag.offset += this.getNodeOffset(node);
        
        this.fragmentList.push(newAnnotFrag);
      }
      else if (connectToPrevious)
      {//Uzel je "uprostred" nebo na konci ve vyberu, uzel je v anotaci nebo mu predchazi element anotace
        var lastFragment = this.fragmentList.length - 1;
        
        this.fragmentList[lastFragment].connectFragment(newAnnotFrag);
      }
      else
      {//Uzel je "uprostred" nebo na konci ve vyberu, uzlu predchazi nejaky NODE_ELEMENT
        newAnnotFrag.connectToPrev = true;  //TODO: Tenhle atribut uz zrejme neni treba
        this.fragmentList.push(newAnnotFrag);
      }
    }
  },
  
  /**
   * Zda pripojit uzel fragmentu k predchozimu (fragment je rozdelen uzly spanu jinych anotaci apod.)
   * @returns {Bool} true, pokud se ma uzel pripojit
   *                 false, jinak
   */
  checkIfConnectNodeToPrevious : function(node)
  {//Funkci prijde UZEL NODE_TEXT!
    sibling = node.previousSibling;
    parent = node.parentNode;
    
    while (sibling != null)
    {//Moznost ...<NODE_ELEMENT><annotSpan />text()<NODE_ELEMENT>
      if (annotationExtensionChrome.functions.isAnnotationNode(sibling))
        return true;
      else if (sibling.nodeType == Node.ELEMENT_NODE)
        //ELEMENT_NODE, ten automaticky rozdeluje text na více TEXT_NODE
        return false;
      
      sibling = sibling.previousSibling;
    }
  
    while (annotationExtensionChrome.functions.isAnnotationNode(parent))
    {
      sibling = parent.previousSibling;
  
      while (sibling != null)
      {
        if (annotationExtensionChrome.functions.isAnnotationNode(sibling) || sibling.nodeType == Node.TEXT_NODE)
          return true;
        else if (sibling.nodeType == Node.ELEMENT_NODE)
          //ELEMENT_NODE, ten automaticky rozdeluje text na více TEXT_NODE
          return false;
        
        
        sibling = sibling.previousSibling;
      }
      
      parent = parent.parentNode;
    }
    
    return false;
  },
  
  /**
   * Ziska offset textu, ktery predchazi uzlu "node" v ramci XPATH bez uzlu anotace
   * @param {Node.TEXT_NODE} node Uzel typu text, ktery je pocatecni uzel v range
   * @returns {Int} offset textu
   */
  getNodeOffset : function(node)
  {
    var nodeCopy = node;
    var parentNode = node.parentNode;
    var sibling = node.previousSibling;
    
    var offsetCorrection = 0;
    var stop = false;
    
    while (!stop)
    {          
      if (sibling == null && nodeCopy.parentNode && annotationExtensionChrome.functions.isAnnotationNode(nodeCopy.parentNode))
      {//Moznost 2
        nodeCopy = nodeCopy.parentNode;
        sibling = nodeCopy.previousSibling;
      }
      else if (sibling == null)
      {
        stop = true;
      }
      else if (sibling.nodeType == Node.TEXT_NODE)
      {//Moznost 1
        offsetCorrection += sibling.nodeValue.length;
        nodeCopy = sibling;
        sibling = sibling.previousSibling;
      }
      else if(annotationExtensionChrome.functions.isAnnotationNode(sibling))
      {//Moznost 4
        offsetCorrection += this.getAnnotatedTextLength(sibling);
        nodeCopy = sibling;
        sibling = sibling.previousSibling;
      }
      else
      {//Moznost 3
        stop = true;
      }
    }
    
    return offsetCorrection;
  },
  
  /**
   * Spocita delku textu v uzlu s class == annotationExtension
   * @returns {int} delka textu v uzlu s class == annotationExtension 
   */
  getAnnotatedTextLength : function(node)
  {
    var length = 0;
    var siblings = node.childNodes;
    
    for (var i = 0; i < siblings.length; i++)
    {
      var object = siblings[i];
      if (object.nodeType == Node.TEXT_NODE)
      {
        length += object.nodeValue.length;
      }
      if (object.nodeType == Node.ELEMENT_NODE && annotationExtensionChrome.functions.isAnnotationNode(object))
        length += this.getAnnotatedTextLength(object);
    }
    
    return length;
  },
  
  /**
   * Urci zda range prochazi node
   * @param {range} range, ktery ma prochazet node
   * @param {Node} node, ktery ma byt v range
   * @returns {bool} true, pokud range prochazi node
   *                 false, pokud range neprochazi node
   */
  rangeIntersectsNode : function(range, node)
  {
    var nodeRange = document.createRange();
    
    try
    {
      nodeRange.selectNode(node);
    }
    catch (ex)
    {
      nodeRange.selectNodeContents(node);
    }
  
    return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) == -1 &&
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) == 1;
  },
  
  /**
   * Vypocita delku a offset anotovaneho textu v range pro element.
   * a vytvori novy objekt fragmentu.
   * @param {Node} node ocekava element typu text, ve kterem je anotovany text
   * @param {range} range range, ve kterem se nachazi node
   * @return fragment
   */
  makeFragmentObj : function(node, range)
  {
    if (node.nodeType != Node.TEXT_NODE)
      return null;
    if (!range)
      return null;
    
    var text = "";
    var textRepEnt = "";
    var textOffset = 0;
    var textLength = 0;
    
    //Pokud je element pocatecnim v range, text bude mit offset
    //ostatni elementy v range maji offset 0!! a delka vybraneho textu, krom
    //prvniho a posledniho uzlu je delka textu elementu!!
    if (node == range.startContainer)
    {
      textOffset = range.startOffset;
      
      //Text muze byt vybran pouze pres jeden element, ten je potom pocatecnim a koncovym el. vyberu
      if (node == this.range.endContainer)
      {
        text = node.nodeValue.substring(textOffset, range.endOffset);
        textLength = text.length;
      }
      else
      {
        text = node.nodeValue.substring(textOffset);
        textLength = node.nodeValue.length - textOffset;
      }
    }
    else if (node == range.endContainer)
    {
      text = node.nodeValue.substring(0, range.endOffset)
      textLength = text.length;
    }
    else
    {
      text = node.nodeValue;
      textLength = text.length;
    }
      
    var xpath = annotationExtensionChrome.xpath.getXPathFromNode(node);
    var isWrongXPath = annotationExtensionChrome.xpath.wrongTextXPath(xpath);
    if (isWrongXPath == true)
    {
      return null;
    }
    
    var newFragment = new annotationExtensionChrome.fragment(text, textLength, textOffset, xpath);
    
    return newFragment;
  }
};