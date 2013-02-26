/**
 * Soubor: browserOverlay.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: "Hlavni objekt" pro zobrazeni anotaci, inicializace zobrazeni anotaci
 * Posledni uprava: 5.6.2012
 */

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Start of: CLASS Statusbar                                                   //
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
annotationExtensionChrome.annotationsView = 
{
	ANNOTATIONS : null,       /**< Databaze anotaci, ktere se zobrazuji v dokumentu. */
	
	turnOn : function()
	{
		this.ANNOTATIONS = new AnnotationsDB();
		this.initGWinGDoc();
	},
	
	turnOff : function()
	{	
		//clean window from anotations
		this.deleteAnnotations();
	},
	
	/**
	 * Inicicializace objektu pro zobrazeni anotaci v novem dokumentu
	 */
	initForNewDocument : function()
	{

			var aeView = annotationExtensionChrome.annotationsView;
			//Smazani anotaci ze stranky - smaze anotace z naposledy zobrazeneho dokumentu/stranky.
			//TODO: tato funkce se muze snazit smazat fragmenty ze stranky, ktera "tam" byla predtim
			//-> fragmenty nejsou k dispozici, potom funkce removeFragments haze vyjimku pri getElementsByName(id)
			//viz removeFragments... opravit? 
			aeView.deleteAnnotations();
		
			aeView.ANNOTATIONS = new AnnotationsDB();
			aeView.initGWinGDoc();
	},
	
	/**
	 * Smaze vsechny anotace
	 */
	deleteAnnotations : function()
	{
		//Smazani anotaci ve strance(podbarveni - spany)
		this.deleteAnnotationsFromDoc();
		
		//Smazani panelu anotaci
		removeChildrens(document.getElementById('aePanels'));
		
		//Smazani vseho, co je v bocnim panelu (pokud tam neco zustalo)	
		var sidebarDocument = document.getElementById("sidebar").contentDocument;
    if (isAnnotationSidebarActive(sidebarDocument))
    {
      var sideBarAnnotBox = sidebarDocument.getElementById("aeDocumentAnnotationsBox");
			removeChildrens(sideBarAnnotBox);
		}
		
		var aeView = annotationExtensionChrome.annotationsView;
		aeView.ANNOTATIONS = new AnnotationsDB();
	},
	
	/**
	 * Smaze <spany/> anotaci
	 */
	deleteAnnotationsFromDoc : function()
	{
		//Smazani anotaci ve strance(podbarveni - spany)
		var aeView = annotationExtensionChrome.annotationsView;
		$.each(aeView.ANNOTATIONS.annotations, function(ind, annotation) {removeAnnotationFromDoc(annotation, aeView.frame_doc);} );
	},
	
	/**
	 * Zobrazi anotace na strance
	 */
	showAnnotations : function(annotChanges)
	{		
		try
		{
			injectFnDispatch(this.frame_win);

			//changes (add, update, delete) will apply and records will add to this.ANNOTATIONS
			applyChanges(annotChanges, this.ANNOTATIONS, this.frame_doc);
		}
		catch(ex)
		{
			alert(ex.message);
		}
	},
	
	frame_doc : undefined,
	frame_win : undefined,

	initGWinGDoc : function()
	{
		var WindowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
    var browser = WindowMediator.getMostRecentWindow('navigator:browser');
    var mainTabs = browser.document.getElementById('content');
		
		this.frame_doc = mainTabs.contentDocument;
		this.frame_win = mainTabs.contentWindow;
	}
};

/**
	* Udalosti uvolnovane predevsim anotovanymi texty - pro zobrazeni/skryti panelu s anotaci
	*/
function dispatch(element,eventText)
{
	var evt = document.createEvent("Events");
	evt.initEvent(eventText, true, false);
	element.dispatchEvent(evt);
};

function injectFnDispatch(frame_win)
{
	var dispatch = function(element,eventText)
	{
		var evt = document.createEvent("Events");
		evt.initEvent(eventText, true, false);
		element.dispatchEvent(evt);
	}
	
	frame_win.wrappedJSObject.dispatch = dispatch;
};

//Pridani naslouchani udalosti, ktere jsou vyvolany pri najeti mysi nad anotovany text/pryc z anotovaneho textu/kliknuti na anotovany text - umozni zobrazeni/skryti panelu s anotacemi
document.addEventListener("ShowAPanelEvent", ShowAPanelEventListener, false, true); //last parameter allows unsecured content to trigger this
document.addEventListener("HideAPanelEvent", HideAPanelEventListener, false, true);
document.addEventListener("OpenAPanelEvent", OpenAPanelEventListener, false, true);