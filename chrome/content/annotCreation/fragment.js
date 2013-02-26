/**
 * Soubor: fragment.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Reprezentuje jeden fragment anotace.
 * Posledni uprava: 5.6.2012
 */

/**
 * Konstruktor
 * @param {String} text text pro anotaci
 * @param {int} length delka anotovaneho textu
 * @param {int} offset offset anotovaneho textu
 * @param {String} xpath XPath anotovaneho textu
 */
annotationExtensionChrome.fragment = function(text, length, offset, xpath)
{
  //Inicializace
  this.offset = offset;
  this.length = length;
  this.text = text;              /**< Text jako node.nodeValue
                                  * Pro spocitani delky oznaceneho textu a
                                  * lokalni praci. */                                 
  this.textRepEnt = "";
  this.makeTextWithRepCharEnt();    /**< Obsahuje totez jako text, ale znaky &, <, >
                                                       *   pevna mezera a " jsou nahrazeny entitami.
                                                       *   Pro odeslani na server.
                                                       *   Naplni se pomoci funkce makeTextWithRepCharEnt()*/
  this.xpath = xpath;
};

annotationExtensionChrome.fragment.prototype =
{
  /**
   * Do this.textRepEnt ulozi text z this.text s nahrazenymi entitami za
   * <, > a &. Vyznamne pro odeslani na server.
   */
  makeTextWithRepCharEnt : function()
  {
    this.textRepEnt = this.text.replace(/&/g, "&amp;"); //amp se musi nahradit jako prvni
    this.textRepEnt = this.textRepEnt.replace(/</g, "&lt;");
    this.textRepEnt = this.textRepEnt.replace(/>/g, "&gt;");
  },
  
  /**
   * Pripoji fragment
   * @param {fragment} frag, fragment, ktery se ma pripojit k fragmentu volajici
   *                   tuto metodu
   */
  connectFragment : function(frag)
  {
    this.length += frag.length;
    this.text += frag.text;
    this.textRepEnt += frag.textRepEnt;
  }
  
  /**
   * toString
   */
//  toString : function ()
//	{
//		return "Fragment:Path[" + this.xpath + "]:Offset[" + this.offset + "]:Len[" +
//          this.length + "]:Text[" + this.text + "]\n";
//  }
};