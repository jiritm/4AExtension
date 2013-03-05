/**
 * Soubor: typesStorageService.js
 * Autor: Jiri Trhlik
 * Datum: 26.2.2013
 * Popis: Slouzi jako prostrednik pro ukladani/hledani/mazani typu do/v/ze Storage (sqlite API pro firefox).
 *        Vzniklo pro autocomplete potreby.
 * Posledni uprava:
 */

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");

annotationExtension.typesStorageService =
{
  dbConn : null,
  consoleService : null,
  
  addTypesStatement : null,
  deleteTypesStatement : null,
  
  init : function()
  {
    if (this.dbConn == null)
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
      
      this.createTypesTable();
      
      this.addTypesStatement = this.dbConn.createStatement("INSERT OR REPLACE INTO types(uri, serialized, serialized_lower, name, ancestor, comment) VALUES(:uri_val, :serialized_val, :serialized_lower_val, :name_val, :ancestor_val, :comment_val)");
      this.deleteTypesStatement = this.dbConn.createStatement("DELETE FROM types WHERE uri=:uri_val");
    }
  },
  
  destroy : function()
  {
    if (this.dbConn != null)
    {
      this.deleteTypesTable();
      this.closeConnection();
      this.dbConn = null;
    }
  },
  
  deleteAllTypes : function()
  {
    this.dbConn.executeSimpleSQL("DELETE FROM types"); 
  },
  
  deleteTypesTable : function()
  {
    this.dbConn.executeSimpleSQL("DROP TABLE IF EXISTS types"); 
  },
  
  createTypesTable : function()
  {
    this.dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS types (uri UNIQUE, serialized, serialized_lower, name, ancestor, comment)");
  },
  
    
  createGetTypesStatetment : function()
  {
    return this.dbConn.createStatement("SELECT * FROM types WHERE serialized_lower LIKE :filter ORDER BY serialized_lower LIMIT :limit");
  },
  
  closeConnection : function()
  {
    this.dbConn.asyncClose();
  },
  
  /**
   * SYNC
   * Vlozi novy typ do databaze
   * @param {Array of annotationExtensionChrome.type} type
   * @param {mozIStorageStatementCallback callback} callback
   */
  addTypes : function(types, callback)
  {
    try
    {
      //ASYNC
      let params = this.addTypesStatement.newBindingParamsArray();
      for (let i = 0; i < types.length; ++i)
      {
        let type = types[i];
        let bp = params.newBindingParams();
        bp.bindByName("uri_val", type.uri);
        bp.bindByName("name_val", type.name.toLowerCase());
        let serialized = annotationExtension.functions.linearTypeURI(type.uri);
        bp.bindByName("serialized_val", serialized);
        bp.bindByName("serialized_lower_val", serialized.toLowerCase());
        bp.bindByName("ancestor_val", type.ancestor);
        bp.bindByName("comment_val", type.comment);
        params.addParams(bp);
      }
      this.addTypesStatement.bindParameters(params);
      this.addTypesStatement.executeAsync(callback);
    }
    catch(ex)
    {}
  },
  
  /**
   * Smaze typy s danym "uri"
   * @param {Array of string} uris
   * @param {mozIStorageStatementCallback callback} callback
   */
  deleteTypes : function(uris, callback)
  {
    try
    {
      //ASYNC
      let params = this.deleteTypesStatement.newBindingParamsArray();
      for (let i = 0; i < uris.length; ++i)
      {
        let bp = params.newBindingParams();
        bp.bindByName("uri_val", uris[i]);
        params.addParams(bp);
      }
      this.deleteTypesStatement.bindParameters(params);
      this.deleteTypesStatement.executeAsync(callback);
    }catch(ex)
    {}
  },
  
  /**
   * ASYNC
   * Vyhleda vsechny typy, jejichz jmeno obsahuje retezec "filter"
   * @param {String} filter, "%" - libovolny pocet libovolnych znaku, "_" - libovolny znak 
   * @param {Int} limit, maximalni pocet vysledku, ktery ma vratit
   * @param {mozIStorageStatementCallback callback} callback
   * @returns {Array of annotationExtensionChrome.type}
   */
  getTypes : function(filter, limit, callback)
  {
    var getTypesStatement = this.createGetTypesStatetment();
    getTypesStatement.params.filter = filter.toLowerCase();
    getTypesStatement.params.limit = limit;

    getTypesStatement.executeAsync(callback);
  },
  
  /**
   * Vytvori mozIStorageStatementCallback, po vytvoreni staci priradit
   * funkci "handleResult";
   * @returns {mozIStorageStatementCallback}
   */
  createHandler : function()
  {
    var thisObj = this;
    return {
      handleResult: null,
   
      handleError: function(aError) {
        thisObj.consoleService.logStringMessage("AnnotationExtension: Error: " + aError.message);
      },
     
      handleCompletion: function(aReason) {
        if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)
          thisObj.consoleService.logStringMessage("AnnotationExtension: Query canceled or aborted!");
      }
    }
  }
};