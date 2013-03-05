/**
 * Soubor: client.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Objekt 'klienta', definuje praci 'klienta', pripojeni k sereru, posilani zprav...
 *        Podporovana verze protokolu je 1.1.
 *        Kazda metoda definuje nejakou zpravu, ktera se zasle na server.
 * Posledni uprava: 5.6.2012
 */

//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// ++ JMENO ++
// znaci funkci, ktera zpracuje zpravu ze serveru
// -- JMENO --
// znaci funkci, ktera vytvari zpravu pro odeslani na server
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//

annotationExtensionChrome.client =
{ 
  address : "",            /**< Adresa serveru, na kterou se klient pripojuje.(vcetne protokolu a portu) */
  serverAddress : "",      /**< Adresa serveru(IP), na kterou se klient pripojuje. */
  serverPort : "",         /**< Port serveru, na ktery se klient pripojuje. */
  sessionID : "",          /**< Uklada session obdrzene od serveru. */
  url : "Annotations/AnnotEditorsComet",
  
  /**
   * Konstruktor
   */
  init : function()
  {
    //TODO:
    //zrusit, nacist adresu pouze pri prihlaseni na server!!!!
    let application =
      Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
   
    this.serverAddress =
      application.prefs.get("extensions.annotationextension.server.serverAddress");
    this.serverPort =
      application.prefs.get("extensions.annotationextension.server.serverPort");

    this.serverAddress.events.addListener("change", this);
    this.serverPort.events.addListener("change", this);

    this.address = 'http://' + this.serverAddress.value + ':' + this.serverPort.value + '/' + this.url;
  },
  
  /**
   * (Handler)Nastavi znovu adresu serveru pri zmene nastaveni
   * (pri zmene v nastaveni)
   */
  handleEvent : function(ev)
  {
    //Zmenen port nebo IP/dom.-jmeno v nastaveni
    if (ev.data == "extensions.annotationextension.server.serverPort"
        || ev.data == "extensions.annotationextension.server.serverAddress" )
    {
      this.address = 'http://' + this.serverAddress.value + ':' + this.serverPort.value + '/' + this.url;
    }
  },
  
  
  /**
   * Test, zda XML obsahuje element error
   * @returns {bool} true, pokud XML obsahuje element error
   *                 false, pokud XML neobsahuje element error
   */
  isErrorElInResponse : function(XML)
  {
    var errorElem = XML.getElementsByTagName('error');
    if (errorElem.length != 0)
      return true;
    
    return false;
  },
	
	/**
   * Test, zda XML obsahuje element warning
   * @returns {bool} true, pokud XML obsahuje element warning
   *                 false, pokud XML neobsahuje element warning
   */
  isWarningElInResponse : function(XML)
  {
    var warningElem = XML.getElementsByTagName('warning');
    if (warningElem.length != 0)
      return true;
    
    return false;
  },
  
  /**
   * Zasle http request na server.
   * @param {nsIXMLHttpRequest} httpRequest objekt, ktery zasila zpravu.
   * @param {string} body Telo zpravy, ktere se posle serveru.
   */
  sendMessage : function(httpRequest, body)
  {
		//alert(body);
    //TODO:
    //zpracovat chybu http pomoci catch(viz stranky mozilly)
    //readyState, status a statusText
    //Pokud vznikne chyba
    httpRequest.onerror = this.httpRequestError;

    httpRequest.open('POST', this.address, true);
    //BODY NSIDOMDOCUMENT
    httpRequest.setRequestHeader('Content-Type', 'text/xml');
    httpRequest.send(body);
  },
  
  /**
   * Zpracovani chyby XMLHttpRequest objektu
   */
  httpRequestError : function(ev)
  {
		annotationExtensionChrome.user.hideProgressMeter();
		
    annotationExtensionChrome.alerts.alert("httpReqError");
  },
  
  /**
   * Zpracuje chybu v XML zprave
   * @param message zprava, ve kreje je element s chyby
   */
  processErrorElemInMessage : function(XMLmessage, functionName)
  {
    try
    {
      var errorElem = XMLmessage.getElementsByTagName('error');
      var errorNo = errorElem[0].getAttribute('number');
      
      var alertMessage = "";
      
      //Projde vsechny elementy s chybou
      for (var i = 0; i < errorElem.length; i++)
      {
        var messageElem = errorElem[i].getElementsByTagName('message');
        for (var j = 0; j < messageElem.length; j++)
        {
          if (messageElem[j].hasChildNodes)
          {
            var messageCData = messageElem[0].firstChild;
            if (messageCData.nodeType == 3 || messageCData.nodeType == 4)
            {
              alertMessage += messageCData.nodeValue + ' \n';
            }
          }
        }
      }
      
      if(errorNo == annotationExtension.constants.ERROR_0_PROTO_VERSION)
      {//Nepodporovana verze prootkolu.
        annotationExtensionChrome.alerts.alert("badProto");
      }
      if(errorNo == annotationExtension.constants.ERROR_1_CREDENTIALS)
      {//Nespravne uzivatelske udaje. 
        annotationExtensionChrome.user.badLogin("clickedCall");
      }
      else
      {
				if (functionName == annotationExtension.SYNC_NAME)
				{//CHYBA NASTALA PO SYNCHRONIZACI
					let observerService = Cc["@mozilla.org/observer-service;1"].
							getService(Components.interfaces.nsIObserverService);
					
					if(errorNo == annotationExtension.constants.ERROR_9_SYNC_FAILED || errorNo == annotationExtension.constants.ERROR_10_SYNC_FORC
						 || errorNo == annotationExtension.constants.ERROR_11_SYNC_ERR || errorNo == annotationExtension.constants.ERROR_62_SYNC_DOC_OPENED)
					{//Pokud se nepodari synchronizovat, informuj o tom annotationWindows.js.
						observerService.notifyObservers(null, "annotationextension-docSynchronized-topic", errorNo + ":" + alertMessage);
					}
					else
					{
						observerService.notifyObservers(null, "annotationextension-docSynchronized-topic", null);
					}
				}
        
        annotationExtensionChrome.alerts.alert(alertMessage);
      }
    }
    catch(ex)
    {}
  },
	
	/**
   * Zpracuje chybu v XML zprave
   * @param message zprava, ve kreje je element s chyby
   */
  processWarningElemInMessage : function(XMLmessage)
  {
    try
    {
      var warningElems = XMLmessage.getElementsByTagName('warning');
      
      var alertMessage = "";
      
      //Projde vsechny elementy s warningem
      for (var i = 0; i < warningElems.length; i++)
      {
        var warningElem = warningElems[i];
        if (warningElem.hasChildNodes)
        {
          var messageCData = warningElem.firstChild;
          if (messageCData.nodeType == 3 || messageCData.nodeType == 4)
          {
            alertMessage += messageCData.nodeValue + ' \n';
          }
        }
      }
			
			annotationExtensionChrome.alerts.alertWarning(alertMessage);
    }
    catch(ex)
    {}
  },
  
  rootElStart : '<?xml version="1.0" encoding="utf-8" ?><messages>',
  sessionEl : function() { return '<session id="'+this.sessionID+'"/>'; },
  rootElEnd : '</messages>'
};

