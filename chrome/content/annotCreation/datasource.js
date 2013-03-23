/**
 * Soubor: datasource.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro praci s datasource.
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

/**
 * Konstruktor
 * Vytvori objekt pro praci s datasource
 * @param {String} rootName, jmeno korenoveho prvku (napr. ds typu, bude mit rootName = types)
 * @param {Array} dsTypes, pole objektu obsahujici atributy: type : "typeName",
 *                                                         props : ["propName1", "propName2",...]
 */
annotationExtensionChrome.Datasource = function(rootName, dsTypes)
{
  try
  {
    this.rootName = rootName;
    
    this.namespace = annotationExtension.NAMESPACE;
    this.baseURI = annotationExtension.BASE_URI;
    
    //Ulozeni "typu objektu" s jakymi "pracuje ds"
    for (var i = 0; i < dsTypes.length; i++)
    {
      if (dsTypes[i].type == "containerType") //Typ nemuze mit toto jmeno
        continue;
      
      if (i == 0)
        this.defaultType = dsTypes[i].type;
        
      this.types[dsTypes[i].type] = dsTypes[i].props; //V types je atribut jmena, ktere odpovida jmenu typu
                                                      //jehoz hodnota je pole vlastnosti(atributu) typu
    }
    

    var newDataSource = this.createInMemDataSource(this.baseURI+rootName);
    this.setDatasource(newDataSource);
    //this.init(); //POUZE PRO TESTOVACI UCELY - VYPISY... PRI POUZITI SE MUZOU
                   //VYSKYTOVAT VYJIMKY DIKY ASYNCH. CHOVANI
    
    //Kazdy datasource ma tento "typ objektu"
    this.types.container = [];
  }
  catch(ex)
  {
    alert('datasource.js : annotationExtensionChrome.Datasource:\n' + ex.message);
  }
};

