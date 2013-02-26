/**
 * Soubor: listboxDatasource.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Poskytuje funkce pro praci s datasource pripojeneho ke stromu.
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

/**
 * Konstruktor
 * Vytvori objekt pro praci s datasource listu.
 * @param {string} listboxID id listboxu, pro ktery se pripoji datasource
 * @param {string} rootName jmeno 'korenoveho' prvku v datasource
 * @param {} dsTypes, viz atribut u annotaionExtensionChrome.Datasource
 * @param {Datasource} ds, datasource pro strom - vetsinou se vynecha, pokud je uveden, listboxDatasource pouzije
 *                         ten z parametru a nevytvori si vlastni - atribut dsTypes je potom ignorovan
 */
annotationExtensionChrome.ListboxDatasource = function(listboxID, rootName, ds, dsTypes)
{
  this.baseURI = annotationExtension.BASE_URI;
  this.namespace = annotationExtension.NAMESPACE;
  
  this.listboxID = listboxID;
  
  if (ds != undefined && ds != null)
  {
    this.rootName = ds.rootName;
    this.datasource = ds;
  }
  else
  {
    this.rootName = rootName;
    this.datasource = new annotationExtensionChrome.Datasource(rootName, dsTypes);
  }
    
  this.addDatasource();    
};

annotationExtensionChrome.ListboxDatasource.prototype =
{  
  datasource : null,
  listboxID : null,
  
  rootName : null,   /**< Jmeno "root elementu". */
  
  destroy : function()
  {
    var theList = document.getElementById(this.listboxID);

    theList.database.RemoveDataSource(this.getDatasource());
    theList.setAttribute("ref", '');
    
    this.datasource = null;
  },
  
  /**
   * "Vytvori" a prida datasource k listboxu
   */
  addDatasource : function()
  {
    try{
    var theList = document.getElementById(this.listboxID);

    theList.database.AddDataSource(this.getDatasource());
    //theList.setAttribute("datasources", this.datasource.resFile);
    theList.setAttribute("ref", this.baseURI + this.rootName);
    theList.builder.rebuild();}catch(ex){alert(ex.message);}
  },
  
  /**
   * Vrati resource na indexu v listboxu.
   * @param {int} index index radku v listboxu, pro ktery chceme resource
   * @return {nsIRDFResource} resource na dannem indexu
   */
  getRowResource : function(index)
  {
    try
    {
      var listbox = document.getElementById(this.listboxID);
      var item = listbox.getItemAtIndex(index);
      
      return item.resource;
    }
    catch(ex)
    {
      return null;
    }
  },
  
  /**
   * Vrati URI resource na danem indexu v listboxu
   * @param {int} index Index prvku v listboxu, pro ktery chceme URI
   * @returns {String} uri resource
   */
  getResourceURIOnIndex : function(index)
  {
    var resource = this.getRowResource(index);

    return resource.ValueUTF8;
  },
  
  /**
   * Vrati hodnotu vlastnosi resource na dannem indexu v listboxu
   * @param {int} index Index prvku v listboxu, pro ktery chceme property
   * @param {string} prop vlasnost, pro kterou chceme hodnotu
   * @returns {string} hodnotu pozadovane vlastnosti
   */
  getResourcePropOnIndex : function(index, prop)
  {
    var resource = this.getRowResource(index);
    return this.getResourceProp(resource, prop);
  },
  
  /**
   * @return {} datasource
   */
  getDatasource : function()
  {
    return this.datasource.ds;
  },
  
  /**
   * Smaze vsechny resources v datasource a ulozi zpet do souboru "prazdny datasource"
   */
  deleteAll : function()
  {   
    this.datasource.deleteAll();
  },
  
  /**
   * Smaze vsechny elementy v danem kontejneru a jejich resource
   * @param {string} resourceURI URI kontejneru, ve kterem chceme smazat elementy
   */
  delAllObjectsInSeq : function(resourceURI)
  {
    this.datasource.delAllObjectsInSeq(resourceURI);
  },
  
  /**
   * Smaze resource
   * @param {string} resourceURI URI resource, ktery se ma smazat
   * @param {string} sectionURI URI kontejneru, ve kterem je resource
   * @returns {bool} true, pokud doslo ke smazani, jinak false
   */
  deleteObject : function(resourceURI, sectionURI)
  {
    var retVal = this.datasource.deleteObject(resourceURI, sectionURI);
    return retVal;
  },
  
  /**
   * Prida novy objekt do datasource stromu
   * @param {} objekt, obsahujici atributy: name, ancestor, uri, group, attributes
   * povinne jsou name a uri, pokud je ancestor prazdny => rootElem datasource
   * @returns {bool} true, pokud se podarilo uspesne pripojit novy resource, jinak false
   */
  addNewObject : function(newObj, typeOfObject)
  {
    var retVal = this.datasource.addNewObject(newObj, typeOfObject);
    return retVal;
  },
  
  addNewObject2 : function(newObj, typeOfObject)
  {
    var retVal = this.datasource.addNewObject2(newObj, typeOfObject);
    return retVal;
  },
  
  addNewContainer : function(containerURI, containerParentURI)
  {
    var retVal = this.datasource.addNewContainer(containerURI, containerParentURI);
    return retVal;
  },
  
  /**
   * Vrati hodnotu vlastnosi resource
   * @param {nsIRDFResource} resource URI resource, pro ktery chceme property
   * @param {string} prop vlasnost(predicate!!!), pro kterou chceme hodnotu
   * @returns {string} hodnotu pozadovane vlastnosti
   */
  getResourceProp : function(resource, prop)
  {
    return this.datasource.getResourceProp(resource, prop);
  },
  
  /**
   * Zmeni hodnotu vlastnosi resource
   * @param {nsIRDFResource} resource resource, pro ktery chceme property
   * @param {string} propP vlasnost, pro kterou chceme zmenit hodnotu
   * @param {string} newValue nova hodnota vlastnosti
   */
  changeResourceProp : function(resource, propP, newValue)
  {
    this.datasource.changeResourceProp(resource, propP, newValue);
  },
  
  /**
   * Zda resource existuje
   * @param {String} sourceURI
   * @param {String} property
   * @param {String} value
   */
  sourceWithPropertyValueExists : function(sourceURI, property, value)
  {    
    return this.datasource.sourceWithPropertyValueExists(sourceURI, property, value);
  }
};