/**
 * Zprava pro long polling comet
 */
annotationExtensionChrome.client.sendCometMessage = function()
{
	var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
	//TODO:
	//zpracovat chybu http pomoci catch(viz stranky mozilly)
	//readyState, status a statusText
	//Pokud vznikne chyba
	httpRequest.onload = this.processCometResponseMessage;
	httpRequest.onerror = this.httpRequestError;
	
	httpRequest.open('GET', this.address + '?session=' + this.sessionID, true);
	httpRequest.send("");
};

/**
 * Funkce pro zpracovani zpravy od cometu
 */
annotationExtensionChrome.client.processCometResponseMessage = function(ev)
{
	if (annotationExtension.user.isLogged)
	{
		annotationExtensionChrome.client.sendCometMessage();
		//var serializer = new XMLSerializer();
    //alert(serializer.serializeToString(ev.target.responseXML));
		//alert(ev.target.responseXML);
  	var parseErrorElem = ev.target.responseXML.getElementsByTagName('parsererror');
    if (parseErrorElem.length == 0)
		// potlac chyby u comet zprav
			annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
};

/**
 * --ZPRAVA--
 * <connect/>
 * <login/>
 */
annotationExtensionChrome.client.login = function()
{
	annotationExtensionChrome.user.showProgressMeter();
	
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  //Pokud je cela odpoved serveru prijata zavola se odpovidajici funkce na zpracovani prijatych dat
  httpRequest.onload = this.processLoginMessage;
  
  //Pripojeni se k serveru
  var body = this.rootElStart;
  body += '<connect protocolVersion="1.1"/>';
  body += '<login user="'+annotationExtension.user.username;
  body += '" '+'password="'+annotationExtension.user.password+'"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

/**
 * ++ZPRAVA++
 * <login/>
 * Vola objekt http requestu
 */
annotationExtensionChrome.client.processLoginMessage =  function(ev)
{
  annotationExtensionChrome.user.hideProgressMeter();
	
  //Prijata zprava ze serveru
  try
  {		
    var XMLMessage = ev.target.responseXML;
		
    if(XMLMessage == null)
      throw "badResponse";
    
    if(annotationExtensionChrome.client.isErrorElInResponse(ev.target.responseXML))
      throw "error";

    var connectedElem = XMLMessage.getElementsByTagName('connected');
    if (connectedElem.length == 0)
      throw "badResponse";
      //TODO:
      //>>Zpracuj verzi protokolu!!
      if(!connectedElem[0].hasAttribute('sessionID'))
        throw "badResponse";
      annotationExtensionChrome.client.sessionID = connectedElem[0].getAttribute('sessionID');
  
    var loggedElem = XMLMessage.getElementsByTagName('logged');
    if (loggedElem.length == 0)
      throw "badResponse";
      if(loggedElem[0].hasAttribute('id'))
        annotationExtension.user.userID = loggedElem[0].getAttribute('id');
      else
        throw "badResponse";
      if(loggedElem[0].hasAttribute('name'))
        annotationExtension.user.userNameAndSurname = loggedElem[0].getAttribute('name');

    //Pokud je obsazeno ve zprave nastaveni uzivatele, zpracuj.
    var settingsElem = XMLMessage.getElementsByTagName('settings');
    if (settingsElem.length != 0)
    {
      annotationExtensionChrome.client.processSettings(settingsElem);
    }
		
		//viz komentar u funkce annotationExtensionChrome.settings.processLoggedGroups
		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    observerService.addObserver(annotationExtensionChrome.settings, "annotationextension-userGroupsReady", false);
		//Pro ziskani skupin
		annotationExtensionChrome.client.queryUserGroups();
		//Pro ziskani uzivatelu
		annotationExtensionChrome.client.queryPersons();
  
    //Uspesne prihlaseni
    annotationExtensionChrome.user.loggedOn();
  }
  catch(ex)
  {
    //Ve zprave od serveru je element s chybou
    if(ex == "error")
      annotationExtensionChrome.client.processErrorElemInMessage(XMLMessage);
    //Chyba formatovani odpovedi
    else if(ex == "badResponse")
      annotationExtensionChrome.alerts.alert("badResponse");
  }
};

/**
 * --ZPRAVA--
 * <subscribe/> a <unsubscribe/>
 * @param {Array or String} whitelist pole objektu subscription nebo retezec se subscriptions
 * @param {Array or String} blacklist pole objektu subscription nebo retezec se subscriptions
 * Tato zprava by se mela zasilat pouze po prihlaseni, kdy se nactou subscriptions z nastaveni
 */
annotationExtensionChrome.client.sendSubscriptions = function(whitelist, blacklist)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
	httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
	
  var body = this.rootElStart;
  body += this.sessionEl();
	
	var sendWhitelist = false;
	var sendBlacklist = false;
	
	if (whitelist != undefined && whitelist != null && whitelist != "")
	{
		sendWhitelist = true;
		body += "<subscribe>";
		if (typeof whitelist === 'string')
		{
			body += whitelist;
		}
		else
		{
			var whitelistCount = whitelist.length;
			for (var i = 0; i < whitelistCount; ++i)
			{
				var subscription = whitelist[i];
				body += subscription.getSourceString();
			}
		}
		body += "</subscribe>";
	}
	
	if (blacklist != undefined && blacklist != null && blacklist != "")
	{
		sendBlacklist = true;
		body += "<unsubscribe>";
		if (typeof blacklist === 'string')
		{
			body += blacklist;
		}
		else
		{
			var blacklistCount = blacklist.length;
			for (var i = 0; i < blacklistCount; ++i)
			{
				var subscription = blacklist[i];
				body += subscription.getSourceString();
			}
		}
		body += "</unsubscribe>";
	}
	
	if (!sendBlacklist && !sendWhitelist)
		return;
	
  body += this.rootElEnd;
  
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * element <settings/>
 */
annotationExtensionChrome.client.sendSettings = function()
{  
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
		
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<settings>';
  body += annotationExtensionChrome.settings.serializeSettings(false);
  body += '</settings>';
  body += this.rootElEnd;

  //alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * element <settings/>
 */
annotationExtensionChrome.client.sendSettingsWithAllSubscriptions = function()
{  
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
		
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<settings>';
  body += annotationExtensionChrome.settings.serializeSettings(true);
  body += '</settings>';
  body += this.rootElEnd;

  //alert(body);
  this.sendMessage(httpRequest, body);
};


/**
 * Element <settings/>
 * @param {elem} settingsElem element s nastavenim
 */
annotationExtensionChrome.client.processSettings = function(settingsElems)
{
	try
	{
		annotationExtensionChrome.settings.processSettings(settingsElems);
	}
	catch(ex)
	{}
};

/**
 * --ZPRAVA--
 * <synchronize/>
 * @param {string} url adresa dokumentu pro synchronizaci
 * @param {string} content obsah dokumentu pro synchronizaci
 * @param {bool} ovewrite zda se ma na serveru prepsat aktualni dokument synchronizovanym
 */
annotationExtensionChrome.client.synchronize = function(url, content, overwrite)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  //Pokud je cela odpoved serveru prijata zavola se odpovidajici funkce na zpracovani prijatych dat
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.SYNC_NAME);
	}
	
	if (overwrite)
		var overwriteStr = "true";
	else
		var overwriteStr = "false";
  
  var body = this.rootElStart;
  body += this.sessionEl();
  //body += '<subscribe><source type="*"/></subscribe>';
  body += '<synchronize resource="'+url+'" overwrite="'+overwriteStr+'">';
  body += '<content><![CDATA['+content+']]></content>';
  body += '</synchronize>';
  body += this.rootElEnd;
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * <disconnect/>
 */
annotationExtensionChrome.client.logout = function()
{
  //TODO:
  //lepe se zaridit, pokud se nejde odhlasit od serveru
  //napr. upozornit uzivatele a "jakoze odhlasit"
  
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  //Pokud je cela odpoved serveru prijata zavola se odpovidajici funkce na zpracovani prijatych dat
  httpRequest.onload = this.processLogoutMessage;
  
  var body = this.rootElStart;
  body += this.sessionEl();
  body += '<logout/>';
  body += '<disconnect/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

/**
 * ++ZPRAVA++
 * <logout/>
 * Vola objekt http requestu
 */
annotationExtensionChrome.client.processLogoutMessage =  function(ev)
{
  //Prijata zprava ze serveru
  try
  {
    var XMLMessage = ev.target.responseXML;
    if(XMLMessage == null)
      throw "badResponse";
    
    if(annotationExtensionChrome.client.isErrorElInResponse(ev.target.responseXML))
      throw "error";
    
    var connectedElem = XMLMessage.getElementsByTagName('ok');
    if (connectedElem.length == 0)
      throw "badResponse";
    else    
      annotationExtensionChrome.user.loggedOff();
  }
  catch(ex)
  {
    //Ve zprave od serveru je element s chybou
    if(ex == "error")
      annotationExtensionChrome.client.processErrorElemInMessage(XMLMessage);
    //Chyba formatovani odpovedi
    else if(ex == "badResponse")
      annotationExtensionChrome.alerts.alert("badResponse");
		
		//Chyba na serveru, presto se "nekorektne" odhlas
		annotationExtensionChrome.user.loggedOff();
  }
};

/**
 * ++ZPRAVA++
 * Pro zpracovani odpovedi od serveru, mimo odpovedi o prihlaseni.
 * @param {responseXML} responseXML, odpoved od serveru
 * @param {String} functionName, pro kterou funkci(ktery pozadavek) se zpracovava odpoved
 * @param {Array} additionalParams
 * @param {Function} callback, pokud je uveden zavola se s prislusnymi parametry
 */
annotationExtensionChrome.client.processResponseMessage =  function(responseXML, functionName, additionalParams, callback)
{
	//var oSerializer = new XMLSerializer();  
	//var sXML = oSerializer.serializeToString(responseXML);
	//alert(sXML);
  //Prijata zprava ze serveru
  var functionNameParam = functionName || null;
	
	try
  {		
    var XMLMessage = responseXML;
    if(XMLMessage == null)
      throw "badResponse";
		
		//Ve zprave je syntax error
    var parseErrorElem = XMLMessage.getElementsByTagName('parsererror');
    if (parseErrorElem.length > 0)
        throw "badResponse";
    
    if(annotationExtensionChrome.client.isErrorElInResponse(XMLMessage))
      throw "error";
		
		if(annotationExtensionChrome.client.isWarningElInResponse(XMLMessage))
			this.processWarningElemInMessage(XMLMessage);
			
		var messagesElem = null;
		for (var i = 0; i <  XMLMessage.childNodes.length; i++)
		{
			if (XMLMessage.childNodes[i].nodeName == 'messages')
				messagesElem = XMLMessage.childNodes[i];			
		}
		if (messagesElem == null)
			 throw "badResponse";

    for (var i = 0; i < messagesElem.childNodes.length; i++)
		{
			var messagesElemChildNode = messagesElem.childNodes[i];
			
			/** synchronized **/
			//var syncElems = messagesElem.getElementsByTagName('synchronized');
			if (messagesElemChildNode.nodeName == 'synchronized')
			{
				if (annotationExtensionChrome.client.processSynchronizeMessage([messagesElemChildNode]) != 0)
					throw "badResponse";
			}
			
			/** types **/
			//var typesElems = messagesElem.getElementsByTagName('types');
			if (messagesElemChildNode.nodeName == 'types')
			{
				if (annotationExtensionChrome.client.processTypesMessage([messagesElemChildNode], callback) != 0)
					throw "badResponse"
			}
			
			/** persons **/
			//var personsElems = messagesElem.getElementsByTagName('persons');
			if (messagesElemChildNode.nodeName == 'persons')
			{
				if (functionName == annotationExtension.QUERY_LOGGED_USER_RESPONSE)
				{
					if (annotationExtensionChrome.client.processLoggedUser([messagesElemChildNode]) != 0)
						throw "badResponse"
				}
				else
				{
					if (annotationExtensionChrome.client.processPersons([messagesElemChildNode]) != 0)
						throw "badResponse"
				}
			}		
			
			/** groups **/
			//var groupsElems = messagesElem.getElementsByTagName('userGroups');
			if (messagesElemChildNode.nodeName == 'userGroups')
			{
				if (annotationExtensionChrome.client.processUserGroupsMessage([messagesElemChildNode], additionalParams[0]) != 0)
					throw "badResponse"
			}
			
			/** settings **/
			//var settingsElems = messagesElem.getElementsByTagName('settings');
			if (messagesElemChildNode.nodeName == 'settings')
			{
				annotationExtensionChrome.client.processSettings([messagesElemChildNode]);
			}
			
			/** annotations **/
			//var annotsElems = messagesElem.getElementsByTagName('annotations');
			if (messagesElemChildNode.nodeName == 'annotations')
			{
				var parser = new AnnotParser();
				var annotChanges = parser.parseAnnotationsResponse(messagesElemChildNode);
	
				annotationExtensionChrome.annotationsView.showAnnotations(annotChanges);
			}
			
			/** suggestions **/
			if (messagesElemChildNode.nodeName == 'suggestions')
			{
				var parser = new AnnotParser();
				var annotChanges = parser.parseSuggestionsResponse(messagesElemChildNode);
				
				annotationExtensionChrome.annotationsView.showAnnotations(annotChanges);
			}
			
			/** attrsFromOntology **/
			if (messagesElemChildNode.nodeName == 'attrsFromOntology')
			{
				if (annotationExtensionChrome.client.processAttrsFromOntologyMessage(messagesElemChildNode) != 0)
					throw "badResponse"
			}
	
			/** OK **/
			//var okElems = messagesElem.getElementsByTagName('ok');
			if (messagesElemChildNode.nodeName == 'ok')
			{
				if (functionName != undefined && functionName != null)
					annotationExtensionChrome.client.processOkElems(functionName, additionalParams);
			}
		}
  }
  catch(ex)
  {
    //Ve zprave od serveru je ELEMENT s chybou
    if(ex == "error")
		{
      annotationExtensionChrome.client.processErrorElemInMessage(XMLMessage, functionNameParam);
		}
    //Chyba formatovani odpovedi
    else if(ex == "badResponse")
		{
			if (functionNameParam == annotationExtension.SYNC_NAME)
			{//Specialni pripad
				annotationExtensionChrome.document.errorOccured([annotationExtension.constants.ERROR_1000_BADMESSAGE, null]);
			}
			else
			{
				annotationExtensionChrome.alerts.alert("badResponse");
			}
		}
		else if(ex == "parseError")
		{
			if (functionNameParam == annotationExtension.SYNC_NAME)
			{//Specialni pripad
				annotationExtensionChrome.document.errorOccured([annotationExtension.constants.ERROR_1000_BADMESSAGE, null]);
			}
			else
			{
				annotationExtensionChrome.alerts.alert("parseError");	
			}
			
		}
		else
			alert('client.js : processResponseMessage: \n' + ex.message);
  }
};

/**
 * Element <ok/>
 */
annotationExtensionChrome.client.processOkElems = function(functionName, additionalParams)
{
  if (functionName == annotationExtension.SEND_ANNOTATIONS_OK)
  {
    annotationExtensionChrome.bottomAnnotationWindow.annotationsSaved();
  }
	
  if (functionName == annotationExtension.REMOVE_ANNOTATIONS_OK)
  {
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    var text = stringBundle.getString("annotationextension.messages.annotationsRemoved");
		
    annotationExtensionChrome.statusBar.showMessage(text, 3000, annotationExtension.STATUSBAR_MESSAGE_COLOR);
  }
	
	if (functionName == annotationExtension.JOIN_GROUP_OK)
  {
		//Prisla zprava ok, uzivatel je uspesne prihlasen ke skupine
		  var groupURI = additionalParams[0];
      annotationExtensionChrome.settings.joinGroup(groupURI);
  }
	
	if (functionName == annotationExtension.LEAVE_GROUP_OK)
  {
		//Prisla zprava ok, uzivatel je uspesne prihlasen ke skupine
		  var groupURI = additionalParams[0];
			annotationExtensionChrome.settings.leaveGroup(groupURI);
  }
};

/**
 * Element <synchronized/>
 * @param {elem} syncElems element synchronized
 * @return {int} 0, pokud se zprava podarila projit, jinak -1
 */
annotationExtensionChrome.client.processSynchronizeMessage = function(syncElems)
{
  if(syncElems[0].hasAttribute('resource'))
  {
    annotationExtensionChrome.document.setSync(syncElems[0].getAttribute('resource'));

    let observerService = Cc["@mozilla.org/observer-service;1"].
      getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "annotationextension-docSynchronized-topic", "ok");
    return 0;
  }
  else
    return -1;
};

/**
 * --ZPRAVA--
 * <types/>
 * @param {string} filter filter, ktery je obsazen v elementu <types/>
 */
annotationExtensionChrome.client.queryTypes = function(filter)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
  {
    annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
  }
  
  var fil = "";
  if (filter == undefined || filter == "")
    fil = "*";
  else
    fil = filter;
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<queryTypes filter="'+fil+'"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

/**
 * Element <types/>
 * @param {elem} message element s typy
 * @param {Function} callback, ma vyznam pro autocomplete
 * @return {int} 0, pokud se zprava podarila projit
 */   
annotationExtensionChrome.client.processTypesMessage = function(typesElems, callback)
{
	//pro callback
	var addedTypes = [];
	var removedTypes = [];
  
	/////////////////////////////
  ///  ADD a CHANGE types.  ///
  /////////////////////////////
  for (var z = 0; z < 2; z++)
  {
    if (z == 0)
      var addOrChangeElem = typesElems[0].getElementsByTagName('add');
    else
      var addOrChangeElem = typesElems[0].getElementsByTagName('change');

    if (addOrChangeElem.length > 0)
    {    
      var typeElems = addOrChangeElem[0].getElementsByTagName('type');
  	
      for(var i = 0; i < typeElems.length; i++)
      {
        if (!typeElems[i].hasAttribute('name') ||
            !typeElems[i].hasAttribute('uri') ||
  	        !typeElems[i].hasAttribute('ancestor'))
          //Typ neobsahuje povinne polozky, preskoc typ
          continue;
        
				var primaryAncestor = typeElems[i].getAttribute('ancestor');
				
        var group = ""; 
        if(typeElems[i].hasAttribute('group'))
	        group = typeElems[i].getAttribute('group');
  			
				////////////////////////////////////////////////////////////////////////
				//VICE PREDKU		
        var ancestors = [];
        var ancestorsElems = typeElems[i].getElementsByTagName('ancestor');
        for (var j = 0; j < ancestorsElems.length; j++)
        {
	        var ancestor = ancestorsElems[j];
	        if (!ancestorsElems[j].hasAttribute('uri'))
	          continue;
  	      
					var ancestorUri = ancestorsElems[j].getAttribute('uri');
					//if (primaryAncestor == ancestorUri)
						//continue;
					
	        ancestors.push(ancestorUri);
        }
				//
				////////////////////////////////////////////////////////////////////////
				////////////////////////////////////////////////////////////////////////
				//KOMENTAR
				var commentElem = typeElems[i].getElementsByTagName('comment');
				var comment = "";
				if(commentElem.length > 0)
				{
					if(commentElem[0].hasChildNodes)
					{
						var childComment = commentElem[0].firstChild;
						
						while (childComment != null)
						{
							if (childComment.nodeType === 4) //CDATA
							{
								comment = (childComment.nodeValue);
								break;
							}
							childComment = childComment.nextSibling;
						}
					}
				}
				////////////////////////////////////////////////////////////////////////
  	
        var type = new annotationExtensionChrome.type(
	        typeElems[i].getAttribute('name'),
	        primaryAncestor,
	        typeElems[i].getAttribute('uri'),
	        group,
	        ancestors,
					comment);
	
  	
				//Precteni vsech atributu typu
				var attrElem = typeElems[i].getElementsByTagName('a:attribute')
				for (var j = 0; j < attrElem.length; j++)
				{
					if (!attrElem[j].hasAttribute('name') ||
							!attrElem[j].hasAttribute('type'))
						//Atribut neobsahuje povinne polozky, preskoc atribut
						continue;
								
					var required;
					if (attrElem[j].hasAttribute('required'))
						required = attrElem[j].getAttribute('required');
					else
						required = 'false';
			
					var struct;
					if (annotationExtension.attrConstants.isSimple(attrElem[j].getAttribute('type')))
						struct = 'false';
					else
						struct = 'true';
						
					//KOMENTAR
					var attrCommentElem = attrElem[j].getElementsByTagName('a:comment');
					var attrComment = "";
					if(attrCommentElem.length > 0)
					{
						if(attrCommentElem[0].hasChildNodes)
						{
							var childComment = attrCommentElem[0].firstChild;
							
							while (childComment != null)
							{
								if (childComment.nodeType === 4) //CDATA
								{
									attrComment = (childComment.nodeValue);
									break;
								}
								childComment = childComment.nextSibling;
							}
						}
					}
			
					type.addAttribute(
					attrElem[j].getAttribute('name'),
					attrElem[j].getAttribute('type'),
					'true',
					required,
					struct,
					attrComment);
        }			
				
				addedTypes.push(type);
        annotationExtensionChrome.types.addNew(type);
      }
		
			annotationExtensionChrome.bottomAnnotationWindow.addTypes(callback);
    }
  }
  /////////////////////////////
  ///    REMOVE types       ///
  /////////////////////////////
  var removeElem = typesElems[0].getElementsByTagName('remove');
  
  if (removeElem.length > 0)
  {    
    var typeElems = removeElem[0].getElementsByTagName('type');

    for(var i = 0; i < typeElems.length; i++)
    {
      if (!typeElems[i].hasAttribute('name') ||
				!typeElems[i].hasAttribute('uri') ||
				!typeElems[i].hasAttribute('ancestor'))
				//Typ neobsahuje povinne polozky, preskoc typ
				continue;

      var type = new annotationExtensionChrome.type(
        typeElems[i].getAttribute('name'),
        typeElems[i].getAttribute('ancestor'),
        typeElems[i].getAttribute('uri'),
        "",
				null,
				"");
			
			removedTypes.push(type);
      annotationExtensionChrome.deletedTypes.addNew(type);
    }
		
		annotationExtensionChrome.bottomAnnotationWindow.deleteTypes();
  }
  
  return 0;
};

/**
 * --ZPRAVA--
 * <queryUserGroups/>
 * @param {string} filter filter, ktery je obsazen v elementu <queryUserGroups/>
 */
annotationExtensionChrome.client.queryUserGroups = function(filter)
{  
  var fil;
  if (filter == undefined || filter == "")
    fil = "*";
  else
    fil = filter;

	var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
  {
    annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, null, [fil]);
  }

  var body = this.rootElStart;
  body += this.sessionEl();
    body += '<queryUserGroups filter="'+fil+'"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

/**
 * Element <userGroups/>
 * @param {elem} message element se skupinami
 * @param {String} filter, filtr, ktery se pouzil u queryUserGroups
 * @return {int} 0, pokud se zprava podarila projit, jinak -1
 */
annotationExtensionChrome.client.processUserGroupsMessage = function(groupsElems, filter)
{
  return annotationExtensionChrome.settings.processGroups(groupsElems, filter);
};

/**
 * --ZPRAVA--
 * <queryPersons filter="userid" withGroups="true"/>
 */
annotationExtensionChrome.client.queryLoggedUser = function()
{  
	var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
  {
    annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.QUERY_LOGGED_USER_RESPONSE);
  }

  var body = this.rootElStart;
  body += this.sessionEl();
    body += '<queryPersons filter="'+annotationExtension.user.userID+'" withGroups="true"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

annotationExtensionChrome.client.processLoggedUser = function(usersElem)
{
	var personElems = usersElem[0].getElementsByTagName('person');	
		
  for(var i = 0; i < personElems.length; i++)
  {
		var personElem = personElems[i];
		
    if (!personElem.hasAttribute('id'))
      continue;
			
		if (personElem.getAttribute('id') == annotationExtension.user.userID)
		{
			var userGroupsElems = personElem.getElementsByTagName('userGroups');
			if (userGroupsElems.length > 0)
			{
				annotationExtensionChrome.settings.processLoggedGroups(userGroupsElems);
			}
		}
	}
  
  return 0;
};

/**
 * --ZPRAVA--
 * <queryPersons/>
 */
annotationExtensionChrome.client.queryPersons = function(filterP, withGroupsP)
{
	var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
  {
    annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
  }
	
	var fil = "";
  if (filterP == undefined || filterP == "")
    fil = "*";
  else
    fil = filterP;
		
  if (withGroupsP == undefined || withGroupsP == false || withGroupsP == "false")
    var withGroups = "false";
  else
    var withGroups = "true";

  var body = this.rootElStart;
  body += this.sessionEl();
    body += '<queryPersons filter="'+fil+'" withGroups="'+withGroups+'"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

annotationExtensionChrome.client.processPersons = function(personsElem)
{
	return annotationExtensionChrome.settings.processPersons(personsElem);
};

/**
 * --ZPRAVA--
 * Element <join/>
 * @param {string} groupURI uri skupiny, ke ktere se chceme prihlasit 
 */
annotationExtensionChrome.client.joinGroup = function(groupURIP)
{
	var groupURI = groupURIP;
	
  if (groupURI == undefined || groupURI == null || groupURI == "")
    return;
  
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
	httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.JOIN_GROUP_OK, [groupURI]);
	}
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<join group="'+groupURI+'"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * Element <leave/>
 * @param {string} groupURI uri skupiny, od ktere se chceme odhlasit
 */
annotationExtensionChrome.client.leaveGroup = function(groupURIP)
{
	var groupURI = groupURIP;
	
  if (groupURI == undefined || groupURI == null || groupURI == "")
    return;
  
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
	httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.LEAVE_GROUP_OK, [groupURI]);
	}
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<leave group="'+groupURI+'"/>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};


