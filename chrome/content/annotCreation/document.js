/**
 * Soubor: document.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Nekolik funkci pro synchronizaci dokumetu(webove stranky).
 * Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.document =
{
  locationSynchronized : false,         /**< Zda je dokument synchronizovany.
                                             Nastavi se po prijeti zpravy od serveru.*/
  syncURI      : "",    /**< Synchronizovana URI dokumentu. */
  syncLocation : "",    /**< "Adresa" dokumentu, ktery byl synchronizovan. */ 
  
  /**
   * Nastavuje klient, ze synchronizace probehla ok.
   * @param {string} uri URI prijate od serveru
   */
  setSync : function(uri)
  {
    this.syncURI = uri;
    this.locationSynchronized = true;
  },
  
  /**
   * @returns {string} vrati synchronizovanou adresu dokumentu
   */
  getResource : function()
  {
    return this.syncResource;
  },
  
  /**
   * @returns {string} adresu aktivniho dokumentu v okne
   */
  getDocumentLocation : function()
  {
    return window.content.location;
  },
  
  /**
   * @returns {string} obsah aktivniho dokumentu v okne
   */
  getDocumentContent : function()
  {
    var page = window.content.document;
    /**
     * TODO:
     * TOTO JE SPRAVNA VERZE, KTEROU SERVER NEZVLADA
     */
    var domSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
      .createInstance(Components.interfaces.nsIDOMSerializer);
     
    return domSerializer.serializeToString(page);
  },
  
  /**
   * Provede synchronizaci dokumentu se serverem
   * @param {bool} ovewrite zda se ma na serveru prepsat aktualni dokument synchronizovanym
   */
  sync : function(overwrite)
  {
    this.clearSaveAnnotButtonOnClickPanel();
    this.locationSynchronized = false;
    this.syncLocation = this.getDocumentLocation();
    annotationExtensionChrome.client.synchronize(this.getDocumentLocation(), this.getDocumentContent(), overwrite);
  },
  
  /**
   * Vola se v destroy annotationExtensionChrome.bottomAnnotationWindow
   */
  clear : function()
  {
    this.locationSynchronized = false;
    this.syncURI      = "";
    this.syncLocation = "";
  },
  
  getSaveAnnotButton : function()
  {
    return document.getElementById('aeSaveButtonRed');
  },
  
  
  errorOccured : function(errorNo, errorString)
  {
    annotationExtensionChrome.infoPanel.create('aeDocumentStatusPanel', 'slow', null, this.getErrorString('annotationextension.document.syncError'), null);
    annotationExtensionChrome.infoPanel.show('aeDocumentStatusPanel', this.getSaveAnnotButton());
		
		if (!annotationExtensionChrome.infoPanel.exists('aeResolveSyncPanel'))
		{
			annotationExtensionChrome.infoPanel.create('aeResolveSyncPanel', 'none', null, null, 'aeFileBrokenImage', true);
		}
		
		this.setContetToResolveSyncPanelByError(errorNo, errorString);
    this.setToSaveAnnotButtonOnClickPanel();
  },
  
  getErrorString : function(stringName)
  {
    let stringBundle = document.getElementById("annotationextension-string-bundle");
		var localizedString = stringBundle.getString(stringName);
    
    return localizedString;
  },
  
  setToSaveAnnotButtonOnClickPanel : function()
  {
    var saButton = this.getSaveAnnotButton();
    saButton.setAttribute('onclick', 'annotationExtensionChrome.infoPanel.show("aeResolveSyncPanel", "aeSaveButtonRed");');
  },
  
  clearSaveAnnotButtonOnClickPanel : function()
  {
    var saButton = this.getSaveAnnotButton();
    saButton.setAttribute('onclick', '');
  },
	
	////////////////////////////////////////////////////////////////////////////////
  
  setContetToResolveSyncPanelByError : function(errorNo, errorString)
  {
		annotationExtensionChrome.infoPanel.deleteMisc('aeResolveSyncPanel');
		
		if (errorNo == annotationExtension.constants.ERROR_9_SYNC_FAILED
				|| errorNo == annotationExtension.constants.ERROR_62_SYNC_DOC_OPENED)
    {
      var errorMessageTitle = this.getErrorString('annotationextension.document.syncErrorTitle');
      //TODO: DODELAT
			annotationExtensionChrome.infoPanel.setInfo('aeResolveSyncPanel', errorMessageTitle, errorString);
			
			let stringBundle = document.getElementById("annotationextension-string-bundle");
    	var box = document.createElement("vbox");
			
			var confButton = document.createElement("button");
			confButton.setAttribute("label", stringBundle.getString("annotationextension.document.confirmOverwriteButton.label"));
			confButton.setAttribute("tooltiptext", stringBundle.getString("annotationextension.document.confirmOverwriteButton.tooltip"));
			confButton.setAttribute("oncommand", "annotationExtensionChrome.infoPanel.hide('aeResolveSyncPanel');\
															annotationExtensionChrome.bottomAnnotationWindow.initSyncForCurrentBrowser(true);");
			
			var buttonBox = document.createElement("hbox");
				var buttonSpacer = document.createElement("spacer");
					buttonSpacer.setAttribute('flex', '1');
				buttonBox.appendChild(buttonSpacer);
				buttonBox.appendChild(confButton);
			
			var textDesc = document.createElement('description');
			textDesc.setAttribute('style', 'max-width: 600px;');
      textDesc.textContent = stringBundle.getString("annotationextension.document.overwriteSync");

			box.appendChild(textDesc);
			box.appendChild(buttonBox);
			
			annotationExtensionChrome.infoPanel.setMisc('aeResolveSyncPanel', box);			
    }
		else if (errorNo == annotationExtension.constants.ERROR_10_SYNC_FORC ||
						 errorNo == annotationExtension.constants.ERROR_11_SYNC_ERR)
    {
      var errorMessageTitle = this.getErrorString('annotationextension.document.syncErrorTitle');
			annotationExtensionChrome.infoPanel.setInfo('aeResolveSyncPanel', errorMessageTitle, errorString);
    }
	  else if (errorNo == annotationExtension.constants.ERROR_1000_BADMESSAGE)
    {
      var errorMessageTitle = this.getErrorString('annotationextension.document.syncErrorTitle');
      var badMassageString = this.getErrorString('annotationextension.document.syncErrorBadMessage');
			annotationExtensionChrome.infoPanel.setInfo('aeResolveSyncPanel', errorMessageTitle, badMassageString);
    }
    else
    {
      var errorMessageTitle = this.getErrorString('annotationextension.document.syncErrorTitle');
      var badMassageString = this.getErrorString('annotationextension.document.unknownError');
			annotationExtensionChrome.infoPanel.setInfo('aeResolveSyncPanel', errorMessageTitle, badMassageString);
    }
  }
}
