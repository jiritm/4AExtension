/**
 * Soubor: xpath.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro vypocet XPath.
 *        Prevzato a upraveno z doplnku firepath.
 * Posledni uprava: 5.6.2012
 */

//UPRAVENO PRO POTREBY DOPLNKU
annotationExtensionChrome.xpath = 
{
  /**
   * Gets an XPath for an element which describes its hierarchical location.
   * @param {Node} node element, pro ktery se pocita XPath
   * @param {Node} context nepovinny parametr
   * @returns {string} xpath pro element
   */
  getXPathFromNode : function(node, context)
  {
    var result = "";
    var stop = false;
    var absolute = true;  /**< Zda ma funkce vracet absolutni cestu.
                               Muze se nastavit na false.*/
    
    //Uprava puvodniho vypoctu XPATH
    var correctedTextPosition = null;
    var correctResult = false;
    
    var parent = context || node.ownerDocument;
  
    while(node && node != parent && !stop)
    {
      var str = "";
      var position = this.getNodePosition(node);  
      
      switch (node.nodeType)
      {
        case Node.DOCUMENT_NODE:
          break;
        case Node.ATTRIBUTE_NODE:
          str = "@" + node.name;
          break;
        case Node.COMMENT_NODE:
          str = "comment()";
          break;
        case Node.TEXT_NODE:
          position = this.getTextNodePosition(node);  //Uprava puvodniho vypoctu XPath
          str = "text()";
          break;
        case Node.ELEMENT_NODE:
          var name = this.getTagName(node);
          if (!absolute && node.id && node.id != "")
          {
            str = ".//*[@id='" + node.id + "']";
            position = null;
            stop = true;
          }
          else
          //Uprava puvodniho vypoctu XPATH(vetev obsahovala pouze str = name)
          {
            if (annotationExtensionChrome.functions.isAnnotationNode(node))
            {
              str = "";
              //var sibling = node.previousSibling;
              //
              //while (sibling != null && sibling.nodeType != Node.TEXT_NODE)
              //  sibling = sibling.previousSibling;
              //if (sibling != null)
              //{//PRIPAD: ...<tag />text<span></span>...
              //  correctedTextPosition = this.getNodePosition(sibling);
              //}
              //else
              //{//PRIPAD: ...<tag /><span></span>...
                correctedTextPosition = this.addToTextCorrectionPosition(node);
              //}
              
              correctResult = true;
            }
            else
             str = name;
          }
          break;
      }
      
      if (str != "")
        result = str + (position ? "[" + position + "]" : "") + (result ? "/": "") + result;
    
      if(node instanceof Attr)
        node = node.ownerElement;
      else
        node = node.parentNode;
    }
    
    //Uprava puvodniho vypoctu XPATH
    if (correctResult == true)
      result = this.correctTextPosition(result, correctedTextPosition);
    if (absolute == true)
      result = '/' + result;
      
    return result;
  },

  /**
   * Ziska jmeno elementu
   * @param {Node} node Element, pro ktery chceme ziskat jmeno
   * @returns {string} jmeno elementu
   */
  getTagName : function(node)
  {
    var ns = node.namespaceURI;
    var prefix = node.lookupPrefix(ns);
    
    //if an element has a namespace it needs a prefix
    if(ns != null && !prefix)
    {
      prefix = this.getPrefixFromNS(ns);
    }
    
    var name = node.localName;
    if (this.isHtmlDocument(node.ownerDocument))
    {
      //lower case only for HTML document
      return name.toLowerCase();
    }
    else 
    {
      return (prefix? prefix + ':': '') + name;
    }
  },

  getPrefixFromNS : function(ns)
  {
    return ns.replace(/.*[^\w](\w+)[^\w]*$/, "$1");
  },

  //Kolikaty je node v parentu
  getNodePosition : function(node)
  {
    if (!node.parentNode)
      return null;
    
    var siblings = node.parentNode.childNodes;
    var count = 0;
    var position;
    
    for (var i = 0; i < siblings.length; i++)
    {
      var object = siblings[i];
      if(object.nodeType == node.nodeType && object.nodeName == node.nodeName)
      {
        count++;
        if(object == node) position = count;
      }
    }
  
    if (count > 1)
      return position;
    else
      return null;
  },
  
  //Kolikaty je textNode v parentu
  getTextNodePosition : function(node)
  {
    if (!node.parentNode)
      return null;
    
    var siblings = node.parentNode.childNodes;
    var count = 1;
    
    var textCountPlus = false;
    
    for (var i = 0; i < siblings.length; i++)
    {
      var object = siblings[i];
      
      
      //TODO: OPRAV POCET TEXT()
      if(object.nodeType == Node.ELEMENT_NODE && !annotationExtensionChrome.functions.isAnnotationNode(object))
        textCountPlus = true;
       
      if (textCountPlus == true && (object.nodeType == Node.TEXT_NODE || annotationExtensionChrome.functions.isAnnotationNode(object)))
      {
          count++;
          textCountPlus = false;
      }
      
      if(object == node)
        break;
    }
  
    return count;
  },

  isHtmlDocument : function(doc)
  {
    return doc.contentType === 'text/html';
  },
  
  correctTextPosition : function(result, correctedTextPosition)
  {
    var correctedResult = result;
    var text = "text()" + (correctedTextPosition ? "[" + correctedTextPosition + "]" : "");
                                  
    //                                    text()[123]
    return correctedResult.replace(/text\(\)(\[[0-9]*\])?/i, text);
  },
  
  addToTextCorrectionPosition : function(node)
  {
    var add = 0;
    var sibling = node.previousSibling;
        
    while (sibling != null)
    {
      if (sibling.nodeType == Node.TEXT_NODE)
      {
        var textNodePosition = this.getTextNodePosition(sibling);
        var result = add + textNodePosition;
      
        if (result > 0)
          return result;
        else
          return null;
      }
      else if (sibling.nodeType == Node.ELEMENT_NODE && !annotationExtensionChrome.functions.isAnnotationNode(sibling))
      {
        add++;
        while (sibling != null && sibling.nodeType != Node.TEXT_NODE && !annotationExtensionChrome.functions.isAnnotationNode(sibling))
        {
          sibling = sibling.previousSibling;
        }
        
        if(sibling == null)
        {
          add--
        }
          
        continue;
      }
      
      sibling = sibling.previousSibling;
    }
    
    return add + 1;
  },
  
  /**
   * Vrati true, pokud se jedna o "spatny textovy xpath" = .../tr/text(), .../table/text()
   * @param {String} xpath, xpath
   * @returns {Bool} true, pokud je xpath neplatny jako text
   *                 false, pokud je ok
   */
  wrongTextXPath : function(xpath)
  {                  // tr[123]/text()[123]
    var wrongXPaths = [/tr(\[[0-9]*\])?\/text\(\)(\[[0-9]*\])?/i,
                       /table(\[[0-9]*\])?\/text\(\)(\[[0-9]*\])?/i,
                       /tbody(\[[0-9]*\])?\/text\(\)(\[[0-9]*\])?/i];
    
    for (var i = 0; i < wrongXPaths.length; i++)
    {
      if (xpath.match(wrongXPaths[i]) != null)
        return true;
    }
    
    return false;
  }
};