/**
 * --ZPRAVA--
 * Element <types>
 *          <add/>
 *         </types>
 * @param {Array of annotationExtensionChrome.type} types, typy na pridani
 * @param {Function} callback, ma u autocomplete (musi byt upozornen pote, co byly typy klientem ulozeny)
 */
annotationExtensionChrome.client.addTypes = function(types, callback)
{
	if (types.length <= 0)
	//Neni co odeslat
		return;
	
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
	httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, null, null, callback);
	}
	
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<types><add>';
  
  //ULOZENE TYPY PROGRAMEM PRO ODESLANI NA SERVER
  while(types.length > 0)
  {
    var type = types.shift();
    body += '<type ';
    body += 'name="'+type.name+'" ';
    body += 'ancestor="'+type.ancestor+'" ';
    body += 'uri="'+type.uri+'" ';
    if (type.group.length > 0)
      body += 'group="'+type.group+'" ';
    body += '>'
    body += '</type>';
  }
  
  body += '</add></types>';
  body += this.rootElEnd;
  
  //alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * Element <types>
 *          <remove/>
 *         </types>
 */
annotationExtensionChrome.client.removeTypes = function()
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<types><remove>';
  
  //ULOZENE TYPY PROGRAMEM PRO ODESLANI NA SERVER
  while(annotationExtensionChrome.deleteTypes.count > 0)
  {
    var type = annotationExtensionChrome.deleteTypes.shift();
    body += '<type ';
    body += 'name="'+type.name+'" ';
    body += 'ancestor="'+type.ancestor+'" ';
    body += 'uri="'+type.uri+'" ';
    if (type.group.length > 0)
      body += 'group="'+type.group+'" ';
    body += '>'
    body += '</type>';
  }
  
  body += '</remove></types>';
  body += this.rootElEnd;
  
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * Element <types>
 *          <change/>
 *         </types>
 * @param {aeArray} changedTypes pole typy s atributy, ktere se odeslou na server
 */
