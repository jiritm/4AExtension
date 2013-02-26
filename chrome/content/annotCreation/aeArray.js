/**
 * Soubor: aeArray.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Trida pro ulozeni kolekce(typu, skupiny) a praci s ni.
 *  Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.aeArray = function()
{
  this.arrayOfObjs = [];
};

annotationExtensionChrome.aeArray.prototype =
{
  arrayOfObjs : null,  /**< Pole pvku. */
  
  /**
   * Vrati prvek na danem indexu
   * @param {int} index index typu
   * @return {type} typ na indexu, pokud je index mimo rozsah pole typu, vrati null
   */
  getAtIndex : function(index)
  {
    if(index >= 0 && index < this.arrayOfObjs.length)
    {
      return this.arrayOfObjs[index];
    }
    else
      return null;
  },
  
   /**
   * Vrati prvni prvek na indexu a odstrani ho
   * @return {type} typ na indexu, pokud je index mimo rozsah pole typu, vrati null
   */
  shift : function()
  {
    return this.arrayOfObjs.shift();
  },
  
  /**
   * @returns {int} pocet ulozenych prvku
   */
  get count() { return this.arrayOfObjs.length; },
  
  /**
   * @returns {int} pocet ulozenych prvku
   */
  get size() { return this.arrayOfObjs.length; },
  
  /**
   * @param {string} prop, vlastnost, ktera ma mit danou hodnotu
   * @param {string} value, hodnota kterou ma mit dana vlastnost
   * @returns {int} index prvku s vlastnosmi v parametru
   *                pokud zadny prvek nema danou vlastnost nebo danou hodnota, vrati zaporne cislo
   */
  getIndexByProp : function(prop, value)
  {
    var obj = null;
    var countP = this.count;
    for(var i = 0; i < countP; i++)
    {
      obj = this.arrayOfObjs[i];
      if (obj[prop] == value)
        return i;
    }
    
    return -1;
  },
  
  /**
   * Prida typ na konec pole typu
   * @param {type} typ, ktery se ma pridat
   */
  addNew : function(type)
  {
    this.arrayOfObjs.push(type);
  },
  
  deleteOnIndex : function(index)
  {
    this.arrayOfObjs.splice(index, 1);
  },
  
  /**
   * Smaze vsechny prvky
   */
  deleteAll : function()
  {
    this.arrayOfObjs.splice(0, this.arrayOfObjs.length);
  }
};

//TODO: PRESUNOUT NEKAM JINAM

//Pro predavani mezi modulem klienta a programem.
//Odtud bere "program" typy, ktere obdrzel klient
annotationExtensionChrome.types = new annotationExtensionChrome.aeArray();
//Odtud bere klient typy, ktere zasle ve zprave add
annotationExtensionChrome.createdTypes = new annotationExtensionChrome.aeArray();
//Typy, ktere se odeslou na server ke smazani.
annotationExtensionChrome.deleteTypes = new annotationExtensionChrome.aeArray();
//Typy, ktere se prijaly od serveru a maji byt smazany.
annotationExtensionChrome.deletedTypes = new annotationExtensionChrome.aeArray();
//Odtud bere "program" skupiny, ktere obdrzel klient
annotationExtensionChrome.groups = new annotationExtensionChrome.aeArray();
//Odtud bere klient, anotace pro smazani
annotationExtensionChrome.removedAnnotations = [];
//Odtud bere "program" atributy z ontologie
annotationExtensionChrome.attrsFromOntology = [];

//Pro nalezeni uri, pokud se zada text - pomocne "pole"
annotationExtensionChrome.autocompleteURIs = new annotationExtensionChrome.aeArray();