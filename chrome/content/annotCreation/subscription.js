/**
 * Soubor: subscription.js
 * Autor: Jiri Trhlik
 * Datum: 24.2.2013
 * Popis: Reprezentuje odber anotaci.
 * Posledni uprava: 
 */

/**
 * Konstruktor
 * @param {String} list, + jako whitelist, - jako blacklist
 * @param {String} subsURI, uri odberu
 * @param {String} user, uzivatel odberu
 * @param {String} type, typ odberu
 */
annotationExtensionChrome.subscription = function(list, subsURI, user, type, saved, serializedSubsURI, serializedUser, serializedType)
{
  //Inicializace
  this.list = list || "+";
  this.subsURI = subsURI || "";
  this.user = user || "";
  this.type = type || "";
  this.saved = saved || false;
  this.serializedSubsURI = serializedSubsURI || "",
  this.serializedUser = serializedUser || "",
  this.serializedType = serializedType || "",
  
  this.makeURI();
};

annotationExtensionChrome.subscription.prototype =
{
  list : "",
  subsURI : "",
  user : "",
  type : "",
  uri : "",
  serializedSubsURI : "",
  serializedUser : "",
  serializedType : "",
  saved : false,
  
  makeURI : function()
  {
    this.uri = 'annotationExtension://'+this.list+';'+this.user+';'+this.type+';'+this.subsURI;
  },
  
  compare : function(subsURIP, typeP, userP)
  {
    if (this.subsURI != subsURIP ||
        this.type != typeP ||
        this.user != userP)
      return false;
    
    return true;
  },
  
  getSourceString : function()
  {
    var source = "<source";
    if (this.subsURI != null && this.subsURI != undefined && this.subsURI != "")
      source += ' uri="'+this.subsURI+'"';
		if (this.type != null && this.type != undefined && this.type != "")
      source += ' type="'+this.type+'"';
		if (this.user != null && this.user != undefined && this.user != "")
			source += ' user="'+this.user+'"';
      
    source += "/>";    
    return source;
  }
};