annotationExtensionChrome.client.changeTypes = function(changedTypes)
{
  //Zadne typy se nezmenily
  if (changedTypes.count < 1)
    return;
  
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}

  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<types><change>';
  
  //ULOZENE TYPY PROGRAMEM PRO ODESLANI NA SERVER
  while(changedTypes.count > 0)
  {
    var type = changedTypes.shift();
		if (type == null)
			continue;
    body += '<type ';
    body += 'name="'+type.name+'" ';
    body += 'ancestor="'+type.ancestor+'" ';
    body += 'uri="'+type.uri+'" ';
    if (type.group.length > 0)
      body += 'group="'+type.group+'" ';
    body += '>'
		
		//Atributy
    while(type.hasAttribute())
    {//Pridani atributu.
      attribute = type.attributes.shift();
      body += '<attribute name="'+attribute[0]+'" type="'+attribute[1]+'" required="'+attribute[3]+'">';
			
			if (attribute[5] != undefined && attribute[5] != null && attribute[5] != "")
			{
				body += '<comment><![CDATA['+attribute[5]+']]></comment>';
			}
			
			body += '</attribute>';
    }
		
		//Vice predku
		if (Array.isArray(type.ancestorsArray))
		{
			for (var i = 0; i < type.ancestorsArray.length; i++)
			{
				body += '<ancestor uri="'+type.ancestorsArray[i]+'"/>';
			}
		}
		
		//Komentar typu
		if (type.comment != undefined && type.comment != null && type.comment != "")
		{
			body += '<comment><![CDATA['+type.comment+']]></comment>';
		}
		
    body += '</type>';
  }
  
  body += '</change></types>';
  body += this.rootElEnd;
  
  //alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * ZASLANI ANOTACE NA SERVER
 * @param {Array} annotationsXML, pole anotaci ktere se maji poslat na server ve formatu XML
 */
