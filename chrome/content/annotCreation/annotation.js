/**
 * Soubor: annotation.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Trida pro reprezentaci anotace(jeji obsah a anotovane fragmenty).
 *  Posledni uprava: 5.6.2012
 */

/**
 * Konstruktor
 */
annotationExtensionChrome.annotation = function(uri)
{
  //Inicializace
  this.uri = uri;
};

annotationExtensionChrome.annotation.prototype =
{ 
  uri : "",          /**< Identifikator uziv. rozhrani(vnorene anotace), ke kteremu objekt patri. */
  content : "",
  fragments : null,   /**< Typu annotationExtensionChrome.fragments. */
  ranges : [],        /**< Ulozene ranges pro anotaci */ 
  selectedRange : 1   /**< Vybrany range v anotaci */
};