annotationExtensionChrome.Datasource.prototype =
{ 
  namespace : null,
  baseURI : null,
  ds : null,         /**< rdf datasource. */
  types : {},        /**< jake "typy objektu" a jejich atributy, ktere lze do ds ulozit. */
  defaultType : "",  /**< jaky typ se pri ukladani do ds pouzije jako vychozi. */
  
  typeOfObjectPropName : "typeOfObject",  /**< Jmeno vlastnosti, kterou ma kazdy resource - typ. */
  
  rootName : null,   /**< Jmeno "root elementu". */
  
  /**
   * Vytvori novy in-memory-datasource
   * @param {String} rootURI, uri korenoveho ktery se vytvori v datasource (muze byt null)
   * @returns {nsIRDFDataSource} nove vytvoreny datasource
   */
  createInMemDataSource : function(rootURI)
  {
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
    var rdfContainerUtils = Components.classes["@mozilla.org/rdf/container-utils;1"].getService(Components.interfaces.nsIRDFContainerUtils);
    
    var newContainer = Components.classes["@mozilla.org/rdf/container;1"].createInstance(Components.interfaces.nsIRDFContainer);
    var newDataSource = Components.classes['@mozilla.org/rdf/datasource;1?name=in-memory-datasource'].createInstance(Components.interfaces.nsIRDFDataSource);
    
    if (rootURI != null)
    {
      var rootResource = rdfService.GetResource(rootURI);
      //Vytvori novy korenovy kontejner
      rdfContainerUtils.MakeSeq(newDataSource, rootResource);
      //Inicializuje korenovy kontejner v datasource
      newContainer.Init(newDataSource, rootResource);
    }
    
    return newDataSource;
  },
  
  
  /**
   * Nastavi datasource
   */
  setDatasource : function(datasource)
  {
    this.ds = datasource;
  },
  
  /**
   * @return {} datasource
   */
  getDatasource : function()
  {
    return this.ds;
  },
  
  destroy : function()
  {
    this.ds = null;
  },
  
  /**
   * Smaze vsechny resources v datasource
   */
  deleteAll : function()
  {
    try
    {
      this.delAllObjectsInSeq(this.baseURI + this.rootName);
    }
    catch(ex)
    {
      alert('datasource.js : deleteAll:\n' + ex.message);
    }
  },
  
  /**
   * Zkontroluje, zda je kontejner prazny.
   * @param {String} resourceURI resource
   * @returns {bool} true, pokud je prazdny nebo pokud resource neni kontejner
   *                 false, jinak
   */
  containerIsEmpty : function(resourceURI)
  {
    try
    {
      var datasource = this.ds;
      if (datasource == null)
        return false;
      
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
       
  
      var theSectionHeading = rdfService.GetResource(resourceURI);
      
      if (!containerTools.IsContainer(datasource, theSectionHeading))
        return true;
      else if (containerTools.IsEmpty(datasource,theSectionHeading))
        return true;
      else
        return false;
    }
    catch(ex)
    {
      alert('datasource.js : containerIsEmpty:\n' + ex.message);
      return false;
    }
  },
  
  /**
   * Smaze vsechny "objekty" v danem kontejneru
   * @param {string} resourceURI URI kontejneru, ve kterem chceme smazat "objekty"
   */
  delAllObjectsInSeq : function(resourceURI)
  {
    try
    {
      var datasource = this.ds;
      if (datasource == null)
        return;
      
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
       
      //Kontejner   
      var theSectionHeading = rdfService.GetResource(resourceURI);
      
      //Neni kontejner...
      if (!containerTools.IsContainer(datasource, theSectionHeading))
      {
        return;
      }
      
      theSectionContainer.Init(datasource, theSectionHeading);
      
      var childElems = theSectionContainer.GetElements();
      
      //Smazani vsech elementu v kontejneru
      while(childElems.hasMoreElements())
      {
        var child = childElems.getNext();
        child.QueryInterface(Components.interfaces.nsIRDFResource);
        
        //Zjisteni, zda je element v kontejneru take kontejner
        if (containerTools.IsContainer(datasource, child))
        {//Smazani vsech elementu v kontejneru dalsi urovne
          this.delAllObjectsInSeq(child.ValueUTF8);
        }
        
        //Pokud byl kontejner, potomci smazani
        //Smaz element z kontejneru a jeho zaznam
        this.deleteObject(child.ValueUTF8, resourceURI);
        
        childElems = theSectionContainer.GetElements();
      }
    }
    catch(ex)
    {
      alert('datasource.js : delAllObjectsInSeq:\n' + ex.message);
    }
  },
  
  /**
   * Smaze "objekt dany resource"
   * @param {string} resourceURI URI resource, ktery se ma smazat
   * @param {string} sectionURI URI kontejneru, ve kterem je resource
   * @returns {bool} true, pokud doslo ke smazani, jinak false
   */
  deleteObject : function(resourceURI, sectionURI, aRenumber)
  {
    try
    {
      if (aRenumber == undefined || aRenumber == null || aRenumber == true)
        var renumber = true;
      else
        var renumber = false;
      
      var dataSource = this.ds;
      if (dataSource == null)
      {
        return false;
      }
    
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
      
      var theSubject = rdfService.GetResource(resourceURI);
      
      //Smaz kontejner
      if (containerTools.IsContainer(dataSource,theSubject))
      {
        if (!(containerTools.IsEmpty(dataSource,theSubject)))
        {//Smazani polozek v kontejneru
          this.delAllObjectsInSeq(resourceURI);
        }
        
      }//Odstraneni kontejneru
        
      var typeOfObject = this.getResourceProp(theSubject, this.typeOfObjectPropName);
      var objectProperties = this.types[typeOfObject];
        
      thePredicate = rdfService.GetResource(this.namespace + this.typeOfObjectPropName);
      theTarget = dataSource.GetTarget(theSubject,thePredicate,true);
      if (theTarget != null)
        dataSource.Unassert(theSubject,thePredicate,theTarget,true);
      
      //Smazani triplu
      for (var i = 0; i < objectProperties.length; i++)
      {
        var prop = objectProperties[i];
        
        thePredicate = rdfService.GetResource(this.namespace + prop);
        theTarget = dataSource.GetTarget(theSubject,thePredicate,true);
        if (theTarget != null)
          dataSource.Unassert(theSubject,thePredicate,theTarget,true);
      }
      
      //Odstraneni resource z kontejneru, pokud v nejakem je
      var theSectionHeading = rdfService.GetResource(sectionURI);
      theSectionContainer.Init(dataSource,theSectionHeading);
      
      if (theSectionContainer.IndexOf(theSubject) != -1)
      {
        theSectionContainer.RemoveElement(theSubject,renumber); 
      }
      
      return true;
    }
    catch (ex)
    {
      //alert('datasource.js : deleteObject:\n' + ex.message);
      //alert(typeOfObject + '\n' + resourceURI);
      //alert(this.types['annotTypeRef']);
      return false;
    }
  },
  
  /**
   * Prida novy kontejner do datasource
   * @param {string} containerURI URI pro novy kontejner
   * @param {string} containerParentURI URI resource, ke kteremu se ma pripojit novy kontejner
   */
  addNewContainer : function(containerURI, containerParentURI)
  {
    try
    {
      if (containerURI == null || containerURI == "" || containerParentURI == null || containerParentURI == "")
        return false;
      
      var dataSource = this.ds;

      if (dataSource == null)
      {
        //TODO:
        //Handle this
        return false;
      }
  
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
  
      /////////////////////////////////////////////////////////////////////////
      var theSubject = rdfService.GetResource(containerURI);
      
      var thePredicateName =  rdfService.GetResource(this.namespace + this.typeOfObjectPropName);
      var theName = rdfService.GetLiteral("container");
      
      //if (dataSource.HasAssertion(theSubject, thePredicateName, theName, true))
        //return true;
      
      //URI kontejneru - rodice
      var theSectionHeading = rdfService.GetResource(containerParentURI);
      //Vytvoreni kontejneru z rodice, pokud jim neni
      if (!containerTools.IsSeq(dataSource, theSectionHeading))
        containerTools.MakeSeq(dataSource,theSectionHeading);

      //Pridani resource do datasource
      //dataSource.Assert(theSubject, thePredicateName, theName, true);

      theSectionContainer.Init(dataSource,theSectionHeading);
      if (theSectionContainer.IndexOf(theSubject) != -1)
      {//Uz je v parentu
        ;
      }
      else
      {//Pridani do kontejneru
        //alert(containerURI + '\n'+ containerParentURI);
        theSectionContainer.AppendElement(theSubject);
      }
    }
    catch (e)
    {
      alert('datasource.js : addNewContainer:\n' + e.message);
      //TODO:
      //Handle this
      return false;
    }
    
    return true;
  },
  
  /**
   * Prida novy objekt do datasource, tak, ze pro nej vytvori resource...
   * @param {Object} newObj objekt, obsahujici atributy: name, uri a dalsi, podle pole this.properties
   * povinne je uri, pokud je ancestor prazdny => ancestor pro resource ve strome je rootElem datasource
   * @param {String} typeOfObjectP, tento parametr urcuje jake vlastnosti(atributy) musi mit vkladany objekt
   *                 vlastnosti pro typ byly nadefinovany pri vytvareni datasource
   *                 pokud neni tento atribut uveden, pouzije se defaultType
   * @returns {bool} true, pokud se podarilo uspesne pripojit novy resource, jinak false
   */
  addNewObject : function(newObj, typeOfObjectP)
  {
    try
    {
      var dataSource = this.ds;

      if (dataSource == null)
      {
        //TODO:
        //Handle this
        return false;
      }
      
      if (typeOfObjectP == undefined || typeOfObjectP == null)
        var typeOfObject = this.defaultType;
      else
        var typeOfObject = typeOfObjectP;
  
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
  
      /////////////////////////////////////////////////////////////////////////
      //Kontrola objektu
      if (this.checkObject(newObj, typeOfObject) == false)
      {
        return false;
      }
      
      var parentURI;
      if (newObj.ancestor == undefined || newObj.ancestor == null || newObj.ancestor == "")
        parentURI = this.baseURI + this.rootName;
      else
        parentURI = newObj.ancestor;
  
      /////////////////////////////////////////////////////////////////////////
      var theSubject = rdfService.GetResource(newObj.uri);
      
      var thePredicateType =  rdfService.GetResource(this.namespace + this.typeOfObjectPropName);
      var theType = rdfService.GetLiteral(typeOfObject);
      
      //URI kontejneru/rodice
      var theSectionHeading = rdfService.GetResource(parentURI);      

      //Vytvoreni kontejneru z rodice, pokud jim neni
      if (!containerTools.IsSeq(dataSource, theSectionHeading))
        containerTools.MakeSeq(dataSource,theSectionHeading);

      //Resource existuje a bude nekde ve stromu...
      if (this.tripleExists(theSubject, thePredicateType, theType, dataSource))
      {//TODO: delete asi nebude uplne to prave
        this.deleteObject(newObj.uri, parentURI);
      }
      
      dataSource.Assert(theSubject, thePredicateType, theType, true);
      
      theSectionContainer.Init(dataSource,theSectionHeading);
      //Jeste neni v kontejneru
      if (theSectionContainer.IndexOf(theSubject) != -1)
      {
        return false;
      }
      
      var objectProperties = this.types[typeOfObject];
      ////////////////////////////////
      //Pridani ostatnich vlastnosti
      for (var i = 0; i < objectProperties.length; i++)
      {
        var prop = objectProperties[i];
        
        if (Array.isArray(newObj[prop]))
        {//Pokud je prop pole...
          var arrayStr = JSON.stringify(newObj[prop]);
          arrayStr = arrayStr.replace(/"/g, "'");
          var theObject = rdfService.GetLiteral(arrayStr);
        }
        else
        {
          var theObject = rdfService.GetLiteral(newObj[prop]);
        }
        
        var thePredicate = rdfService.GetResource(this.namespace + prop);
        dataSource.Assert(theSubject, thePredicate, theObject, true);
      }
      ///////////////////////////////
      //Pridani do kontejneru
      theSectionContainer.AppendElement(theSubject);
    }
    catch (e)
    {
      alert('datasource.js : addNewObject:\n' + e.message);
      //TODO:
      //Handle this
      return false;
    }
    
    return true;
  },  
  
  /**
   * Pridani objektu, s pov. polozkami uri a name, ktery ma pole atributu
   * Atributy potom musi mit vlastnosti urcene typem v  poli, v urcenem poradi (tak jak jsou v poli typu) - na prvnim miste musi byt jmeno
   * atributu - pouzije se pro zkonstruovani uri
   * Kazdy atribut se prida jako resource(uri je urceno jako uriObjektuVeKteremJeAtt/nameAtributu) a pridan k "resource objektu" jako stromovy list.
   */
  addNewObject2 : function(newObj, attrTypeOfObjectP)
  {
    try
    {
      var dataSource = this.ds;

      if (dataSource == null)
      {
        //TODO:
        //Handle this
        return false;
      }
      
      if (attrTypeOfObjectP == undefined || attrTypeOfObjectP == null)
        var attrTypeOfObject = this.defaultType;
      else
        var attrTypeOfObject = attrTypeOfObjectP;
  
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
  
      /////////////////////////////////////////////////////////////////////////
      //Kontrola objektu
      if (newObj.name == undefined || newObj.name == null || newObj.name == "" ||
          newObj.uri == undefined || newObj.uri == null || newObj.uri == "")
      {
        //TODO:
        //Handle this
        return false;
      }
      
      //////////////////////////////////////////////////////////////////////////
      //VLOZENI TYPU DO RESOURCE
      //vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//////
      var parentURI = this.baseURI + this.rootName;                           
                                                                              
      var theSubject = rdfService.GetResource(newObj.uri);
      var thePredicateType =  rdfService.GetResource(this.namespace + this.typeOfObjectPropName);
      var theType = rdfService.GetLiteral('container');
      
      var theSectionHeading = rdfService.GetResource(parentURI);

      //Vytvoreni kontejneru z rodice, pokud jim neni
      if (!containerTools.IsSeq(dataSource, theSectionHeading))
        containerTools.MakeSeq(dataSource,theSectionHeading);

      if (!this.tripleExists(theSubject, thePredicateType, theType, dataSource))
      {//Pridani resource do datasource
        dataSource.Assert(theSubject, thePredicateType, theType, true); 
      }
      
      theSectionContainer.Init(dataSource,theSectionHeading);
      if (theSectionContainer.IndexOf(theSubject) == -1)
      {//Pridani do kontejneru
        theSectionContainer.AppendElement(theSubject);
      }
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//
      /////////////////////////////////////////////////////////////////////
      
      ////////////////////////////////
      //Pridani atributu
      if(newObj.attributes == undefined || newObj.attributes == null)
      {
        //nema zadne atributy, "uspesne vse vlozeno"
        return true;
      }
      
      //Vytvoreni kontejneru z "objektu", pokud jim neni
      if (!containerTools.IsSeq(dataSource, theSubject))
        containerTools.MakeSeq(dataSource, theSubject);

      var theASectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var theASectionHeading = rdfService.GetResource(newObj.uri);
      theASectionContainer.Init(dataSource,theASectionHeading);
      
      var attr = newObj.attributes;
      var objectProperties = this.types[attrTypeOfObject];
      
      var thePredicateType =  rdfService.GetResource(this.namespace + this.typeOfObjectPropName);

      for(var i = 0; i < attr.length; i++)
      {//Pridej vsechny atributy
        if (attr[i].length < objectProperties.length)
        {//Atribut nema vsechny polozky nebo je "divny"
          continue;
        }
        
        var theSubjectAttr = rdfService.GetResource(newObj.uri + '/' + attr[i][0]); 
        var thePredicateAType = rdfService.GetResource(this.namespace + this.typeOfObjectPropName);
        var theObjectAType = rdfService.GetLiteral(attrTypeOfObject);
        
        if (this.tripleExists(theSubjectAttr, thePredicateAType, theObjectAType, dataSource))
        {
          this.deleteObject(newObj.uri + '/' + attr[i][0], newObj.uri)
        }
        
        dataSource.Assert(theSubjectAttr, thePredicateAType, theObjectAType, true);
        
        for (var j = 0; j < objectProperties.length; j++)
        {//Pridani ostatnich vlastnosti atributu
          var prop = objectProperties[j];
        
          var thePredicateAProp = rdfService.GetResource(this.namespace + prop);
          var theObjectAProp = rdfService.GetLiteral(attr[i][j]);
          dataSource.Assert(theSubjectAttr, thePredicateAProp, theObjectAProp, true);
        }
        
        //Pridani atributu k typu...
        theASectionContainer.AppendElement(theSubjectAttr);       
      }
    }
    catch (e)
    {
      alert('datasource.js : addNewObject2:\n' + e.message);
      //TODO:
      //Handle this
      return false;
    }
    
    return true;
  },
  
  /**
   * Zda triple existuje v datasource
   * @param {nsIRDFResource} source
   * @param {nsIRDFResource} property
   * @param {nsIRDFNode} target
   */
  tripleExists : function(source, property, target)
  {
    var dataSource = this.ds;

    if (dataSource == null)
    {
      return false;
    }
    
    if (dataSource.HasAssertion(source, property, target, true))
      return true;
    
    return false;
  },
  
  /**
   * Zda resource existuje
   * @param {String} sourceURI
   * @param {String} property
   * @param {String} value
   */
  sourceWithPropertyValueExists : function(sourceURI, prop, value)
  {
    var dataSource = this.ds;

    if (dataSource == null)
    {
      //TODO:
      //Handle this
      return false;
    }

    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);

    var theSubject = rdfService.GetResource(sourceURI);
    var thePredicateName =  rdfService.GetResource(this.namespace + prop);
    var theName = rdfService.GetLiteral(value);

    //Resource existuje a bude nekde ve stromu...
    var exists = this.tripleExists(theSubject, thePredicateName, theName, dataSource);
    return exists;
  },
  
  /**
   * Zkontroluje, zda objekt daneho typu obsahuje vsechny atributy, potrebne pro pridani
   * resource.
   */
  checkObject : function(obj, type)
  {
    /////////////////////////////////////////////////////////////////////////
    //Kontrola objektu
    if (obj.uri == undefined || obj.uri == null || obj.uri == "")
    {
      return false;
    }
    
    var typeProps = this.types[type];
    for(var i = 0; i < typeProps.length; i++)
    {
      var prop = typeProps[i];
      
      if (obj[prop] == undefined || obj[prop] == null)
        return false;
    }
    
    return true;
  },
  
  /**
   * Zmeni hodnotu vlastnosi resource, pokud vlastnost neexistuje, prida ji
   * @param {nsIRDFResource} resource resource, pro ktery chceme property
   * @param {string} propP vlasnost, pro kterou chceme zmenit hodnotu
   * @param {string} newValue nova hodnota vlastnosti
   */
  changeResourceProp : function(resource, propP, newValue)
  {
    try
    {
      var dataSource = this.ds;
      if (dataSource == null)
        return;
    
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
          
      if (typeof(resource) == 'string')    
        var theSubject = rdfService.GetResource(resource);
      else
        var theSubject = resource;
       
      var prop = this.namespace + propP;  
        
      var thePredicate = rdfService.GetResource(prop);
      var theTarget = dataSource.GetTarget(theSubject, thePredicate, true);
      
      var theNewObject = rdfService.GetLiteral(newValue);
    
      if (theTarget != null)
      {
        dataSource.Change(theSubject, thePredicate, theTarget, theNewObject, true);
      }
      else
      {
        dataSource.Assert(theSubject, thePredicate, theNewObject, true);
      }
      //else
      //Pozadovana vlastnost neexistuje
        //return;      
    }
    catch (e)
    {
      alert('datasource.js : changeResourceProp:\n' + e.message);
    }
  },
  
  /**
   * Vrati hodnotu vlastnosi resource
   * @param {nsIRDFResource} resource resource, pro ktery chceme property
   * @param {string} propP vlasnost, pro kterou chceme hodnotu
   * @returns {string} hodnotu pozadovane vlastnosti, pokud vlastnost neexistuje, vrati null
   */
  getResourceProp : function(resource, propP)
  {
    var dataSource = this.ds;

    if (dataSource == null)
    {
      return null;
    }
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);

    if (typeof(resource) == 'string')    
      var theSubject = rdfService.GetResource(resource);
    else
      var theSubject = resource;
      
    var prop = this.namespace + propP;
    var propRS =  rdfService.GetResource(prop);
    
    var retVal = dataSource.GetTarget(theSubject, propRS, true);
  
    if(retVal == null)
		  return null;

    return retVal.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
  },
  
  /**
   * Prida resource do "kontejneru"
   * @param {nsIRDFResource, string} resource resource, ktery se ma pridat
   * @param {nsIRDFResource, string} container, resource, do ktereho pridavame resource
   */
  addResourceToContainer : function(resource, container)
  {
    try
    {
      var dataSource = this.ds;

      if (dataSource == null)
      {
        //TODO:
        //Handle this
        return false;
      }
    
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
        
        
      if (typeof(resource) == 'string')    
        var theSubject = rdfService.GetResource(resource);
      else
        var theSubject = resource;
        
      if (typeof(container) == 'string')    
        var theSectionHeading = rdfService.GetResource(container);
      else
        var theSectionHeading = container;  
          

      //Vytvoreni kontejneru z rodice, pokud jim neni
      if (!containerTools.IsSeq(dataSource, theSectionHeading))
        containerTools.MakeSeq(dataSource, theSectionHeading);

      theSectionContainer.Init(dataSource,theSectionHeading);
      //Jeste neni v kontejneru
      if (theSectionContainer.IndexOf(theSubject) != -1)
      {
        return false;
      }
      
      theSectionContainer.AppendElement(theSubject);
      
      return true
    }
    catch (e)
    {
      alert('datasource.js : addResourceToContainer:\n' + e.message);
      return false;
    }
  },
  
  
  //PRO TESOVACI UCELY POUZE - VYPISY DATASOURCE DO SOUBORU
  //POTOM SE V KONSTRUKTORU ODKOMENTUJE this.init() A ZAKOMENTUJI SE 2 RADKY NAD TIM
  //VYPIS SE POTOM PROVEDE FUNKCI flushDatasource() viz dale
  //SOUBOR JE K NALEZENI V ADRESARI PROFILU FIREFOXU/annotationExtension/...
  init : function(reset)
  {
    try{
    var res;
    if(reset == undefined)
      res = false;
    else
      res = reset;
      
    fileName = this.rootName + '.rdf';
    //Adresar profilu
    var file = Components.classes["@mozilla.org/file/directory_service;1"].
           getService(Components.interfaces.nsIProperties).
           get("ProfD", Components.interfaces.nsIFile);
    
    //Adresar anotacniho doplnku
    file.append('annotationExtension');
    if(!file.exists() || !file.isDirectory())
    {//Pokud adresar jeste neexistuje, vytvor ho
      file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
    }
    
    var existed = false;   /**< Indikuje, zda soubor pro datasource existoval -> byla do nej nahrana data. */
    
    file.append(fileName)  
    if (!file.exists())
    {//Soubor neexistuje vytvor ho a zapis do nej RDF
      file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0777);
      existed = false;
    }
    else if(file.exists() && res)
    {//Soubor existuje a je nastaven reset
      file.remove(false);
      file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0777);
      existed = false;
    }
    else
    {
      existed = true;
    }
    
    this.resFile = 'file://' + file.path;
    this.file = file;
    if(!existed)
    {
      var file = this.file;
      var data = '<?xml version="1.0"?>\n\
      <RDF:RDF xmlns:AnnotExt="'+this.namespace+'"\n\
      xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n\
      <RDF:Seq RDF:about="'+this.baseURI+this.rootName+'">\n\
      </RDF:Seq>\n\
      </RDF:RDF>';
      
      var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                     createInstance(Components.interfaces.nsIFileOutputStream);
      
      // use 0x02 | 0x10 to open file for appending.
      foStream.init(file, 0x02 | 0x08 | 0x20, 0777, 0); 
  
      var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                      createInstance(Components.interfaces.nsIConverterOutputStream);
      converter.init(foStream, "UTF-8", 0, 0);
      converter.writeString(data);
      converter.close();
    }
    
    //////////////////////////////////////////////////////////////////////////////////////////
    //Vytvoreni datasource
   
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
        .getService(Components.interfaces.nsIRDFService);
  
      var datasource = rdfService.GetDataSource(this.resFile);
      this.ds = datasource;
    }
    catch(ex)
    {
      alert('datasource.js : init:' + ex.message);
    }
    //////////////////////////////////////////////////////////////////////////////////////////
    
    return existed;
  },
  
  flushDatasource : function()
  {
    try
    {
      var dataSource = this.ds;
      if (dataSource == null)
        return;
      dataSource = dataSource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
      dataSource.Flush();
  
      //dataSource.Refresh(true);
    }
    catch(ex)
    {
      alert('datasource : flushDatasource:\n' + ex.message);
    }
  }
};