annotationExtensionChrome.client.sendAnnotations = function(annotationsXML)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.SEND_ANNOTATIONS_OK);
	}

  var body = '<?xml version="1.0" encoding="utf-8" ?>';
  body += '<messages xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\
  xmlns:a="http://nlp.fit.vutbr.cz/annotations/AnnotXMLSchema">';
  body += this.sessionEl();
	body += '<annotations>';
  body += '<add>';
	for (var i = 0; i < annotationsXML.length; i++)
	{
		body += '<annotation>';
		body += annotationsXML[i];
		body += '</annotation>';
	}
  body += '</add>';
  body += '</annotations>';
  body += '</messages>';
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * POTVRZENI NABIDNUTE ANOTACE NA SERVER PO EDITACI
 * @param {Array} annotationsXML, pole anotaci ktere se maji poslat na server ve formatu XML
 * @param {String} tmpId, tmpId, ktere se vlozi ke kazde anotaci
 */
annotationExtensionChrome.client.confirmSuggestionManuallyEdited = function(annotationsXML, tmpId)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.SEND_ANNOTATIONS_OK);
	}

  var body = '<?xml version="1.0" encoding="utf-8" ?>';
  body += '<messages xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\
  xmlns:a="http://nlp.fit.vutbr.cz/annotations/AnnotXMLSchema">';
  body += this.sessionEl();
	body += '<annotations>';
  body += '<add>';
	for (var i = 0; i < annotationsXML.length; i++)
	{
		body += '<annotation tmpId="'+tmpId+'" confirmed="manuallyEdited">';
		body += annotationsXML[i];
		body += '</annotation>';
	}
  body += '</add>';
  body += '</annotations>';
  body += '</messages>';
	
	alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * ZASLANI ANOTACE K EDITACI NA SERVER
 * @param {string} annotationsXML, anotace ktere se maji poslat na server ve formatu XML
 */
