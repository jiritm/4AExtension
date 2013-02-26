/**
 * Soubor: autocomplete.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Komponenta pro autocomplete textboxu (vyber typu anotace a atributu).
 * Posledni uprava: 5.6.2012
 */

const C = Components;
const Ci = C.interfaces;

const CLASS_ID = Components.ID("f6e0cbb4-bb21-426c-a73a-eefdf807ab32");
const CLASS_NAME = "Annotation Type AutoComplete";
const CONTRACT_ID = "@mozilla.org/autocomplete/search;1?name=aeautocomplete";

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/**
 * Implementuje interface nsIAutoCompleteSearch
 * Konstruktor
 */
function aeSearch()
{
  Components.utils.import("resource://annotationextension/namespace.jsm");
  Components.utils.import("resource://annotationextension/constants.jsm");
};

aeSearch.prototype =
{
	
  classID: Components.ID("{f6e0cbb4-bb21-426c-a73a-eefdf807ab32}"),
  
	/**
   * Zacne hledat danny retezec a upozorni "listenera" (bud synchronously
   * nebo asynchronously) na vysledek
   * @param searchString - Retezec, ktery se hleda
   * @param searchParam - Extra parametr (preda ho textbox), predava pomoci nej adresu serveru a session ID
   * @param previousResult - Predchozi vysledek - pro rychlejsi vyhledani
   * @param listener - Listener, ktery se upozorni, pri skonceni hledani
   */	
  startSearch: function(searchString, searchParam, previousResult, listener)
  {
    var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
      .getService(Components.interfaces.nsIWindowMediator);
    //Oznacene okno - ziskani kodu okna
    let topWindow = windowMediator.getMostRecentWindow(null);
		
    var results = [];   
    var comments = [];
     
    //Ve funkci onSearchResult nelze prime dosazeni this
    var thisObject = this;
    
    var httpRequest = C.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
    httpRequest.onload = function()
    {
      var len = topWindow.annotationExtensionChrome.bottomAnnotationWindow.autocompleteParams.length;
      topWindow.annotationExtensionChrome.bottomAnnotationWindow.autocompleteParams.splice(0, len);
			
      //TODO:
      //SPRAVNE NAPARSOVAT A ZISKAT TYPY
      var suggestion = httpRequest.responseXML.getElementsByTagName('type');
      
      //var min = Math.min(10, suggestion.length);
      var min = suggestion.length;
      
      for (var i = 0; i < min; i++)
      {
				var uri = suggestion[i].getAttribute('uri');
				var linear = topWindow.annotationExtension.functions.linearTypeURI(uri);
				
				if (annotationExtension.attrConstants.isSimple(linear))
				{//Structured typ je taky jednoduchy - uz je do autocomplete pridan z jednoduchych typu
					//TODO:
					//Zmen ale ikonku jednoducheho typu na structured
				}
				//else
				{
					results.push(linear);
					var typeComment = suggestion[i].getElementsByTagName('comment');
					if(typeComment.length > 0)
					{
						var commentOK = false;
						if(typeComment[0].hasChildNodes)
						{
							var childComment = typeComment[0].firstChild;
							
							while (childComment != null)
							{
								if (childComment.nodeType === 4) //CDATA
								{
									comments.push(childComment.nodeValue);
									commentOK = true;
									break;
								}
								childComment = childComment.nextSibling;
							}
						}
						if (commentOK == false)
							comments.push("");
					}
					else
					{
					  comments.push("");
				  }
				}
				
				topWindow.annotationExtensionChrome.autocompleteURIs.addNew({linear : linear, uri : uri});
      }      
    
      //Upozorneni "listenera" na vysledek ze serveru
      var newResult = new aeSearchResult(searchString, 4, 0, "", results, comments);
      listener.onSearchResult(thisObject, newResult);
    };
		
    //TODO:
    //spravne filtrovani!!
    var body = '<?xml version="1.0" encoding="utf-8" ?><messages>';
    body += '<session id="'+topWindow.annotationExtensionChrome.client.sessionID+'"/>'
    body += '<queryTypes filter="' + '*' + searchString + '*' + '"/>';
    body += '</messages>';

    httpRequest.open('POST', topWindow.annotationExtensionChrome.client.address , true);
    httpRequest.setRequestHeader('Content-Type', 'application/xml');
    httpRequest.send(body);
		
    //////////////////////////////////////////////////////////////////////
    //////////////    AUTOCOMPLETE PRO ATRIBUTY            ////////////////
    /////////////////////////////////////////////////////////////////////
    if (searchParam == "attrType")
    {
      var lowerCaseSearchString = searchString.toLowerCase();
    
      var simpleTypes = [ 'String', 'URI', 'DateTime', 'Integer', 'Decimal', 'Date', 'Time', 'Boolean', 'Person', 'GeoPoint'];
      for (var i = 0; i < simpleTypes.length; i++)
      {
    	var lowerCaseSimpleType = simpleTypes[i].toLowerCase();
    			
    	if(lowerCaseSimpleType.search(lowerCaseSearchString) != -1)
    	{//Pokud se hledany vyraz nachazi v jednom ze simpleType, zobraz dany simple type v autocomplete
    	  results.push(simpleTypes[i]);
    	  comments.push("Simple");
    	}
      }
    }
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
  },
  
  /**
   * Zastavi asynchronni hledani.
   */
  stopSearch : function() { },

  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Ci.nsIAutoCompleteSearch) && !aIID.equals(Ci.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

/**
 * Implementuje nsIFactory interface
 */
var aeSearchFactory =
{
  singleton: null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (this.singleton == null)
      this.singleton = new aeSearch();
    return this.singleton.QueryInterface(aIID);
  }
}

