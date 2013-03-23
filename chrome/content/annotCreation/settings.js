/**
 * Soubor: settings.js
 * Autor: Jiri Trhlik
 * Datum: 18.6.2011
 * Popis: Ulozeni nastaveni anotacniho serveru, prace s nastavenim apod.
 *        Zde se take ukladaji skupiny, ke kterym se uzivatel muze pripojit
 * Posledni uprava: 18.6.2011
 */

annotationExtensionChrome.settings = 
{
  //NAZVY PROMENNYCH URCUJI ZNAME ("SPECIALNI") NASTAVENI
  DefaultUserGroup : "",
  
  //"Konstruktor"
  init : function()
  {
    annotationExtensionChrome.groupsDatasource = new annotationExtensionChrome.Datasource('groups', [{ type : 'annotGroup', props : ['name', 'logged']}]);
		annotationExtensionChrome.usersDatasource = new annotationExtensionChrome.Datasource('users', [{ type : 'user', props : ['name', 'email', 'login']}]);
    annotationExtensionChrome.colorsDatasource = new annotationExtensionChrome.Datasource('colors', [{ type : 'annotColor', props : ['name', 'backgroundColor', 'fontColor']}]);
    annotationExtensionChrome.otherSettingsDatasource = new annotationExtensionChrome.Datasource('settings', [{ type : 'annotSetting', props : ['name', 'value']}]); 
		annotationExtensionChrome.subscriptionsDatasource = new annotationExtensionChrome.Datasource('subscriptions', [{ type : 'subscription', props : ['type', 'list', 'user', 'subsURI', 'saved', 'serializedType', 'serializedSubsURI', 'serializedUser']}]);
		//Je pouzito k udrzeni spravneho nastaveni (pokud se smaze subscription a pote se odesle nastaveni bez ulozeni aktualniho seznamu subscriptions)
		annotationExtensionChrome.deletedAndSavedSubscriptionsDatasource = new annotationExtensionChrome.Datasource('subscriptions', [{ type : 'subscription', props : ['type', 'list', 'user', 'subsURI', 'saved', 'serializedType', 'serializedSubsURI', 'serializedUser']}]);
	},
	
	/**
   * Rozhrani pro observer
   */
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic == "annotationextension-userGroupsReady")
    {
			let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    	observerService.removeObserver(this, "annotationextension-userGroupsReady");
			this.handleSubscriptionsAfterLogin();
    }
  },
  
  /**
   * Zpracuje zpravu s elementy nastaveni a toto nastaveni ulozi
   * @param {Elem} settingsElem element s nastavenim
   */
  processSettings : function(settingsElems)
  {
    var paramElems = settingsElems[0].getElementsByTagName('param');
  
    //Smazani starych ulozenych nastaveni
    this.clearSettings();
    
    for(var i = 0; i < paramElems.length; i++)
    {
      if (!paramElems[i].hasAttribute('name') ||
          !paramElems[i].hasAttribute('value'))
        //Param neobsahuje povinne polozky, preskoc param
        continue;
      
      var name = paramElems[i].getAttribute('name');
      var value = paramElems[i].getAttribute('value');

      if (this.settingIsKnown(name))
      {//Nastaveni je zname...
        this[name] = value;
      }
      else if (name.match(annotationExtension.TYPECOLOROPTION))
      {//...jedna se o barvu typu anotace (anotacniho doplnku pro firefox)...
				var colors = value.split(";");
				var backgroundColor = colors[0];

				if (colors.length > 1) {
					var fontColor = colors[1];
				}
				else
					var fontColor = "";
					
				if (fontColor == "" || fontColor.match(/^\s*$/g))
					fontColor = annotationExtension.SETTING_NOT_SET;
				if (backgroundColor == "" || fontColor.match(/^\s*$/g))
					backgroundColor = annotationExtension.SETTING_NOT_SET;
        
				var newColorSetting = {
                                uri : 'annotationExtension://' + name.slice(annotationExtension.TYPECOLOROPTION.length),
                                name : name.slice(annotationExtension.TYPECOLOROPTION.length),
                                backgroundColor : backgroundColor,
																fontColor : fontColor};
																
        annotationExtensionChrome.colorsDatasource.addNewObject(newColorSetting);
      }
			else if (name.match(annotationExtension.SUBSCRIPTIONOPTION))
      {//...jedna se o odber anotace (anotacniho doplnku pro firefox)...
				//value="list;user;type;uri"
				var values = value.split(";");
				
				var serializedSubsURI = values[5];
				if (serializedSubsURI == "")
					serializedSubsURI = values[3];
				var serializedType = annotationExtension.functions.linearTypeURI(values[2]);
				var serializedUser = values[4];
				if (serializedUser == "")
					serializedUser = values[1];
				var newSubscription = new annotationExtensionChrome.subscription(
                     values[0],
										 values[3],
                     values[1],
										 values[2],
										 true,
										 serializedSubsURI,
                     serializedUser,
										 serializedType);

				annotationExtensionChrome.subscriptionsDatasource.addNewObject(newSubscription);
      }
      else
      {//...ostatni nastaveni
        var newSetting = {
                          uri : 'annotationExtension://' + name,
                          name : name,
                          value : value};
        annotationExtensionChrome.otherSettingsDatasource.addNewObject(newSetting);
      }
    }
    
    let observerService = Cc["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "annotationextension-settingsChange-topic", "all");
  },
	
	/**
	 * Nastavi typu novou barvu, pokud typ ma nastavenou barvu, zmeni ji.
	 * @param {String} typeURI, uri typu, kteremu se ma nastavit barva
	 */
	setTypeColor : function(typeURI)
	{
		var linType = annotationExtension.functions.linearTypeURI(typeURI);
		var colorURI = 'annotationExtension://' + linType;
		var oldBackgroundColor = annotationExtensionChrome.colorsDatasource.getResourceProp(colorURI, 'backgroundColor');
		var oldFontColor = annotationExtensionChrome.colorsDatasource.getResourceProp(colorURI, 'fontColor');
		
		var params = {out:null, settValue:{oldBackgroundColor : oldBackgroundColor, oldFontColor : oldFontColor}};
    window.openDialog("chrome://annotationextension/content/dialogs/editColorDialog.xul", "annotationextension:changeColorWindow", "chrome,centerscreen,modal", params).focus();  
      
    if (params.out)
    {//Pridano nove nastaveni
			if (oldBackgroundColor)
			{
				if (params.out.backgroundColor != null && params.out.fontColor != null
						&& (params.out.backgroundColor != oldBackgroundColor || params.out.fontColor != oldFontColor))
				{
					annotationExtensionChrome.colorsDatasource.changeResourceProp(colorURI, 'backgroundColor', params.out.backgroundColor);
					annotationExtensionChrome.colorsDatasource.changeResourceProp(colorURI, 'fontColor', params.out.fontColor);
					annotationExtensionChrome.client.sendSettings();
				}
			}
			else
			{
				if (params.out.backgroundColor != null && params.out.fontColor != null)
				{				
					var newColor = { uri : colorURI,
													 name : linType,
													 backgroundColor : params.out.backgroundColor,
													 fontColor : params.out.fontColor}
					annotationExtensionChrome.colorsDatasource.addNewObject(newColor);
					annotationExtensionChrome.client.sendSettings();
				}
			}
    }
	},
  
  /**
   * Vytvori z nastaveni XML zpravu, ktera se muze odeslat na server
   * Neobsahuje subscriptions! Viz serializeSubscriptions
   * @param {Bool} zda se maji do nastaveni zahrnout vsechny odbery (viz serializeSubscriptions())
   * @returns {String} XML zprava s nastavenim
   */
  serializeSettings : function(allSubscriptions)
  {
    XMLString = "";
    
    //Zname nastaveni...
    for (prop in this)
    {
      if(typeof(this[prop]) == 'string')
      {
        XMLString += '<param name="'+prop+'" value="'+this[prop]+'"/>';
      }
    }
    //...nastaveni barev...
    XMLString += this.serializeObjectsInDatasourceSettings(annotationExtensionChrome.colorsDatasource, annotationExtension.TYPECOLOROPTION);  
    //...ostatni nastavni
    XMLString += this.serializeObjectsInDatasourceSettings(annotationExtensionChrome.otherSettingsDatasource);
		//...odbery
		XMLString += this.serializeSubscriptionsForSettings(!allSubscriptions);
     
    return XMLString;
  },
  
  /**
   * Vytvori z datasource s nastavenim XML zpravu, obsahujici polozky nastaveni
   * @param {Datasource} settingsDatasource, Datasource s nastavenim
   * @param {String} settingPrefixP, predpona, ktera se prida pred jmeno nastaveni
   *                 -napr. pred barvu se pridava: "ClientFFExtAnnotExtTypeColor:"
   * @returns {String} XML zprava s polozkami nastaveni
   */
  serializeObjectsInDatasourceSettings : function(settingsDatasource, settingPrefixP)
  {
    if (settingPrefixP == undefined || settingPrefixP == null)
      var settingPrefix = "";
    else
      var settingPrefix = settingPrefixP;
    
    XMLString = "";
    
    var datasource = settingsDatasource.getDatasource();
    if (datasource == null)
      return "";
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);
     
    //Kontejner   
    var theSectionHeading = rdfService.GetResource(settingsDatasource.baseURI + settingsDatasource.rootName);
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      return "";
    
    theSectionContainer.Init(datasource, theSectionHeading);
		
		var defaultTypeName = settingsDatasource.defaultType;
		var props = settingsDatasource.types[defaultTypeName];
    
		var childElems = theSectionContainer.GetElements();
    while(childElems.hasMoreElements())
    {
      var child = childElems.getNext();
      child.QueryInterface(Components.interfaces.nsIRDFResource);

			var settingName = settingsDatasource.getResourceProp(child.ValueUTF8, 'name');
			
			var settingValue = "";
			for (var i = 1; i < props.length; ++i)
			{// na indexu 0 je jmeno
				var prop = props[i];
				if (prop == 'name')
					continue;
				
				if (i != 1)
					settingValue += ';';
				
				var propValue = settingsDatasource.getResourceProp(child.ValueUTF8, prop);
				if (propValue != annotationExtension.SETTING_NOT_SET)
					settingValue += propValue;
			}
      
      XMLString += '<param name="'+settingPrefix+settingName+'" value="'+settingValue+'"/>';
    }
   
    return XMLString;
  },
	
	/**
   * Vytvori z datasource se subscriptions XML zpravu, ktera se muze odeslat spolecne s nastavenim
   * Format XML: <param name="subscription1" value="list;user;type;uri"/>
   *             <param name="subscription2" value="list;;;uri"/>
   *             <param name="subscription2" value="list;user;;"/>
   * @param {Bool} onlySaved serializuje pouze odbery, ktere jsou jiz ulozeny na serveru jako nastaveni
   * @returns {String} XML zprava s polozkami nastaveni
   */
	serializeSubscriptionsForSettings : function(onlySaved, ds)
	{
    var settingPrefix = annotationExtension.SUBSCRIPTIONOPTION;
    
    XMLString = "";
    
		if (ds == undefined)
		{
			var datasourceW = annotationExtensionChrome.subscriptionsDatasource;
			var datasource = annotationExtensionChrome.subscriptionsDatasource.getDatasource();
		}
		else
		{
			var datasourceW = ds;
			var datasource = ds.getDatasource();
		}
    if (datasource == null)
      return "";
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);
     
    //Kontejner   
    var theSectionHeading = rdfService.GetResource(datasourceW.baseURI + datasourceW.rootName);
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      return "";
    
    theSectionContainer.Init(datasource, theSectionHeading);
    
    var childElems = theSectionContainer.GetElements();
   
		var i = 0; 
    while(childElems.hasMoreElements())
    {
      var child = childElems.getNext();
      child.QueryInterface(Components.interfaces.nsIRDFResource);
      
			var isSavedInSettings = datasourceW.getResourceProp(child.ValueUTF8, 'saved');
			if (onlySaved && (isSavedInSettings == false || isSavedInSettings == 'false'))
			{
				continue;
			}
      var subscriptionList = datasourceW.getResourceProp(child.ValueUTF8, 'list');
      var subscriptionUser = datasourceW.getResourceProp(child.ValueUTF8, 'user');
			var subscriptionURI = datasourceW.getResourceProp(child.ValueUTF8, 'subsURI');
      var subscriptionType = datasourceW.getResourceProp(child.ValueUTF8, 'type');
      var subscriptionSerializedUser = datasourceW.getResourceProp(child.ValueUTF8, 'serializedUser');
			var subscriptionSerializedURI = datasourceW.getResourceProp(child.ValueUTF8, 'serializedSubsURI');
			var subscriptionName = i.toString();
			
			if (subscriptionSerializedUser == subscriptionUser)
				subscriptionSerializedUser = ""; //aby nebyla v nastaveni zbytecna redundance
			if (subscriptionSerializedURI == subscriptionURI)
				subscriptionSerializedURI = "";
			
      
      XMLString += '<param name="'+settingPrefix+subscriptionName+'" value="'+subscriptionList+';'+subscriptionUser+';'+subscriptionType+';'+subscriptionURI+
			                                                                      ';'+subscriptionSerializedUser+';'+subscriptionSerializedURI+'"/>';
			++i;
    }
		
		if (datasourceW == annotationExtensionChrome.subscriptionsDatasource)
			XMLString += this.serializeSubscriptionsForSettings(true, annotationExtensionChrome.deletedAndSavedSubscriptionsDatasource);
  
    return XMLString;
	},
	
	/**
   * Vytvori z datasource se subscriptions whitelist a blacklist
   * @param {Bool} sepDefaultSubsP, viz @returns
   * @returns {Object} .whitelist whitelist (string) a .blacklist blacklist (string)
   *                  pokud je sepDefaultSubsP true .defaultWhitelist obsahuje defaultni odber
   *                  ktery je na whitelistu a .defaultBlacklist obsahuje defaultni odber, ktery je
   *                  na blacklistu, .defaultNotInList potom obsahuje zbyle defaultni odbery
   *                  (ktere nebyly explicitne uvedene na seznamu v doplnku)
   */
	serializeSubscriptionsForSubscribe : function(sepDefaultSubsP)
	{
		var sepDefaultSubs = sepDefaultSubsP || false;

    var settingPrefix = annotationExtension.SUBSCRIPTIONOPTION;
    
    var subscribeXMLString = "";
		var unsubscribeXMLString = "";
		var defaultSubscribeXMLString = "";
		var defaultUnsubscribeXMLString = "";
    
    var datasource = annotationExtensionChrome.subscriptionsDatasource.getDatasource();
    if (datasource == null)
      return "";
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);
     
    //Kontejner   
    var theSectionHeading = rdfService.GetResource(annotationExtensionChrome.subscriptionsDatasource.baseURI + annotationExtensionChrome.subscriptionsDatasource.rootName);
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      return "";
    
    theSectionContainer.Init(datasource, theSectionHeading);
    
    var childElems = theSectionContainer.GetElements();
		
		var defaultSubscriptions = this.getDefaultSubscriptions();
		var defaultSubscriptionsLength = defaultSubscriptions.length;
		
		var toDefaultXMLString = false;
   
    while(childElems.hasMoreElements())
    {
      var child = childElems.getNext();
      child.QueryInterface(Components.interfaces.nsIRDFResource);

      var subscriptionList = annotationExtensionChrome.subscriptionsDatasource.getResourceProp(child.ValueUTF8, 'list');
      var subscriptionUser = annotationExtensionChrome.subscriptionsDatasource.getResourceProp(child.ValueUTF8, 'user');
			var subscriptionURI = annotationExtensionChrome.subscriptionsDatasource.getResourceProp(child.ValueUTF8, 'subsURI');
      var subscriptionType = annotationExtensionChrome.subscriptionsDatasource.getResourceProp(child.ValueUTF8, 'type');
			
			var subscription = new annotationExtensionChrome.subscription(null, subscriptionURI, subscriptionUser, subscriptionType, null); 
      var subscriptionXMLString = subscription.getSourceString();
			
			if (sepDefaultSubsP)
			{//pokud se defaultni odbery maji uvest zvlast
				for (var i = 0; i < defaultSubscriptionsLength; ++i)
				{//zkontroluj vuci kazdemu defaultnimu odberu
					if (defaultSubscriptions[i].compare(subscriptionURI, subscriptionType, subscriptionUser))
					{
						defaultSubscriptions[i].inList = true;
						toDefaultXMLString = true;
					}
				}
			}
			
			if (subscriptionList == '+')
			{
				if (toDefaultXMLString)
					defaultSubscribeXMLString += subscriptionXMLString;
				else
					subscribeXMLString += subscriptionXMLString;
			}
			else
			{
				if (toDefaultXMLString)
					defaultUnsubscribeXMLString += subscriptionXMLString;
				else
					unsubscribeXMLString += subscriptionXMLString;
			}
				
			toDefaultXMLString = false;
    }
		
		var defaultNotInList = "";
		
		for (var i = 0; i < defaultSubscriptionsLength; ++i)
		{
			if (defaultSubscriptions[i].inList != true)
			{
				defaultNotInList += defaultSubscriptions[i].getSourceString();
			}
		}
   
    return {whitelist : subscribeXMLString,
		        blacklist : unsubscribeXMLString,
						defaultWhitelist : defaultSubscribeXMLString,
						defaultBlacklist : defaultUnsubscribeXMLString,
						defaultNotInList : defaultNotInList};
	},
	
	/**
	 * @returns {Array} pole obsahujici "subscription" objekty
	 */
	getDefaultSubscriptions : function()
	{
		var defSubs = [];
		var loggedGroups = this.getLoggedGroupsURIAndName();
		
		defSubs.push(new annotationExtensionChrome.subscription(null, null, annotationExtension.user.userID, null, null, null, annotationExtension.user.userNameAndSurname, null));
								 
		for (var i = 0; i < loggedGroups.length; ++i)
			defSubs.push(new annotationExtensionChrome.subscription(null, loggedGroups[i].uri, null, null, null, loggedGroups[i].name, null, null));
			
		return defSubs;
	},
	
	handleSubscriptionsAfterLogin : function()
	{
		var subscriptionsIsEmpty = false;
		var datasource = annotationExtensionChrome.subscriptionsDatasource.getDatasource();

    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].getService(Components.interfaces.nsIRDFContainerUtils);
      
    var theSectionHeading = rdfService.GetResource(annotationExtensionChrome.subscriptionsDatasource.baseURI + annotationExtensionChrome.subscriptionsDatasource.rootName);
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      subscriptionsIsEmpty = true;
		else if (containerTools.IsEmpty(datasource, theSectionHeading))
			subscriptionsIsEmpty = true;
		
		
		if (subscriptionsIsEmpty)
		{//Pridej do subscriptions defaultni, ke kterym je uzivatel prihlasen po prihlaseni
			this.addDefaultSubscriptions();	
		}
		else
		{//Odhlas od defaultnich (ktere nejsou v nastaveni) a prihlas k subscriptions, ktere jsou v nastaveni
			var subsLists = this.serializeSubscriptionsForSubscribe(true);
			//Defaultni odber, ktery je na whitelistu nemusis posilat
			//ktery je na blacklistu, musis odhlasit
			//ktery neni nikde musis "2x odhlasit"
			subsLists.blacklist += subsLists.defaultBlacklist;
			subsLists.blacklist += subsLists.defaultNotInList + subsLists.defaultNotInList;
			annotationExtensionChrome.client.sendSubscriptions(subsLists.whitelist, subsLists.blacklist);
		}
	},
	
	/**
	 * Prida do listu odberu defaultni odbery
	 */
	addDefaultSubscriptions : function()
	{
		var defaultSubscriptions = this.getDefaultSubscriptions();
		for (var i = 0; i < defaultSubscriptions.length; ++i)
		{			
			annotationExtensionChrome.subscriptionsDatasource.addNewObject(defaultSubscriptions[i]);
		}
	},
  
  /**
   * @param {string} setting, nastaveni o kterem chceme vedet, zda je zname
   * @returns {bool} true, pokud je vlasnost znama
   */
  settingIsKnown : function(setting)
  {
    for (prop in this)
    {
      if (prop == setting)
        return true;
    }
    
    return false;
  },
  
  /**
   * Projde zpravu se skupinami na serveru a ulozi je
   * @param {Elem} groupsElems, element se skupinami
   * @param {String} filter, filtr, ktery se pouzil u queryUserGroups
   * @return {int} 0, pokud se zprava podarila projit, jinak -1
   */
  processGroups : function(groupsElems, filter)
  {
    var groupElems = groupsElems[0].getElementsByTagName('group');
	
    for(var i = 0; i < groupElems.length; i++)
    {
      if (!groupElems[i].hasAttribute('name') ||
          !groupElems[i].hasAttribute('uri'))
        //Skupina neobsahuje povinne polozky, preskoc skupinu
        continue;
      
      var group = new annotationExtensionChrome.group(groupElems[i].getAttribute('name'),
        groupElems[i].getAttribute('uri'),
        'false');
      
      annotationExtensionChrome.groupsDatasource.addNewObject(group);
    }
    
    //Pro ziskani skupin, ke kterym je uzivatel prihlasen
		annotationExtensionChrome.client.queryLoggedUser();
    
    return 0;
  },
  
  /**
   * Projde element se skupinami, ke kterym je uzivatel prihlaseny
   * @param {Elem} userGroupsElems, element se skupinami - <userGroups>
   */
  processLoggedGroups : function(userGroupsElems)
  {
    var groupElems = userGroupsElems[0].getElementsByTagName('group');
    for(var i = 0; i < groupElems.length; i++)
    {
      if (!groupElems[i].hasAttribute('name') ||
          !groupElems[i].hasAttribute('uri'))
        //Skupina neobsahuje povinne polozky, preskoc skupinu
        continue;
      
      var groupURI = groupElems[i].getAttribute('uri');
      if (annotationExtensionChrome.groupsDatasource.getResourceProp(groupURI, 'logged') != null)
      {//Znaci, ze "skupina je v ds"
        annotationExtensionChrome.groupsDatasource.changeResourceProp(groupURI, 'logged', 'true');
      }
      else
      {
        var group = new annotationExtensionChrome.group(groupElems[i].getAttribute('name'),
        groupElems[i].getAttribute('uri'),
        'true');
        annotationExtensionChrome.groupsDatasource.addNewObject(group);
      }
    }
		
		// Tento observer je registrovany pouze pri prihlaseni. Ma vyznam pro zpracovani subscriptions
		// z nastaveni a defaultniho subscriptions.
		let observerService = Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.notifyObservers(null, "annotationextension-userGroupsReady", null);
  },
	
	/**
	 * @returns {Array of objects} skupiny, ke kterym je uzivatel prihlasen - objekt obsahuje uri a name skupin
	 */
	getLoggedGroupsURIAndName : function()
	{
		var groups = [];
    
    var datasource = annotationExtensionChrome.groupsDatasource.getDatasource();
    if (datasource == null)
      return "";
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);
     
    //Kontejner   
    var theSectionHeading = rdfService.GetResource(annotationExtensionChrome.groupsDatasource.baseURI + annotationExtensionChrome.groupsDatasource.rootName);
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      return "";
    
    theSectionContainer.Init(datasource, theSectionHeading);
    
    var childElems = theSectionContainer.GetElements();
    
    while(childElems.hasMoreElements())
    {
      var child = childElems.getNext();
			child.QueryInterface(Components.interfaces.nsIRDFResource);
			
			var groupURI = child.ValueUTF8;
			var isLogged = annotationExtensionChrome.groupsDatasource.getResourceProp(groupURI, 'logged');
			if (isLogged == 'true' || isLogged == true)
			{
				groups.push({uri : groupURI,
										 name : annotationExtensionChrome.groupsDatasource.getResourceProp(groupURI, 'name')});
			}
    }

		return groups;
	},
  
  /**
   * Zmeni hodnotu prihlaseni u skupiny na prihlasenou
   * @param {String} groupURI, uri se skupinou, ktere se ma zmenit hodnota prihlaseni
   */
  joinGroup : function(groupURI)
  {
    annotationExtensionChrome.groupsDatasource.changeResourceProp(groupURI, 'logged', 'true');
  },
  
  /**
   * Zmeni hodnotu prihlaseni u skupiny na odhlasenou
   * @param {String} groupURI, uri se skupinou, ktere se ma zmenit hodnota prihlaseni
   */
  leaveGroup : function(groupURI)
  {
    annotationExtensionChrome.groupsDatasource.changeResourceProp(groupURI, 'logged', 'false');
  },
	
	/**
   * Projde zpravu s uzivateli na serveru a ulozi je
   * @param {Elem} personsElems, element s uzivateli
   * @return {int} 0, pokud se zprava podarila projit, jinak -1
   */
  processPersons : function(personsElems)
	{
    var personElems = personsElems[0].getElementsByTagName('person');
	
    for(var i = 0; i < personElems.length; i++)
    {
      if (!personElems[i].hasAttribute('name') ||
          !personElems[i].hasAttribute('id') ||
			    !personElems[i].hasAttribute('login') ||
          !personElems[i].hasAttribute('email')) 
        continue;

      var user = new annotationExtensionChrome.person(personElems[i].getAttribute('id'),
			  personElems[i].getAttribute('login'),
        personElems[i].getAttribute('name'),
        personElems[i].getAttribute('email'));
			
      annotationExtensionChrome.usersDatasource.addNewObject(user);
    }
		
    return 0;
  },
  
  /**
   * Smaze vsechna ulozena nastaveni
   */
  clearSettings : function()
  {
    for (prop in this)
    {
      if(typeof(this[prop]) == 'string')
      {
        this[prop] = "";
      }
    }
    
    annotationExtensionChrome.colorsDatasource.deleteAll();
    annotationExtensionChrome.otherSettingsDatasource.deleteAll(); 
  },
  
  /**
   * Smaze vsechna ulozena nastaveni a skupiny
   */
  clear : function()
  {
    this.clearSettings();
    annotationExtensionChrome.groupsDatasource.deleteAll();
		annotationExtensionChrome.usersDatasource.deleteAll();
		annotationExtensionChrome.subscriptionsDatasource.deleteAll();
		annotationExtensionChrome.deletedAndSavedSubscriptionsDatasource.deleteAll();
  },
	
	/**
	 * Prida jmeno serveru, ke kteremu je uzivatel prave prihlasen
	 * do historie.
	 */
	addServerAddressToHistory : function()
	{
		let application = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
    let serverAddress = application.prefs.get("extensions.annotationextension.server.serverAddress").value;
			
		let formHistory = Components.classes["@mozilla.org/satchel/form-history;1"]
			.getService(Components.interfaces.nsIFormHistory2 || Components.interfaces.nsIFormHistory);
		
		if (!formHistory.entryExists("annotationextensionserver-form-history", serverAddress))
		{
			formHistory.addEntry("annotationextensionserver-form-history", serverAddress); 
		}
	}
};

(function() { this.init(); }).apply(annotationExtensionChrome.settings);