annotationExtensionChrome.client.changeAnnotations = function(annotationsXML)
{	
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.SEND_ANNOTATIONS_OK);
	}
  
  var body = '<?xml version="1.0" encoding="utf-8" ?>';
  body += '<messages xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\
  xmlns:a="http://nlp.fit.vutbr.cz/annotations/AnnotXMLSchema">';
  body += this.sessionEl();
	body += '<annotations>';
  body += '<change>';
	for (var i = 0; i < annotationsXML.length; i++)
	{
		body += '<annotation>';
		body += annotationsXML[i];
		body += '</annotation>';
	}
  body += '</change>';
  body += '</annotations>';
  body += '</messages>';
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * ZASLANI ANOTACI K ODSTRANENI NA SERVER
 * @param {Array} obsahuje id s anotacemi k odstraneni
 */
annotationExtensionChrome.client.removeAnnotations = function()
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML, annotationExtension.REMOVE_ANNOTATIONS_OK);
	}
  
  var body = '<?xml version="1.0" encoding="utf-8" ?>';
  body += '<messages xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\
  xmlns:a="http://nlp.fit.vutbr.cz/annotations/AnnotXMLSchema">';
  body += this.sessionEl();
	body += '<annotations>';
  body += '<remove>';
	
	var removeAnnotations = annotationExtensionChrome.removedAnnotations;
	
	while(removeAnnotations.length > 0)
  {
    var annotID = removeAnnotations.shift();
		
		body += '<annotation>';
		body +=  '<rdf:Description rdf:about="'+annotID+'">';
		body +=  '</rdf:Description>';
		body += '</annotation>';
	}
	
  body += '</remove>';
  body += '</annotations>';
  body += '</messages>';
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * ZASLANI POZADVKU NABIZENI ANOTACI
 * @param {Array of fragments} fragments, pole fragmentu, pro ktere chci nabidky
 * @param {String} typeURI, typ nabizenych anotaci
 */
