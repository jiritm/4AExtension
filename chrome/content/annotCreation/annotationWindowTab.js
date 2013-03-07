/**
 * Soubor: AnotationWindowTab.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Ulozi okno anotace.
 *  Posledni uprava: 5.6.2012
 */
annotationExtensionChrome.annotationWindowTab = function(aeWindowObj, aeAttrObj, tabIDP)
{
  try
  {
    this.save(aeWindowObj, aeAttrObj, tabIDP, 'aeAttrTree');
    this.nestedAnnotations = new annotationExtensionChrome.aeArray();
    this.changedTypes = new annotationExtensionChrome.aeArray();
    
    //var attr = { name : nameP, req : reqP, type : typeP, uri : ancestorP + '/' + nameP, ancestor : ancestorP, def : defP, struct : structP};
    //annotationExtensionChrome.attrDatasource.addNewObject(attr);
    //Pridani vetve atributu do attr.rdf pro zalozku
    //alert(annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName);
    
    this.attributeURI = annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.masterRootName + '-tab' + tabIDP;
    this.attributeRootName = annotationExtensionChrome.attrDatasource.masterRootName + '-tab' + tabIDP;
    annotationExtensionChrome.attrDatasource.addNewContainer(this.attributeURI, annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.masterRootName);
  }
  catch(ex)
  {
    alert('annotationWindowTab.js : annotationWindowTab:\n' + ex.message);
  }
}

annotationExtensionChrome.annotationWindowTab.prototype =
{
  tabID : "",
  //Text, anotace, ranges, fragments
  annotation : null,
  nestedAnnotations : null,  /**< Pole s vnorenymi anotacemi. */
  typeURI : "",
  typeName : "",
  attributeURI : "",         /**< URI atributu v attr.rdf, ktere se vaze k teto zalozce. */
  attributeRootName : "",    /**< Root NAME, pro attrDatasource pro tuto zalozku. */
  documentAnnotation : false,
  content : "",
  attrTreeIndex : -1,         /**< Index vybraneho atributu ve stromu atributu (po ulozeni). */
  
  changedTypes : null,       /**< Pole s typy, ktere se odeslou na server jako zmenene. */
  loadAttributes : true,     /**< Zda pri vyberu typu nahrat sablonu atributu. */
  
  editing : false,
  editingAnnotID : false,
  editingAnnotTmpId : false,
  
  /**
   * Ulozi hodnoty z okna
   * @param {annotationWindow object} aeWindowObj okno, ktere se ma ulozit
   * @param {attributes object} aeAttrObj objekt atributuu
   * @param {String} tabIDP ID, zalozky, ktera se ma ulozit
   * @param {String} id stromu atributuu
   */
  save : function(aeWindowObj, aeAttrObj, tabIDP, attrTreeID)
  {
    this.tabID = tabIDP;
    
    this.annotation = aeWindowObj.annotation;
    this.typeURI = aeWindowObj.selectedTypeURI;
    this.typeName = aeWindowObj.selectedTypeName;
    
    this.documentAnnotation = aeWindowObj.documentAnnotation;
    
    var attrTree = document.getElementById(attrTreeID);
    this.attrTreeIndex = attrTree.currentIndex;
    
    this.editing = aeWindowObj.editing;
    this.editingAnnotID = aeWindowObj.editingAnnotID;
    this.editingAnnotTmpId = aeWindowObj.editingAnnotTmpId;
  },
  
  /**
   * Nahraje ulozene hodnoty do okna
   * @param {annotationWindow object} aeWindowObj okno, ktere se ma ma obnovit
   * @param {annotationWindow object} aeAttrObj objekt atributu
   * @param {String} id stromu atributu
   */
  load : function(aeWindowObj, aeAttrObj, attrTreeID)
  {
    try
    {
      aeWindowObj.annotation = this.annotation;
        aeWindowObj.restoreAnnotationRanges("");
      
      aeWindowObj.annotsAreHiddenForALink = false;
      aeWindowObj.annotsALinkType = null;
      
      aeWindowObj.editing = this.editing;
      aeWindowObj.editingAnnotID = this.editingAnnotID;
      aeWindowObj.editingAnnotTmpId = this.editingAnnotTmpId;

      aeWindowObj.annotateDocument(this.documentAnnotation);

      aeWindowObj.setContent(this.annotation.content);

      aeWindowObj.selectNewType(this.typeURI, this.typeName, false,  false, false);
    }
    catch(ex)
    {
      alert('annotationWindowTab.js : load:\n' + ex.message);
    }
  },
  
  /**
   * Smaze ulozena data pro zalozku
   */
  deleteSaved : function()
  {
    this.typeURI = "";
    this.typeName = "";
    
    this.documentAnnotation = false;
    
    this.editing = false;
    this.editingAnnotID = null;
    this.editingAnnotTmpId = null;
    
    this.annotation = null;
    this.nestedAnnotations = new annotationExtensionChrome.aeArray();
    this.changedTypes = new annotationExtensionChrome.aeArray();   
  },
  
  /**
   * Vrati objekt - pole vnorenych anotaci
   * @returns {aeArray} pole vnorenych anotaci
   */
  getNestedAnnotations : function()
  {
    return this.nestedAnnotations;
  },
  
  getNestedAnnotation : function(id)
  {
    var index = this.nestedAnnotations.getIndexByProp('uri', id);
    
    if(index == -1)
      return null;
    else
      return this.nestedAnnotations.arrayOfObjs[index];
  },
  
  /**
   * Vrati objekt - pole se zmenenymi typy
   * @returns {aeArray} pole zmenenych typu
   */
  getChangedTypes : function()
  {
    return this.changedTypes;
  },
  
  /**
   * @returns {String} URI atributu pro tuto zalozku v attrDatasource
   */
  getAttrsURI : function()
  {
    return this.attributeURI;
  },
  
  /**
   * @returns {Int} index naposledy vybraneho ulozeneho indexu ve strome atributu
   */
  getAttrsIndex : function()
  {
    return this.attrTreeIndex;
  },
  
  /**
   * @returns {String} rootName pro attrDatasource pro tuto zalozku
   */
  getAttrsRootName : function()
  {
    return this.attributeRootName;
  }
};