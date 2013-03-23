/**
 * Soubor: config.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro praci s config.xul
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/user.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

annotationExtensionChrome.config =
{
////////////////////////////////////////////////////////////////////////////////
//SKUPINY

  /**
   * Inicializace
   * vola se pri onpaneload panelu id=aeGroupOption 
   */
  initGroups : function()
  {
    var groupDeck = document.getElementById('aeGroupDeck');
    
    if (annotationExtension.user.isLogged == false)
    {//Pokud uzivatel neni prihlasen, nezobrazuj nastaveni
      groupDeck.selectedIndex = 1;
    }
    else
    {//Uzivatel je prihlasen
      groupDeck.selectedIndex = 0;
      
      let observerService = Components.classes["@mozilla.org/observer-service;1"].
          getService(Components.interfaces.nsIObserverService);
      observerService.addObserver(this, "annotationextension-settingsChange-topic", false);
      
      //Vytvoreni a pripojeni datasource ke stromu
      var aeGroupTree = document.getElementById('aeGroupTree');
      annotationExtensionChrome.groupsTreeDatasource = new annotationExtensionChrome.TreeDatasource(aeGroupTree, 'groups', opener.annotationExtensionChrome.groupsDatasource, null);
      
      var defGroupTextbox = document.getElementById('aeDefaultUserGroupTextbox');
      defGroupTextbox.value = opener.annotationExtensionChrome.settings.DefaultUserGroup;
    }
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
    let observerService = Components.classes["@mozilla.org/observer-service;1"].
      getService(Components.interfaces.nsIObserverService);
    
    observerService.removeObserver(this, "annotationextension-settingsChange-topic");
  },
  
  /**
   * Rozhrani pro observer
   */
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic == "annotationextension-settingsChange-topic")
    {
      var defGroupTextbox = document.getElementById('aeDefaultUserGroupTextbox');
      defGroupTextbox.value = opener.annotationExtensionChrome.settings.DefaultUserGroup;
    }
  },
  
  joinGroup : function()
  {
    var view = document.getElementById('aeGroupTree').view;
    var selectedIndex = view.selection.currentIndex;
    
    if (selectedIndex > -1)
    {
      var groupURI = annotationExtensionChrome.groupsTreeDatasource.getResourceURIOnIndex(selectedIndex);
      
      if (groupURI != null)
      {
        opener.annotationExtensionChrome.client.joinGroup(groupURI);
      }
    }
  },
  
  leaveGroup : function()
  {
    var view = document.getElementById('aeGroupTree').view;
    var selectedIndex = view.selection.currentIndex;
    
    if (selectedIndex > -1)
    {
      var groupURI = annotationExtensionChrome.groupsTreeDatasource.getResourceURIOnIndex(selectedIndex);
      var logged = annotationExtensionChrome.groupsTreeDatasource.getResourcePropOnIndex(selectedIndex, 'logged');
      
      if (logged == true || logged == 'true')
      {
        opener.annotationExtensionChrome.client.leaveGroup(groupURI);
      }
    }
  },
  
  /** ondblclick do stromu skupin **/
  joinOrLeaveGroup : function()
  {
    var view = document.getElementById('aeGroupTree').view;
    var selectedIndex = view.selection.currentIndex;
    
    if (selectedIndex > -1)
    {   
      var logged = annotationExtensionChrome.groupsTreeDatasource.getResourcePropOnIndex(selectedIndex, 'logged');
      var groupURI = annotationExtensionChrome.groupsTreeDatasource.getResourceURIOnIndex(selectedIndex);
      
      if (logged == true || logged == 'true')
        opener.annotationExtensionChrome.client.leaveGroup(groupURI);
      else
        opener.annotationExtensionChrome.client.joinGroup(groupURI);
    }
  },
  
  selectDefaultGroup : function()
  {
      var params = {out:null};
      opener.openDialog("chrome://annotationextension/content/windows/groupsWindow.xul", "annotationextension:groupsWindow", "resizable,chrome,centerscreen,modal,height=400,width=600", params);
      if (params.out)
      {
        var defGroupTextbox = document.getElementById("aeDefaultUserGroupTextbox");
        defGroupTextbox.value = params.out.groupName;
        
        this.knownSettingsChange(defGroupTextbox, 'DefaultUserGroup');
      }
      
      window.focus();
  },
  