/**
 * Implementuje nsIModule interface
 */
var aeSearchModule =
{
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return aeSearchFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
}

/**
 * Inicializace modulu - tahle funkce se hleda a vola jako prvni.
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([aeSearch]);
else
  function NSGetModule(aCompMgr, aFileSpec) { return aeSearchModule; }
  
/**
 * Implementuje interface nsIAutoCompleteResult
 * Funkci vola nsIAutoCompleteSearch == aeSearch
 */
function aeSearchResult(searchString, searchResult, defaultIndex,
                                    errorDescription, results, comments)
{
  this._searchString = searchString;
  this._searchResult = searchResult;
  this._defaultIndex = defaultIndex;
  this._errorDescription = errorDescription;
  this._results = results;
  this._comments = comments;
	
  Components.utils.import("resource://annotationextension/namespace.jsm");
  Components.utils.import("resource://annotationextension/constants.jsm");
}

aeSearchResult.prototype = {  
  _searchString: "",
  _searchResult: 0,
  _defaultIndex: 0,
  _errorDescription: "",
  _results: [],
  _comments: [],
  
  /**
   * Jak dopadlo vyhledani:
   *   RESULT_IGNORED (invalidni searchString)
   *   RESULT_FAILURE (failure)
   *   RESULT_NOMATCH (nenalezen zadny shodny retezec)
   *   RESULT_SUCCESS (nalezeny nejake shodne retezce)
   */
  get searchResult() { return this._searchResult; },
  
  /**
   * Firefox 4
   */
  getLabelAt: function(index) { return this._results[index]; },
  
  /**
   * Pocet shodnych retezcu.
   */
  get matchCount() { return this._results.length; },
  
  /**
   * Ziska hodnotu shodneho retezce na dane pozici.
   */
  getValueAt : function(index) { return this._results[index]; },
  
  /**
   * Ziska hodnotu komentare shodneho retezce na dane pozici.
   */
  getCommentAt : function(index) { return this._comments[index]; },
  
  /**
   * Ziska "style hint" shodneho retezce na dane pozici.
   */
  getStyleAt: function(index)
  {
    return null;
    //if (!this._comments[index])
    //  return null;  //neni category label, bez specialniho stylingu
    //
    //if (index == 0)
    //  return "suggestfirst";  //category label na prvni radek vysledku
    //
    //return "suggesthint";     //category label na ostatni radky vysledku
  },

  /**
   * Ziska obrazek shodneho retezce na pozici index.
   * Vracena hodnota by mela byt URI obrazku, jenz se ma zobrazit.
   */
  getImageAt : function(index)
  {
    if (this._comments[index] == "Simple")
      return "chrome://annotationextension/skin/oxygen/simpleType16.png";
    else if (this._comments[index] != "")
      return "chrome://annotationextension/skin/oxygen/comment16.png";
		else
			return null;
  },
  
  /**
   * Retezec, ktery se vyhledaval
   */
  get searchString() { return this._searchString; },
   
  /**
   * Index defaultniho vyberu, ktery bude vlozen, pokud zadny nebyl vybran.
   */
  get defaultIndex() { return this._defaultIndex; },
  
  /**
   * Popisuje chybu, pokud doslo k selhani vyhledavani
   */
  get errorDescription() { return this._errorDescription; },
  
  /**
   * Odstrani hodnostu na dannem indexu z autocomplete vysledku.
   * Pokud je removeFromDb true, hodnota bude take odstranena z
   * perzistentniho uloziste.
   */
  removeValueAt: function(index, removeFromDb) {
    this._results.splice(index, 1);
    this._comments.splice(index, 1);
  },
  
  QueryInterface: function(aIID)
  {
    if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
}