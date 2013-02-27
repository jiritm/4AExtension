/**
 * Soubor: typesStorageService.js
 * Autor: Jiri Trhlik
 * Datum: 26.2.2013
 * Popis: Slouzi jako prostrednik pro ukladani/hledani/mazani typu do/v/ze Storage (sqlite API pro firefox).
 * Posledni uprava:
 */

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

annotationExtension.typesStorageService =
{
  dbConn : null,
  consoleService : null,
  
  addTypesStatement : null,
  getTypesStatement : null,
  deleteTypesStatement : null,
  
  init : function()
  {
    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("resource://gre/modules/FileUtils.jsm");
    
    this.consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    
    let file = Components.classes["@mozilla.org/file/directory_service;1"].
           getService(Components.interfaces.nsIProperties).
           get("ProfD", Components.interfaces.nsIFile);
    
    //Adresar anotacniho doplnku
    file.append(annotationExtension.EXTENSION_DIRECTORY);
    if(!file.exists() || !file.isDirectory())
    {//Pokud adresar jeste neexistuje, vytvor ho
      file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 511); //nebo take prava 0777
    }
    file.append(annotationExtension.DATABASE);
 
    this.dbConn = Services.storage.openDatabase(file);
    this.dbConn.executeSimpleSQL("CREATE TEMP TABLE IF NOT EXISTS types (uri, name, ancestor)");
    
    this.addTypesStatement = this.dbConn.createStatement("INSERT OR REPLACE INTO types(uri, name, ancestor) VALUES(:uri_val, :name_val, :ancestor_val)");
    this.getTypesStatement = this.dbConn.createStatement("SELECT * FROM types WHERE name LIKE :filter ORDER BY name LIMIT :limit");
    this.deleteTypesStatement = this.dbConn.createStatement("DELETE FROM types WHERE uri=:uri_val");
  },
  
  destroy : function()
  {
    this.dbConn.asyncClose();
  },
  
  /**
   * SYNC
   * Vlozi novy typ do databaze
   * @param {Array of annotationExtensionChrome.type} type
   */
  addTypes : function(types)
  {
    /*//ASYNC
    let params = this.addTypesStatement.newBindingParamsArray();
    for (let i = 0; i < types.length; ++i)
    {
      let type = types[i];
      let bp = params.newBindingParams();
      bp.bindByName("uri_val", type.uri);
      bp.bindByName("name_val", type.name);
      bp.bindByName("ancestor_val", type.ancestor);
      params.addParams(bp);
    }
    this.addTypesStatement.bindParameters(params);
    this.addTypesStatement.executeAsync();
    */
    
    //SYNC
    for (let i = 0; i < types.length; ++i)
    {
      let type = types[i];
      this.addTypesStatement.params.uri_val = type.uri;
      this.addTypesStatement.params.name_val = type.name;
      this.addTypesStatement.params.ancestor_val = type.ancestor;
      this.addTypesStatement.execute();
    }
  },
  
  /**
   * Smaze typy s danym "uri"
   * @param {Array of string} uris
   */
  deleteTypes : function(uris)
  {
    //ASYNC
    /*let params = this.deleteTypesStatement.newBindingParamsArray();
    for (let i = 0; i < uris.length; ++i)
    {
      let bp = params.newBindingParams();
      bp.bindByName("uri_val", uris[i]);
      params.addParams(bp);
    }
    this.deleteTypesStatement.bindParameters(params);
    this.deleteTypesStatement.executeAsync();
    */
        
    //SYNC
    for (let i = 0; i < uris.length; ++i)
    {
      let uri = uris[i];
      this.deleteTypesStatement.params.uri_val = uri;
      this.deleteTypesStatement.execute();
    }
  },
  
  /**
   * ASYNC
   * Vyhleda vsechny typy, jejichz jmeno obsahuje retezec "filter"
   * @param {String} filter
   * @param {Int} limit, maximalni pocet vysledku, ktery ma vratit
   * @param {mozIStorageStatementCallback callback} callback
   * @returns {Array of annotationExtensionChrome.type}
   */
  getTypes : function(filter, limit, callback)
  {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    
    this.getTypesStatement.params.filter = filter;
    this.getTypesStatement.params.limit = limit;
    
    this.getTypesStatement.executeAsync({
    handleResult: function(aResultSet) {
      for (let row = aResultSet.getNextRow();
           row;
           row = aResultSet.getNextRow()) {
   
        let urivalue = row.getResultByName("uri");
        let namevalue = row.getResultByName("name");
        let ancestorvalue = row.getResultByName("ancestor");
        consoleService.logStringMessage(annotationExtension.ANNOTATION_EXTENSION + urivalue + ' ' + namevalue + ' ' + ancestorvalue);
      }
    },
   
    handleError: function(aError) {
      consoleService.logStringMessage(annotationExtension.ANNOTATION_EXTENSION + "Error: " + aError.message);
    },
   
    handleCompletion: function(aReason) {
      if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)
        consoleService.logStringMessage(annotationExtension.ANNOTATION_EXTENSION + "Query canceled or aborted!");
    }
    });
  },
};

(function() { this.init(); }).apply(annotationExtension.typesStorageService);