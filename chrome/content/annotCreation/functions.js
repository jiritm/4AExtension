/**
 * Soubor: functions.js
 * Autor: Jiri Trhlik
 * Datum: 22.9.2011
 * Popis: Ruzne funkce pro chrome.
 * Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.functions =
{  
  /**
   * @param {Node} uzel k otestovani
   * @returns {bool} true, pokud je parametr uzel typu ELEMENT_NODE a ma jako atribut class == annotationExtension
   */
  isAnnotationNode : function(node)
  {
    //var annotClassRegExp = new RegExp(annotationExtension.ANNOTATION_NODE_CLASS, "")

    if (node &&
        node.nodeType == Node.ELEMENT_NODE &&
        node.className != undefined &&
        node.className != null &&
        node.className == annotationExtension.ANNOTATION_NODE_CLASS)
    {
      return true;
    }
    else
    {
      return false;
    }
  }
};