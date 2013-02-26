/**
 * Soubor: type.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Reprezentuje typ anotace.
 * Posledni uprava: 5.6.2012
 */

/**
 * Konstruktor
 * @param {String} name jmeno typu
 * @param {String} ancestor predek typu
 * @param {String} uri uri typu
 * @param {String} group skupina typu
 * @param {Array} ancestorsArray pole s predchudci pro typ
 */
annotationExtensionChrome.type = function(name, ancestor, uri, group, ancestorsArray, comment)
{
  //Inicializace
  this.name = name;
  this.ancestor = ancestor;
  this.uri = uri;
  this.group = group;
  this.attributes = [];
  this.comment = comment;
  
  if (ancestorsArray != undefined && ancestorsArray != null)
    this.ancestorsArray = ancestorsArray;
  else
    this.ancestorsArray = [];
};

annotationExtensionChrome.type.prototype =
{
  name : "",
  ancestor : "",
  ancestorsArray : null,
  uri : "",
  group : "",
  attributes : null,
  comment : "",
  
  /**
   * Prida typu atribut
   * @param {String} name jmeno atributu
   * @param {String} type typ atributu
   * @parama {bool} req polozka atributu required
   */
  addAttribute : function(name, type, def, req, struct, comment)
  {
    var att = [name, type, def, req, struct, comment];
    this.attributes.push(att);
  },
  
  /**
   * @return {bool} true, pokud ma typ nejaky atribut
   *                false, pokud typ nema zadny atribut
   */
  hasAttribute : function()
  {
    if (this.attributes.length > 0)
      return true;
    else
      return false;
  }
};