////////////////////////////////////////////////////////////////////////////////
//NASTAVENI SERVERU
  /**
   * Inicializace
   * vola se pri onpaneload panelu id=serverOption 
   */
  initServerSettings : function()
  {
    if (annotationExtension.user.isLogged == true)
    {//Pokud je uzivatel prihlasen, zablokuj nastaveni serveru
      var ipTextbox = document.getElementById('extensions.annotationextension.serverAddress-textbox');
      var portTextbox = document.getElementById('extensions.annotationextension.serverPort-textbox');
      
      ipTextbox.disabled = true;
      ipTextbox.setAttribute('enablehistory', 'false');
      portTextbox.disabled = true;
    }
  },

////////////////////////////////////////////////////////////////////////////////
//NASTAVENI RUZNE
  /**
   * Inicializace
   * vola se pri onpaneload panelu id=aeOtherOption 
   */
  initOtherOption : function()
  {
    var settingsDeck = document.getElementById('aeSettingsDeck');
    
    if (annotationExtension.user.isLogged == false)
    {//Pokud uzivatel neni prihlasen, nezobrazuj nastaveni
      settingsDeck.selectedIndex = 1;
    }
    else
    {//Uzivatel je prihlasen
      settingsDeck.selectedIndex = 0;
      var aeOtherOptionTree = document.getElementById('aeOtherOptionTree');
      annotationExtensionChrome.otherOptionTreeDatasource = new annotationExtensionChrome.TreeDatasource(aeOtherOptionTree, 'settings', opener.annotationExtensionChrome.otherSettingsDatasource, null);
    }
  },
  
  /**
   * Handler pro vybrani radku ve stromu
   * strom id=aeOtherOptionTree
   */
  aeOtherOptionTreeSelected : function(ev)
  {
    var optTreeView = document.getElementById('aeOtherOptionTree').view;
    var selection = optTreeView.selection.currentIndex;
    
    if (selection > -1)
    {
      var settURI = annotationExtensionChrome.otherOptionTreeDatasource.getResourceURIOnIndex(selection);
      
      //Prave tlacitko
      ////////////////////////////////
      if (ev.button == 2)
      {
        let stringBundle = document.getElementById("annotationextension-string-bundle");
        
        if (window.confirm(stringBundle.getString("annotationextension.settings.deleteSetting")))
        {//Smazani nastaveni
          annotationExtensionChrome.otherOptionTreeDatasource.deleteObject(settURI, annotationExtensionChrome.otherOptionTreeDatasource.baseURI + annotationExtensionChrome.otherOptionTreeDatasource.rootName);
          opener.annotationExtensionChrome.client.sendSettings();
        }
        
        return;
      }
      
      //Ostatni tlacitka
      ////////////////////////////////
      var settName = annotationExtensionChrome.otherOptionTreeDatasource.getResourcePropOnIndex(selection, 'name');
      var settValue = annotationExtensionChrome.otherOptionTreeDatasource.getResourcePropOnIndex(selection, 'value');
        
      //Podle inn:tabNumber se otevre prislusny formular v dialogovem okne pro editaci
      var params = {out:null, settValue:settValue};
      window.openDialog("chrome://annotationextension/content/dialogs/editSettingDialog.xul", "annotationextension:changeSettWindow", "chrome,centerscreen,modal", params).focus();  
      
      if (params.out)
      {//Pridano nove nastaveni
        if (params.out.newValue != "" && params.out.newValue != null && params.out.newValue != settValue)
        {//Nastavi novou hodnotu a odesle nove nastaveni na server 
          annotationExtensionChrome.otherOptionTreeDatasource.changeResourceProp(settURI, 'value', params.out.newValue);
          opener.annotationExtensionChrome.client.sendSettings();
        }
      }
      else
      {//Kliknuto na cancel
      }
      
      optTreeView.selection.select(-1);
    }
  },
  
  /**
   * Handler pridat nove nastaveni uzivatele
   */
  addNewConfig : function()
  {
    var params = {inn:null, out:null}; 
    window.openDialog("chrome://annotationextension/content/dialogs/addSettingsDialog.xul", "annotationextension:addSettWindow", "chrome,centerscreen,modal", params).focus();  
  
    if (params.out)
    {//Pridano nove nastaveni
      if (params.out.name != "" && params.out.newValue != "")
      {//Odesle nove nastaveni na server
        if (opener.annotationExtensionChrome.settings.settingIsKnown(params.out.name))
        {//Nastaveni je "zname a zpracovano v jinem formulari"
          //TODO: muze vyhodit hlasku, ze toto nastaveni nelze pridat
          return;
        }
        
        var newSetting = {
                          uri : 'annotationExtension://' + params.out.name,
                          name : params.out.name,
                          value : params.out.newValue}
        annotationExtensionChrome.otherOptionTreeDatasource.addNewObject(newSetting);
        opener.annotationExtensionChrome.client.sendSettings();
      }
    }
    else
    {//Kliknuto na cancel
    }
  },

