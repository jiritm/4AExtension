/**
 * Soubor: user.jsm
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Reprezentuje uzivatele - informace pro vymenu mezi vice okny Firefoxu.
 * Posledni uprava: 5.6.2012
 */

var EXPORTED_SYMBOLS = [""];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/users.jsm");

annotationExtension.user =
{
  _username : "",       /**< Uzivatelske jmeno (nacte se z preferences). */
  _password : "",       /**< Heslo uzivatele (nacte se z login managera). */
  _isLogged : false,    /**< Zda je uzivatel prihlasen. */
  _autoLogin : false,   /**< Nastaveny autologin (nacte se z preferences). */
  _userID : "",         /**< ID uzivatele. */
  userNameAndSurname : "",  /**< 'realne' jmeno uzivatele od serveru. */
  
  
  get username() { return this._username.value; },
  get password() { return this._password; },
  get autoLogin() { return this._autoLogin.value; },
  get isLogged() { return this._isLogged; },
  get userID() { return this._userID; },
  
  set setUsername(u) { this._username.value = u; },
  set setPassword(p) { this._password = p; },
  set setAutoLogin(a) { this._autoLogin.value = a; },
  set setIsLogged(i) { this._isLogged = i; },
  set userID(id) { this._userID = id; },
  
  /**
   * Konstruktor
   */
  init : function()
  {      
    //Nacte naposledy prihlaseneho uzivatele -
    //-do this.username, this.password, this.autoLogin;
    this.loadUserPref();
  },
  
  /**
   * Nacte nastaveni uzivatele
   */
  loadUserPref : function()
  {
    let application =
      Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
   
    this._username =
      application.prefs.get("extensions.annotationextension.user.username");
    this._autoLogin = 
      application.prefs.get("extensions.annotationextension.user.autoLogin");
      
    //Pokud je ulozeny uzivatel, zkus ziskat jeho heslo z password managera firefoxu
    if (this.username != "")
    {
      this.setPassword = annotationExtension.users.getUserPassword(this.username);
    }
    else
    {
      this.setPassword = "";
    }
  }
};

//Konstruktor
(function() { this.init(); }).apply(annotationExtension.user);