annotationExtensionChrome.client.suggestAnnotations = function(fragments, typeURI)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
  
  var body = this.rootElStart;
  body += this.sessionEl();
	var fragsLen = fragments.length;
	for (var i = 0; i < fragsLen; ++i)
	{
		var frag = fragments[i];
		
		body += '<suggestAnnotations path="'+frag.xpath+'"';
		if (frag.offset != null && frag.offset != undefined)
			body += ' offset="'+frag.offset+'"';
		if (frag.length != null && frag.length != undefined)
			body += ' length="'+frag.length+'"';
		if (typeURI != null && typeURI != undefined)
			body += ' type="'+typeURI+'"';
		body += '/>';
		
	}	
  body += this.rootElEnd;
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * ODMITNUTI NABIDNUTYCH ANOTACI
 * @param {Array of String} tmpId, pole s tmpId nabidnutych anotaci
 * @param {String} methodP, dle specifikace protokolu "manually" (defaultni) nebo "automatically" 
 */
annotationExtensionChrome.client.refusedSuggestions = function(tmpId, methodP)
{
	var method = methodP || "manually";
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<refusedSuggestions>';
	for (var i = 0; i < tmpId.length; i++)
	{
		body += '<suggestion tmpId="'+tmpId[i]+'" method="'+method+'"/>';
	}
	body += '</refusedSuggestions>';
  body += this.rootElEnd;
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * POTVRDI (ULOZI) NABIDNUTOU ANOTACI
 * @param {annotationXML}
 * @param {String} tmpId, tmpId nabidnute anotace
 */
annotationExtensionChrome.client.confirmSuggestionManually = function(annotationXML, tmpId)
{	
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}

  var body = '<?xml version="1.0" encoding="utf-8" ?>';
  body += '<messages xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\
  xmlns:a="http://nlp.fit.vutbr.cz/annotations/AnnotXMLSchema">';
  body += this.sessionEl();
	body += '<annotations>';
  body += '<add>';
	  body += '<annotation tmpId="'+tmpId+'" confirmed="manually">';
		body += annotationXML;
		body += '</annotation>';
  body += '</add>';
  body += '</annotations>';
  body += '</messages>';
	
	//alert(body);
  this.sendMessage(httpRequest, body);
};