////////////////////////////////////////////////////////////////////////////////
//NASTAVENI BARVY  
  /**
   * Inicializace
   * vola se pri onpaneload panelu id=aeOtherOption 
   */
  initColorsOption : function()
  {
    var settingsDeck = document.getElementById('aeColorsDeck');
    
    if (annotationExtension.user.isLogged == false)
    {//Pokud uzivatel neni prihlasen, nezobrazuj nastaveni
      settingsDeck.selectedIndex = 1;
    }
    else
    {//Uzivatel je prihlasen
      settingsDeck.selectedIndex = 0;
      var aeColorsOptionListbox = document.getElementById('aeColorsOptionListbox');
      annotationExtensionChrome.colorsOptionListboxDatasource = new annotationExtensionChrome.ListboxDatasource(aeColorsOptionListbox, 'colors', opener.annotationExtensionChrome.colorsDatasource, null); 
    }
  },
  
  /**
   * Handler pro vybrani radku v listboxu
   * strom id=aeColorsOptionListbox
   */
  aeColorsListboxSelected : function(ev)
  {
    var listbox = document.getElementById('aeColorsOptionListbox');
    var selection = listbox.currentIndex;
    
    if (selection > -1)
    {
      var settURI = annotationExtensionChrome.colorsOptionListboxDatasource.getResourceURIOnIndex(selection);
      
      //Prave tlacitko
      ////////////////////////////////
      if (ev.button == 2)
      {
        let stringBundle = document.getElementById("annotationextension-string-bundle");
        
        if (window.confirm(stringBundle.getString("annotationextension.settings.deleteColorSetting")))
        {//Smazani nastaveni
          annotationExtensionChrome.colorsOptionListboxDatasource.deleteObject(settURI, annotationExtensionChrome.colorsOptionListboxDatasource.baseURI + annotationExtensionChrome.colorsOptionListboxDatasource.rootName);
          opener.annotationExtensionChrome.client.sendSettings();
        }
        
        return;
      }

      //Ostatni tlacitka
      ////////////////////////////////
      var oldBackgroundColor = annotationExtensionChrome.colorsOptionListboxDatasource.getResourceProp(settURI, 'backgroundColor');
      var oldFontColor = annotationExtensionChrome.colorsOptionListboxDatasource.getResourceProp(settURI, 'fontColor');
        
      var params = {out:null, settValue:{oldBackgroundColor : oldBackgroundColor, oldFontColor : oldFontColor}};
      window.openDialog("chrome://annotationextension/content/dialogs/editColorDialog.xul", "annotationextension:changeColorWindow", "chrome,centerscreen,modal", params).focus();  
      
      if (params.out)
      {
        if (params.out.backgroundColor != null && params.out.fontColor != null
              && (params.out.backgroundColor != oldBackgroundColor || params.out.fontColor != oldFontColor))
        {//Nastavi novou hodnotu a odesle nove nastaveni na server 
            annotationExtensionChrome.colorsOptionListboxDatasource.changeResourceProp(settURI, 'backgroundColor', params.out.backgroundColor);
            annotationExtensionChrome.colorsOptionListboxDatasource.changeResourceProp(settURI, 'fontColor', params.out.fontColor);
            opener.annotationExtensionChrome.client.sendSettings();      
        }
      }
      else
      {//Kliknuto na cancel
      }
      
      listbox.selectedIndex = -1;
    }
  },
  
  /**
   * Handler pridat novou barvu anotace
   */
  addNewColor : function()
  {
    var params = {inn: {mainWindow : opener},
                  out:null}; 
    window.openDialog("chrome://annotationextension/content/dialogs/addColorDialog.xul", "annotationextension:addColorWindow", "chrome,centerscreen,modal", params).focus();  
  
    if (params.out)
    {//Pridano nove nastaveni
      if (params.out.backgroundColor != null && params.out.fontColor != null
          && (params.out.backgroundColor != "" || params.out.fontColor != ""))
      {//Odesle nove nastaveni na server        
        var newColor = { uri : 'annotationExtension://' + params.out.name,
                         name : params.out.name,
												 backgroundColor : params.out.backgroundColor,
												 fontColor : params.out.fontColor}
        annotationExtensionChrome.colorsOptionListboxDatasource.addNewObject(newColor);
        opener.annotationExtensionChrome.client.sendSettings();
      }
    }
    else
    {//Kliknuto na cancel
    }
  },
  
