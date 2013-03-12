/**
 * Soubor: user.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro loginPrompt.xul
 *        Objekt uzivatele, definuje uzivatele(a jeho funkce), ktery pracuje
 *        s anotacnim doplnek.
 * Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.user =
{
  sessionID : "",  /**< Uklada session obdrzene od serveru. Pro kazde okno firefoxu.*/
  
  /**
   * Vola se v annotationExtensionChrome.browserOverlay.init() (browserOverlay.js)
   */
  init : function()
  {
    let observerService = Cc["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(this, "annotationextension-user-topic", false);
      
    this.setTextboxes(annotationExtension.user.username, annotationExtension.user.password);
    this.checkPassword();        
    
    //Pokud je nastavene automaticke prihlaseni, prihlas uzivatele
    //hodnoty uzivatele jsou nastaveny(modul user.jsm), zavolej rovnou annotationExtensionChromes.client.login()
    if(annotationExtension.user.autoLogin == true)
    {
      annotationExtensionChrome.client.login();
    }
    //Pokud uz je uzivatel prihlasen v jinem okne
    else if (annotationExtension.user.isLogged == true)
    {
      annotationExtensionChrome.client.login();
    }
  },
  
  /**
   * Vola se v annotationExtensionChrome.browserOverlay.destroy() (browserOverlay.js)
   */
  destroy : function()
  {
    let observerService = Cc["@mozilla.org/observer-service;1"].
      getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(this, "annotationextension-user-topic");
  },
  
  /**
   * Zjisti, zda je ulozene heslo pro uzivatele.
   * Pokud je ulozene, zaskrtne ve formulari: ulozit heslo
   */
  checkPassword : function()
  {
    if (annotationExtension.user.password != "")
    {
      document.getElementById("aeSavePasswordCheckbox").checked = true;
    }
    if (annotationExtension.user.autoLogin == true)
    {
      document.getElementById("aeAutoLoginCheckbox").checked = true;
    }
  },
  
  /**
   * Nastavi textboxy s uziv. jmenem a heslem na aktualni hodnoty
   * @param {string} uzivatelske jmeno, ktere se nastavi do textboxu
   * @param {string} uzivatelske heslo, ktere se nastavi do textboxu
   */
  setTextboxes : function(usernameP, passwordP)
  {
    var usernameTextbox = document.getElementById('aeUsername');
    var passwordTextbox = document.getElementById('aePassword');

    usernameTextbox.value = usernameP;
    passwordTextbox.value = passwordP;
  },
  
  /**
   * Zpracuje udalost zmacknuti enter v textboxu pro heslo uzivatele.
   * @param e udalost.
   */
  keypressedHandler : function(e)
  {
    //Pokud bylo zmacknuto enter
    if (e.keyCode == 13)
    {
      this.login();
    }
  },
  
  /**
   * Zpracuje udalost vyplneni uzivatelskeho jmena.
   */
  usernameTextboxInputHandler : function()
  {
    var username = this.getTUsername();
    var password = annotationExtension.users.getUserPassword(username);
    var passwordTextBox = document.getElementById('aePassword');
    
    //Pokud je ulozene heslo, zaskrtni policko ulozit heslo
    if (password != "")
    {
      document.getElementById("aeSavePasswordCheckbox").checked = true;
      this.savePasswordCheckboxHandler();
    }
    passwordTextBox.value = password;
  },
   
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//
  //Kombinace: 1. savePassword, 2. savePassword + autoLogin, 3. deleteUser
  /**
   * Zpracuje udalost zmacknuti checkboxu auto-loginu
   */
  autoLoginCheckboxHandler : function()
  {
    var autoLoginCheckbox = document.getElementById('aeAutoLoginCheckbox');
    var savePasswordCheckbox = document.getElementById('aeSavePasswordCheckbox');
    var deleteUserCheckbox = document.getElementById('aeDeleteUserCheckbox');
    
    if (autoLoginCheckbox.hasAttribute('checked') == true)
    {
      savePasswordCheckbox.checked = true;
      deleteUserCheckbox.checked = false;
    }
  },
  
  /**
   * Zpracuje udalost zmacknuti checkboxu ulozeni hesla
   */
  savePasswordCheckboxHandler : function()
  {
    var autoLoginCheckbox = document.getElementById('aeAutoLoginCheckbox');
    var savePasswordCheckbox = document.getElementById('aeSavePasswordCheckbox');
    var deleteUserCheckbox = document.getElementById('aeDeleteUserCheckbox');
    
    if (savePasswordCheckbox.hasAttribute('checked') == true)
    {
      deleteUserCheckbox.checked = false;
    }
    else
    {
      autoLoginCheckbox.checked = false;
    }
  },
  
  /**
   * Zpracuje udalost zmacknuti checkboxu smazani uzivatele po odhlaseni
   */
  deleteUserCheckboxHandler : function()
  {
    var autoLoginCheckbox = document.getElementById('aeAutoLoginCheckbox');
    var savePasswordCheckbox = document.getElementById('aeSavePasswordCheckbox');
    var deleteUserCheckbox = document.getElementById('aeDeleteUserCheckbox');
    
    if (deleteUserCheckbox.hasAttribute('checked') == true)
    {
      savePasswordCheckbox.checked = false;
      autoLoginCheckbox.checked = false;
    }
  },
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Test zda je vyplneno jmeno a heslo.
   */
  isTextboxInput : function()
  {
    if (this.getTUsername() == "" || this.getTPassword() == "")
    {
      return false;
    }

    return true;
  },
  
  /**
   * @return {string} Vrati hodnotu(uzivatelske jmeno) vyplnene v textboxu.
   */
  getTUsername : function()
  {
    //var usernameTextbox = document.getElementById('aeUsername');
    return document.getElementById('aeUsername').value;
  },
  
  /**
   * @return {string} Vrati hodnotu(uzivatelske heslo) vyplnene v textboxu.
   */
  getTPassword : function()
  {
    //var passwordTextbox = document.getElementById('aePassword');
    return document.getElementById('aePassword').value;
  },
  
  /**
   * Ulozi nastaveni uzivatele
   */
  saveUserPref : function(usernameP, passwordP, autoLoginP)
  {
    annotationExtension.user.setAutoLogin = autoLoginP;
    annotationExtension.user.setPassword = passwordP;
    annotationExtension.user.setUsername = usernameP;
  },
  
  /**
   * Prihlaseni uzivatele
   * Handler
   */
  login : function()
  {
    //Pokud neni vyplnene jmeno nebo heslo, nezkousej se prihlasit.
    //TODO:
    //zobraz hlasku o nutnosti vyplneni jmena a hesla
    if (this.isTextboxInput() == false)
      return;

    //Ulozeni hodnot z formulare.
    this.saveUserPref(this.getTUsername(), this.getTPassword(),
                 document.getElementById('aeAutoLoginCheckbox').hasAttribute('checked'));

    //Pri spustenych vice oknech je potreba zjistit, zda se prihlasovalo z tohoto okna - pro ulozeni uzivatele atd.
    //(zprava o prihlaseni je zaslana vsem oknum)
    this.loginClicked = true;
    
    //Prihlaseni na server ve vsech otevrenych oknech
    let observerService = Cc["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "annotationextension-user-topic", "loggedOn");
  },
  
  //TODO:
  //upravit user na login.logout
  /**
   * Odhlaseni uzivatele ze serveru
   * Handler
   */
  logout : function()
  {
    this.loginClicked = true;
    
    //Odhlaseni uzivatele od serveru ve vsech otevrenych oknech
    let observerService = Cc["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "annotationextension-user-topic", "loggedOff");
  },
  
  loginClicked : false,  /**< Zda bylo kliknuto na tlacitko prihlaseni a z tohoto okna se prihlasovalo. */
  
  /**
   * Obsluzna funkce pro prijeti zpravy, ze je uzivatel prihlasen.
   */
  loggedOn : function()
  { 
    //Inicializace okna po prihlaseni
    annotationExtensionChrome.bottomAnnotationWindow.init();
    
    //Pokud se prihlasovalo(kliklo se na tlacitko prihlasit/zmacknuto enter) z tohoto okna.
    if (this.loginClicked == true)
    {      
      //Smaz uzivateleske udaje, pokud jsou ulozeny
      if (document.getElementById('aeDeleteUserCheckbox').hasAttribute('checked'))
      {
        annotationExtension.users.deleteUser(annotationExtension.user.username, false);
        //Uloz jmeno a heslo do nastaveni jako naposledy prihlaseneho uzivatele.
        this.saveUserPref("", "", false);
      }
      else
      {
        //Uloz uzivatele, pokud je nastaveno uloz heslo.
        if (document.getElementById('aeSavePasswordCheckbox').hasAttribute("checked"))
        {
          annotationExtension.users.addUser(annotationExtension.user.username, annotationExtension.user.password);
        }
        else
        {
          annotationExtension.users.addUser(annotationExtension.user.username, "");
          annotationExtension.user.setPassword = "";
        }
      }
      
      this.loginClicked = false;
    }
    
    annotationExtension.user.setIsLogged = true;
    
    this.setTextboxes("","");
    
    var mainDeck = document.getElementById('aeMainDeck');
    mainDeck.setAttribute('selectedIndex', '1');
  },
  
  /**
   * Obsluzna funkce pro prijeti zpravy, ze je uzivatel odhlasen.
   */
  loggedOff : function()
  {    
    annotationExtension.user.setIsLogged = false;
    
    this.setTextboxes(annotationExtension.user.username, annotationExtension.user.password);
    this.checkPassword();
    //Zobrazeni prihlasovaciho formulare
    var mainDeck = document.getElementById('aeMainDeck');
    mainDeck.setAttribute('selectedIndex', '0');
    
    annotationExtensionChrome.bottomAnnotationWindow.destroy();
  },
  
  badLogTimerID : null,
  
  /**
   * Obsluzna funkce, pro spatne prihlasovaci udaje.
   */
  badLogin : function(optParam)
  {
    var incorLogin = document.getElementById("aeIncorLoginLabel");
    
    if (optParam == "clickedCall" && incorLogin.hidden == false)
    {
      clearTimeout(this.badLogTimerID);
      this.badLogTimerID = setTimeout(this.badLogin, 4000);
    }
    else
    {
      if (incorLogin.hidden == true)
      {
        incorLogin.hidden = false;
        this.badLogTimerID = setTimeout(this.badLogin, 4000);
      }
      //Aby se pri kliknuti na prihlaseni se a opetovnem vyplneni spatneho loginu nezrusila hlaska
      else
      {
        incorLogin.hidden = true;
      }
    }
  },
  
  /**
   * Zobrazi progres meter u prihlasovani.
   * Zablokuje tlacitko na prihlaseni.
   */
  showProgressMeter : function()
  {
    var loginButton = document.getElementById('aeLoginButton');    
    var progressBox = document.getElementById('aeProgressBox');
    
    progressBox.hidden = false;
    loginButton.disabled = true;
  },
  
  /**
   * Skryje progres meter u prihlasovani.
   * Odblokuje tlacitko na prihlaseni.
   */
  hideProgressMeter : function()
  {
    var loginButton = document.getElementById('aeLoginButton');    
    var progressBox = document.getElementById('aeProgressBox');
 
    progressBox.hidden = true;
    loginButton.disabled = false;
  },
  
  /**
   * Rozhrani pro observer
   */
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic == "annotationextension-user-topic")
    {
      //Zprava z jineho okna o prihlaseni
      if (aData == "loggedOn")
        annotationExtensionChrome.client.login();
      //Zprava z jineho okna o odhlaseni
      else if (aData == "loggedOff")
        annotationExtensionChrome.client.logout();
    }
  }
}