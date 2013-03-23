/**
 * Soubor: users.jsm
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Objekt pro praci s uzivateli z password managera Firefoxu.
 * Posledni uprava: 5.6.2012
 */

var EXPORTED_SYMBOLS = [""];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://annotationextension/namespace.jsm");

annotationExtension.users =
{
  passwordManager : null,
  hostname : 'chrome://annotationextension',
  httprealm : "User Registration",
  
  /**
   * Konstruktor
   */
  init : function()
  {
    this.passwordManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
  },
  
  /**
   * Najde konkretniho uzivatele z promenne uzivatelu a vrati jeho heslo.
   * @param {string} usernameP Uzivatel, ktery se vyhledava.
   * @returns {string} pokud nebyl nalezen zadny uzivatel vrati prazdny retezec, jinak
   *                   vrati heslo uzivatele (prazdny retezec, pokud neni ulozeno).
   */
  getUserPassword : function(username)
  {
    var password;
    
    try
    {
      //Najde vsechny uzivatele pro dane parametry
      var logins = this.passwordManager.findLogins({}, this.hostname, null, this.httprealm);

      //Najdi uzivatele, ktery je pozadovan
      for (var i = 0; i < logins.length; i++)
      {
         if (logins[i].username == username)
         {
            password = logins[i].password;
            break;
         }
      }
    }
    catch(ex)
    {
      //Pouze pokud neni nsILoginManager trida
    }
    
    if (password == undefined)
      password = "";
      
    return password;
  },
  
  /**
   * Prida do promenne s uzivateli uzivatele.
   * @param {string} username Jmeno uzivatele pro pridani.
   * @param {string} password Heslo uzivatele.
   */
  addUser : function(username, password)
  {
    var formHistory = Components.classes["@mozilla.org/satchel/form-history;1"]
        .getService(Components.interfaces.nsIFormHistory2 || Components.interfaces.nsIFormHistory);
    //Prida uzivatelske jmeno do historie textboxu - zobrazi se pri dalsim vyplnovani jmena
    if (!formHistory.entryExists("annotationextensionusername-form-history", username))
    {
      formHistory.addEntry("annotationextensionusername-form-history", username);
    }
    
    var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                  Ci.nsILoginInfo,"init");
    //Pokud uzivatel existuje zmen mu heslo.
    var loginInfo = new nsLoginInfo(this.hostname, null,
                                    this.httprealm, username, password,"", "");
    
    try
    {
      this.passwordManager.addLogin(loginInfo);
    }
    catch(ex)
    {
      //Zkus zda login jiz existuje.
      try
      {
        if (password != "")
        //Pokud se existujicimu uzivateli nastavuje prazdne heslo, nema smysl
        //ho udrzovat a smaze se(vetev else)
        {
          var oldPassword = this.getUserPassword(username);
          var oldLogin = new nsLoginInfo(this.hostname, null,
                                         this.httprealm, username, oldPassword, "", "");
          
          this.passwordManager.modifyLogin(oldLogin, loginInfo);
        }
        else
          this.deleteUser(username, true);
      }
      catch(e)
      {
        //Prazdne heslo nebo se pokousel upravit neexistujici login
      }
    }
    
  },
  
  /**
   * Smaze z promenne s uzivateli uzivatele.
   * @param {string} username Jmeno uzivatele pro smazani.
   * @param {bool} additional Volitelny parametr, pokud je true, uzivatel se smaze pouze z password managera
   */
  deleteUser : function(username, additional)
  {
    if (additional != true)
    {
      var formHistory = Components.classes["@mozilla.org/satchel/form-history;1"]
            .getService(Components.interfaces.nsIFormHistory2 || Components.interfaces.nsIFormHistory);
      //Smazani z ulozene hodnoty v textboxu
      if (formHistory.entryExists("annotationextensionusername-form-history", username))
      {
        formHistory.removeEntry("annotationextensionusername-form-history", username); 
      }
    }  
    
    var password = this.getUserPassword(username);

    var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                  Ci.nsILoginInfo,"init");
    
    var loginInfo = new nsLoginInfo(this.hostname, null,
                                    this.httprealm, username, password, "", "");
    
    try
    {
      var logins = this.passwordManager.findLogins({}, this.hostname, null, this.httprealm);
      if (logins.length > 0)
      {
        this.passwordManager.removeLogin(loginInfo);
      }
    }
    catch(ex)
    {
      //Pouze pokud passwordManager neni nsILoginManager trida
    }
  }
};

//Konstruktor
(function() { this.init(); }).apply(annotationExtension.users);