////////////////////////////////////////////////////////////////////////////////
//NASTAVENI ODBERU ANOTACI  
  /**
   * Inicializace
   * vola se pri onpaneload panelu id=aeOtherOption 
   */
  initSubscriptions : function()
  {
    var subscriptionsDeck = document.getElementById('aeSubscriptionsDeck');
    
    if (annotationExtension.user.isLogged == false)
    {//Pokud uzivatel neni prihlasen, nezobrazuj nastaveni
      subscriptionsDeck.selectedIndex = 1;
    }
    else
    {//Uzivatel je prihlasen
      subscriptionsDeck.selectedIndex = 0;
      var aeSubscriptionsTree = document.getElementById('aeSubscriptionsTree');
      annotationExtensionChrome.subscriptionsTreeDatasource = new annotationExtensionChrome.TreeDatasource(aeSubscriptionsTree, 'subscriptions', opener.annotationExtensionChrome.subscriptionsDatasource, null);
    
      var saveButton = document.getElementById("aeSaveSubscriptions");
      saveButton.className = "subscriptionsSaved";
    }
  },
  
  addNewSubscription : function()
  {
    var params = {inn: {mainWindow : opener},
                  out:null}; 
    window.openDialog("chrome://annotationextension/content/dialogs/addSubscriptionDialog.xul", "annotationextension:addSubscriptionWindow", "chrome,centerscreen,modal", params).focus();  

    if (params.out)
    {//Pridan novy odber
     
      if (params.out.user != "" || params.out.uri != "" || params.out.type != "")
      {
        //value="list;user;type;uri"
        var newSubscription = new annotationExtensionChrome.subscription(
                          params.out.list,
                          params.out.uri,
                          params.out.user,
                          params.out.type,
                          false,
                          null, null, null);
        
        if (newSubscription.user != "")
          newSubscription.serializedUser = opener.annotationExtensionChrome.usersDatasource.getResourceProp(newSubscription.user, 'name');
        newSubscription.serializedType = annotationExtension.functions.linearTypeURI(newSubscription.type);
        if (newSubscription.subsURI != "")
          newSubscription.serializedSubsURI = opener.annotationExtensionChrome.groupsDatasource.getResourceProp(newSubscription.subsURI, 'name');

        if (newSubscription.serializedUser == null)
          newSubscription.serializedUser = newSubscription.user;
        if (newSubscription.serializedSubsURI == null)
          newSubscription.serializedSubsURI = newSubscription.subsURI;

        annotationExtensionChrome.subscriptionsTreeDatasource.addNewObject(newSubscription);
        if (newSubscription.list == "+")
          opener.annotationExtensionChrome.client.sendSubscriptions([newSubscription], null);
        else
          opener.annotationExtensionChrome.client.sendSubscriptions(null, [newSubscription]);

        var saveButton = document.getElementById("aeSaveSubscriptions");
        saveButton.className = "subscriptionsChanged";
      }
    }
    else
    {//Kliknuto na cancel
    }
  },
  
  saveSubscriptions : function()
  {
    opener.annotationExtensionChrome.deletedAndSavedSubscriptionsDatasource.deleteAll();
    opener.annotationExtensionChrome.client.sendSettingsWithAllSubscriptions();
    
    var saveButton = document.getElementById("aeSaveSubscriptions");
    saveButton.className = "subscriptionsSaved";
  },
  
  loadDefaultSubscriptions : function()
  {
    var subsLists = opener.annotationExtensionChrome.settings.serializeSubscriptionsForSubscribe(true);
    var whitelist = subsLists.defaultBlacklist + subsLists.defaultNotInList;
    var blacklist = subsLists.blacklist + subsLists.whitelist + subsLists.whitelist;
    opener.annotationExtensionChrome.client.sendSubscriptions(whitelist, blacklist);
    
    annotationExtensionChrome.subscriptionsTreeDatasource.deleteAll();
    opener.annotationExtensionChrome.settings.addDefaultSubscriptions();
    
    var saveButton = document.getElementById("aeSaveSubscriptions");
    saveButton.className = "subscriptionsChanged";
  },
  
  /**
   * Handler pro vybrani radku ve stromu
   * strom id=aeSubscriptionTree
   */
  aeSubscriptionTreeSelected : function(ev)
  {
    var subsTreeView = document.getElementById('aeSubscriptionsTree').view;
    var selection = subsTreeView.selection.currentIndex;
    
    if (selection > -1)
    {
      var subscriptionURI = annotationExtensionChrome.subscriptionsTreeDatasource.getResourceURIOnIndex(selection);
      
      //Prave tlacitko
      ////////////////////////////////
      if (ev.button == 2)
      {
        let stringBundle = document.getElementById("annotationextension-string-bundle");
        
        if (window.confirm(stringBundle.getString("annotationextension.settings.deleteSubscribtion")))
        {//Smazani nastaveni
          var selectedSubscription = new annotationExtensionChrome.subscription(
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'list'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'subsURI'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'user'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'type'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'saved'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'serializedSubsURI'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'serializedUser'),
            annotationExtensionChrome.subscriptionsTreeDatasource.getResourceProp(subscriptionURI, 'serializedType')
          );
          
          selectedSubscription.uri = subscriptionURI;
          
          annotationExtensionChrome.subscriptionsTreeDatasource.deleteObject(subscriptionURI, annotationExtensionChrome.subscriptionsTreeDatasource.baseURI + annotationExtensionChrome.subscriptionsTreeDatasource.rootName);
          
          if (selectedSubscription.saved == true || selectedSubscription.saved == 'true')
            opener.annotationExtensionChrome.deletedAndSavedSubscriptionsDatasource.addNewObject(selectedSubscription);
          
          var subscriptions = [selectedSubscription];
          if (selectedSubscription.list == "+")
          {
            subscriptions.push(selectedSubscription);
          }
          
          opener.annotationExtensionChrome.client.sendSubscriptions(null, subscriptions);
          
          var saveButton = document.getElementById("aeSaveSubscriptions");
          saveButton.className = "subscriptionsChanged";
        }
        
        return;
      }
      
      //Ostatni tlacitka
      ////////////////////////////////
    }
  },