/**
 * --ZPRAVA--
 * <queryAttrFromOnto group=""/>
 * @param {String} group, zazada o atributy prislusejici k dane skupine
 *                        muze byt "*"
 */
annotationExtensionChrome.client.getOntologyAttrs = function(group)
{
  var httpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  httpRequest.onload = function(ev)
	{
		annotationExtensionChrome.client.processResponseMessage(ev.target.responseXML);
	}
  
  var body = this.rootElStart;
  body += this.sessionEl();
	body += '<queryAttrFromOnto group="'+group+'"/>';
  body += this.rootElEnd;
	
	//alert(body);
	this.sendMessage(httpRequest, body);
};

/**
 * ++ZPRAVA++
 * Element <attrsFromOntology/>
 * @param {elem} attrsFromOntoElem element s atributy
 */   
annotationExtensionChrome.client.processAttrsFromOntologyMessage = function(attrsFromOntoElem)
{
  var oSerializer = new XMLSerializer();  
	var sXML = oSerializer.serializeToString(attrsFromOntoElem);

	var attrElems = attrsFromOntoElem.getElementsByTagName('a:attribute');
	
	for (var i = 0; i < attrElems.length; ++i)
	{
		var attrElem = attrElems[i];
		
		if (!attrElem.hasAttribute('name') ||
        !attrElem.hasAttribute('type') ||
				!attrElem.hasAttribute('group'))
          continue;
			
    var attr = { name : attrElem.getAttribute('name'),
								 type : attrElem.getAttribute('type'),
								 group : attrElem.getAttribute('group')};
								 
		attr.linearizedType = annotationExtension.functions.linearTypeURI(attr.type);		 
    attr.uri = attr.name;
								 
		var commentElem = attrElem.getElementsByTagName('comment');
		var comment = "";
		if(commentElem.length > 0)
		{
			if(commentElem[0].hasChildNodes)
			{
				var childComment = commentElem[0].firstChild;
				
				while (childComment != null)
				{
					if (childComment.nodeType === 4) //CDATA
					{
						comment = (childComment.nodeValue);
						break;
					}
					childComment = childComment.nextSibling;
				}
			}
		}
		
		attr.comment = comment;
		
		annotationExtensionChrome.attrsFromOntology.push(attr);		
	}
	
	let observerService = Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  observerService.notifyObservers(null, "annotationextension-client-topic", "addAttrsFromOntology");
  
  return 0;
};

//Konstruktor
(function() { this.init(); }).apply(annotationExtensionChrome.client);