/**
 * Soubor: treeDatasource.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Poskytuje funkce pro praci s datasource pripojeneho ke stromu.
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

/**
 * Konstruktor
 * Vytvori objekt pro praci s datasource stromu.
 * @param {string} treeID id stromu, pro ktery se pripoji datasource
 * @param {string} rootName jmeno 'korenoveho' prvku v datasource
 * @param {Datasource} ds, datasource pro strom - vetsinou se vynecha (null), pokud je uveden, treeDatasource pouzije
 *                         ten z parametru a nevytvori si vlastni - atribut dsTypes je potom ignorovan
 * @param {} dsTypes, viz atribut u annotaionExtensionChrome.Datasource
 *                    nemusi byt definovan, pokud je uveden ds
 */
annotationExtensionChrome.TreeDatasource = function(treeID, rootName, ds, dsTypes)
{
  this.baseURI = annotationExtension.BASE_URI;
  this.namespace = annotationExtension.NAMESPACE;
  
  this.treeID = treeID;
  
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

annotationExtensionChrome.TreeDatasource.prototype =
{  
  datasource : null,
  treeID : null,
  
  rootName : null,   /**< Jmeno "root elementu". */
  
  destroy : function()
  {
    var theTree = document.getElementById(this.treeID);

    theTree.database.RemoveDataSource(this.getDatasource());
    theTree.setAttribute("ref", '');
    
    this.datasource = null;
  },
  
  /**
   * "Vytvori" a prida datasource ke stromu
   */
  addDatasource : function()
  {
    var theTree = document.getElementById(this.treeID);

    theTree.database.AddDataSource(this.getDatasource());
    //theTree.setAttribute("datasources", this.datasource.resFile);
    theTree.setAttribute("ref", this.baseURI + this.rootName);
    //theTree.builder.refresh();
    theTree.builder.rebuild();
  },
  
  /**
   * @return {int} index vyberu ve stromu, -1 pokud neni nic vybrano
   */
  getSelectionIndex : function()
  {
    var view = document.getElementById(this.treeID).view;
    
    return view.selection.currentIndex;
  },
  
  /**
   * @return {String} URI vyberu ve stromu, pokud neni nic vybrano, vrati null
   */
  getSelectionURI : function()
  {
    var index = this.getSelectionIndex();
    
    if (index > -1)
      return this.getResourceURIOnIndex(index);
    else
      return null;
  },
  
  /**
   * @return {int} index rodice vyberu ve stromu, pokud neni nic vybrano, cislo mensi jak -1
   */
  getSelectionParentIndex : function()
  {
    var view = document.getElementById(this.treeID).view;
    var selIndex = this.getSelectionIndex(); 
    if(selIndex > -1)
    {
      return view.getParentIndex(selIndex);
    }
    else
      return -2;
  },
  
  /**
   * @return {string} URI rodice aktualniho vyberu, null, pokud neni nic vybrano
   */
  getSelectionParentURI : function()
  {
    var selParentIndex = this.getSelectionParentIndex();  /**< Index rodice vybraneho radku. */
    var parentURI;
    if (selParentIndex > -1)
    {
      return this.getResourceURIOnIndex(selParentIndex);
    }
    else if (selParentIndex == -1)
    {
      return this.baseURI + this.rootName;
    }
    else
    {//Neni nic vybrano
      return null;
    }    
  },
  
  /**
   * Vrati resource na indexu ve strome.
   * @param {int} index index radku ve strome, pro ktery chceme resource
   * @return {nsIRDFResource} resource na dannem indexu
   */
  getRowResource : function(index)
  {
    try
    {
      var view = document.getElementById(this.treeID).view;
    
      if (view.getResourceAtIndex != null)
      {//Strom je vytvoren s flags="dont-build-content"
        return view.getResourceAtIndex(index);
      }
      else
      {//Strom obsahuje DOM uzly (nema atribut flags="dont-build-content")
        return view.getItemAtIndex(index).resource;
      }
    }
    catch(ex)
    {
      return null;
    }
  },
  
  /**
   * Vrati URI resource na danem indexu ve strome
   * @param {int} index Index resource ve strome, pro ktery chceme URI
   * @returns {String} uri resource
   */
  getResourceURIOnIndex : function(index)
  {
    var resource = this.getRowResource(index);

    return resource.ValueUTF8;
  },
  
  /**
   * Vrati hodnotu vlastnosi resource na dannem indexu ve stromu
   * @param {int} index Index resource ve strome, pro ktery chceme property
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