////////////////////////////////////////////////////////////////////////////////
//OSTATNI  
  /**
   * Pokud se zmenilo pole se znamym nastavenim - pouzije se jako handler
   * @param {textbox} textbox, ve kterem je hodnota nastaveni
   * @param {String} setting, jmeno nastaveni, ktere se zmenilo
   */
  knownSettingsChange : function(textbox, setting)
  {
    if (!opener.annotationExtensionChrome.settings.settingIsKnown(setting))
      return;
    else
    {
      opener.annotationExtensionChrome.settings[setting] = textbox.value;
      opener.annotationExtensionChrome.client.sendSettings();
    }
  },
  
/////////////////////////////////////////////////////////////////////////////////
//PANEL ANOTACE APOD.
  
  initAnnotation : function()
  {
    document.getElementById('aeannotationPanelOptionBackgroundColorPicker').color = document.getElementById('aeannotationPanelOptionBackground').value;
    document.getElementById('aeannotationPanelOptionFontColorPicker').color = document.getElementById('aeannotationPanelOptionFont').value;
  },

  colorSelected : function(hColor, colorTextboxId)
  {
    var preferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.annotationextension.annotationFragment.");
    var rgba = annotationExtensionChrome.typesColors.hexColorToRgbaColor(hColor, 1);
    var colorTextbox = document.getElementById(colorTextboxId).value = rgba;
    
    if (colorTextboxId == 'aeannotationPanelOptionFont')
    {
      preferences.setCharPref("defaultFont", rgba);
    }
    else if (colorTextboxId == 'aeannotationPanelOptionBackground')
    {
      preferences.setCharPref("defaultBackground", rgba);
    }
  }
}