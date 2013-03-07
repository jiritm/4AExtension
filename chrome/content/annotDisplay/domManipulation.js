/**
 * Soubor: domManipulation.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce predevsim pro manipulaci s dom, vkladani fragmentu do dokumentu
 *        vkladani anotaci, funkce pro praci s odkazovanymi anotacemi... 
 * Posledni uprava: 5.6.2012
 */

/**
 * @returns {String} Vrati XPath bez posledniho /text
 */
function getAncestorXPathForTextNodeXPath(xpath)
{
    var textRegExp = /\/text\(\).*/i;
    return xpath.replace(textRegExp, "");  //XPath bez /text()...
}

/**
 * @returns {node} Vrati uzel z xpath
 */
function getElementFromDoc(xpath, frame_doc)
{      
    var nodes = frame_doc.evaluate(xpath, frame_doc, null, XPathResult.ANY_TYPE, null);
    var fragmentNode = nodes.iterateNext();    //Uzel dany XPath-em fragmentu

    if (!fragmentNode || fragmentNode.nodeType != Node.ELEMENT_NODE)
    //Uzel nenalezen
		  return null
    else
      return fragmentNode;
}

/**
 * @returns {String} innerHTML uvnitr uzlu node
 */
function getElementText(node)
{
		try
		{
				var ser = new XMLSerializer();
				var currentNode = node.firstChild;
				var nodeList = [];
				var text = "";
        
				while (currentNode != null)
				{
						text += ser.serializeToString(currentNode);
						currentNode = currentNode.nextSibling;
				}
				
				return text;
		}
		catch(ex)
		{
				alert(ex.message);
				return null;
		}
}

/**
 * @returns {Int} Poradi /text() elementu v XPath, napr. pro /html/body/p/text()[2] vrati 2
 */
function getXPathTextCount(xpath)
{
    var xpathTextCount = '';                 /**< Kolikaty je podle XPath text() v dokumentu. */
    //text()[1] nebo text() [1] nebo text() nebo text()[]
    xpathTextCount = xpath.replace(/.*\/text\(\)(.*)/i, "$1");  //1.nahrazeni
		xpathTextCount = xpathTextCount.replace(/[\[\]\s]/g, "");   //2.nahrazeni
		xpathTextCount = parseInt(xpathTextCount, 10);
		if (isNaN(xpathTextCount) || xpathTextCount == 0)
				xpathTextCount = 1;
            
    return xpathTextCount;
}

/**
 * Pokud je v XPath /text(), musi se odstranit a pocitat s nadrazenym elementem
 * @returns {Bool}
 */
function isTextNodeXPath(xpath)
{
		var textXPathRegExp = /.*\/text\(\).*/i;
		
		if (xpath.match(textXPathRegExp))
    //Jde o xpath, ktery urcuje uzel .../text()[x]
		//Je potreba pracovat s uzlem, ve kterem je text() (s rodicem)
		//A opravit offset v ramci tohoto uzlu
		  return true;
    else
      return false;
}


/**
 * Vrati pocet znaku, ktere se maji pridat k puvodni offsetu (tedy k offsetu v ramci nadrazeneho
 * uzlu pro /text())
 * @param {Node} Nadrezeny uzel pro /text()
 * @param {xpathTextCount} Kolikaty je /text() v nadrazenem uzlu (XPath bez spanu anotaci)
 * @returns {Int}
 */
function recalculateOffset(fragmentNode, xpathTextCount)
{
    if (fragmentNode == null)
        return 0;
    
    //Prepocitej offset v ramci nadrazeneho uzlu(pro text())
    var pos = 0;
		var i = 1;
				
		var actNode = fragmentNode.firstChild;
		var actChar = "";
				
		var textCountPlus = false;

		while(i < xpathTextCount)
		{						
				if(actNode == null)
						//Neco je spatne, cyklus musi skoncit driv
						return 0;
				
				var nodeLen = getLengthOfElement(actNode);
				
				if (nodeLen == null)
						return null;
				else
						pos += nodeLen;
						
				//TODO: OPRAV POCET TEXT()
				if (actNode.nodeType == Node.ELEMENT_NODE && !annotationExtensionChrome.functions.isAnnotationNode(actNode))
						textCountPlus = true;
											
				actNode = actNode.nextSibling;
				
				if (textCountPlus == true && (actNode.nodeType == Node.TEXT_NODE || annotationExtensionChrome.functions.isAnnotationNode(actNode)))
				{
						i++;
						textCountPlus = false;
				}
		}
      
    return pos;
}

/**
 * Ziska delku elementu(delku tagu + innerHTML)
 * @param {node} node uzel, pro ktery chceme delku
 * @returns {int} delku elementu
 */
function getLengthOfElement(node)
{
		//TODO: Zkontrolovat zakomentovane casti...
		try
		{				
        var ser = new XMLSerializer();
    		var text = "";
			  text += ser.serializeToString(node);
            
    		return text.length;
		}
		catch(ex)
		{
				alert('getLengthOfElement : \n' + ex.message);
				return null;
		}
};

/**
 * Vrati true pokud je tag neparovy
 * @param {String} tag, retezec obsahujici tag
 */
function isStringUnpairedTag(tag)
{
		var unpairedMatch = null;
		var unpairedTags = [/^<(br)/gi, /^<(hr)/gi, /^<(meta)/gi, /^<(basefont)/gi, /^<(!doctype)/gi];
		
		for (var i = 0; i < unpairedTags.length; i++)
		{
				unpairedMatch = tag.match(unpairedTags[i]);
				if (unpairedMatch != null)
				{
						alert(unpairedMatch)
						return true;
				}
		}
		
		return false;
};


/**
 * Obarvi fragment - prida anotaci do dokumentu.
 * @param {annotationExtensionChrome.fragment} fragment
 * @param {string} id id anotace
 * @param {string} type, typ anotace, ke kteremu patri fragment
 * @param {document} frame_doc
 * @param {nested} nested zda se jedna o fragment vnorene anotace
 * @param {String} selectingALinkType, pokud je uveden, barva fragmentu se nastavi
 *                 pouze pokud anotace (ke ktere fragment patri) je typu jako tento
 *                 atribut, jinak se barva nastavi na ""
 */
function injectFragment(fragment, id, type, frame_doc, nested, selectingALinkType)
{
    var xpath = fragment.xpath;
		var offset = fragment.offset;
    var len = fragment.length;
    
    /*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/
    var textNodeXPath = isTextNodeXPath(xpath);
    var xpathTextCount = 1;
    if (textNodeXPath)
    {
        xpathTextCount = getXPathTextCount(xpath);
        xpath = getAncestorXPathForTextNodeXPath(xpath);        
    }
		/*vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv*/

    var fragmentNode = getElementFromDoc(xpath, frame_doc)
    if (fragmentNode == null)
        return;
		
		var fragmentText = getElementText(fragmentNode);

		var pos = 0;  /**< Pozice cteneho znaku v uzlu fragmentu. */
		
		if(textNodeXPath)
		{
        pos = recalculateOffset(fragmentNode, xpathTextCount);
        if (pos == null)
            return;
		}
		
		var active = true;
		var background = "";
		var colorsStack = [];
		
    if (selectingALinkType != undefined && selectingALinkType != null)
    {//Pokud se vybira vnorena anotace nove vkladane anotace se muze podbarvit
     //barvou "alinku"
        if (selectingALinkType == type)
        {//Muzes ihned zobrazit
            active = true;
            background = annotationExtension.ALINK_ANNOTATION_COLOR;
            colorsStack.push(['aLinkColor',background]);
        }
    }
    else
    {
        if (nested)
        {
            active = false;
        }
        else
        {
            var typeName = annotationExtension.functions.linearTypeURI(type);
            background = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, 0);
            colorsStack.push([id,background]);
        }
    }
		
		colorsStack = JSON.stringify(colorsStack);
		
		var annotationSpanStart = '<html:span' +
		    ' name="' + id + '"'+
        ' class="' + annotationExtension.ANNOTATION_NODE_CLASS + '"' +
        ' onmouseout="dispatch(this,' + "'HideAPanelEvent'" + ');"' +
        ' onclick="dispatch(this,' + "'OpenAPanelEvent'" + ');"' +
        ' onmouseover="dispatch(this,' + "'ShowAPanelEvent'" + ');"' +
        ' style="background-color:' + background + '"' +
				" colorsstack='" + colorsStack + "'" +
        ' active="' + active + '"' +
        ' xmlns:html="http://www.w3.org/1999/xhtml">';
    var annotationSpanEnd = "</html:span>";
		
    var newFragmentText = "";   /**< innerHTML text, ktery se vlozi do uzlu. */
    var actualOffset = 0;
		var charsInSpan = 0;
    var charEnt = "";           /**< Pomocna promenna. */
    //
    //Zjisteni pozice pocatecniho pismene v anotaci
		//
    while(offset > actualOffset)
    {
				//Precteni jednoho znaku
				actChar = fragmentText.substr(pos, 1);

				if (actChar == "<")
				{//Preskoceni tagu
						while(actChar != '>')
						{
								pos++;
								actChar = fragmentText.substr(pos, 1);
						}
						pos++;
				}
				else
				{
            if (actChar == "&")
            {//entity, ktere zustaly - http://www.w3.org/TR/2009/WD-html5-20090212/serializing-html-fragments.html
             //pro offset musi byt entita jako jeden znak
                charEnt = getCharEntityAtPos(pos, fragmentText);
                pos += charEnt.length;
            }
						pos++;
						actualOffset++;	
				}
    }
		newFragmentText += fragmentText.substr(0, pos);  //innerHTML od zacatku fragmentu po offset anotace

		//
		//Anotovany text, vlozeni spanu
		//
    newFragmentText += annotationSpanStart;
		var readedAnnotationChars = 0;           /**< Pocet prectenych znaku anotace. */
		
		while(len > readedAnnotationChars)
		{
				actChar = fragmentText.substr(pos, 1);
			 
				if (actChar == "<")
				{//Oteviraci nebo uzaviraci tag jineho spanu s anotaci
						if (charsInSpan != 0)
								newFragmentText += annotationSpanEnd;
						else
						//Pokud se nevlozil zadny znak za <span ...> smaz <span ...> a nevkladej </span>
						//Zamezeni zbytecneho vkladani prazdnych <span></span>
								newFragmentText = newFragmentText.slice(0, newFragmentText.length - annotationSpanStart.length);
            newFragmentText += actChar; //Vlozeni znaku <
						do
						{
								pos++;
								actChar = fragmentText.substr(pos, 1);								
								newFragmentText += actChar;
						}
						while(actChar != '>')
						
            newFragmentText += annotationSpanStart;
						charsInSpan = 0;
						pos++;
        }
				else
				{
            charEnt = "";
            if (actChar == "&")
            {//entity, ktere zustaly - http://www.w3.org/TR/2009/WD-html5-20090212/serializing-html-fragments.html                
                charEnt = getCharEntityAtPos(pos, fragmentText);
                pos += charEnt.length;
            }
						charsInSpan++;          
						readedAnnotationChars++; 
            newFragmentText += actChar + charEnt;
						pos++;
				}
		}
    newFragmentText += annotationSpanEnd;
    newFragmentText += fragmentText.slice(pos);
    
    fragmentNode.innerHTML = newFragmentText;
};

/**
 * Pokud je v textu text na pozici pos znakova entita, vrati tuto entitu.
 * MA SPECIALNI VYZNAM PRI POCITANI OFFSETU - VRATI POUZE ENTITU, KTERA PRI
 * SERIALIZACI NA STRING (fci serializeToString()) NENI NAHRAZENA 
 * @param {Int} pos, pozice, na ktere by mela byt entita
 * @param {String} text, retezec obsahujici entitu
 * @returns {Int} pokud na pozici pos neni znakova, prazdny retezec, jinak vrati
 *                znakovou entitu bez uvodniho znaku &
 */
function getCharEntityAtPos(pos, text)
{
    var entitySixChars = text.substr(pos, 6);
    var entityFiveChars = text.substr(pos, 5);
    var entityFourChars = text.substr(pos, 4);
                
    if (entitySixChars == '&nbsp;' || entitySixChars == '&quot;')
        return entitySixChars.substr(1, 5);
    else if (entityFiveChars == '&amp;')
        return entityFiveChars.substr(1, 4);
    else if (entityFourChars == '&lt;' || entityFourChars == '&gt;')
        return entityFourChars.substr(1, 3);
    else
        return "";
}


/**
 * Odstrani Fragmenty anotace ze stranky
 * @param {String} id, id anotace ktere se maji odstranit fragmenty ze stranky
 * @param {Document object} frame_doc, dokument, stranka, ze ktere se maji odstranit fragmenty
 */
function removeFragments(id,frame_doc)
{
		//Nemaz anotaci s ID...
		//if (id == 'http://example.com/annotations/254')
		//		return;
    
    var spanNodes = null;
		
    try
    {//Od ff 15 tohle muze vyhazovat vyjimku: Type error: Can't access dead object
     //viz popis u annotationExtensionChrome.annotationsViewinitForNewDocument()
        spanNodes = frame_doc.getElementsByName(id);
    }
    catch(ex)
    {
        return;
    }
 
		while (spanNodes.length > 0)
		{//Objekty(uzly) se postupne mazou (pole se zmensuje)				
				var spanNode = spanNodes[0];
				
				var prevNode = spanNode.previousSibling;
				var nextNode = spanNode.nextSibling;
				var prevNodeText = "";
        var nextNodeText = "";
				var joinPrev = false;
				var joinNext = false;
				//var parentNode = spanNode.parentNode;
				
				if (prevNode && spanNode.firstChild.nodeType == Node.TEXT_NODE && prevNode.nodeType == Node.TEXT_NODE)
				{//Priprava na spojeni textu: text<span>text...
						prevNodeText = prevNode.nodeValue;
						prevNode.parentNode.removeChild(prevNode);
						joinPrev = true;
				}
				
				if (nextNode && spanNode.lastChild.nodeType == Node.TEXT_NODE && nextNode.nodeType == Node.TEXT_NODE)
				{//Priprava na spojeni textu: ...text</span>text
						nextNodeText = nextNode.nodeValue;
						nextNode.parentNode.removeChild(nextNode);
						joinNext = true;
				}

				var newNodes = [];

				if (spanNode.firstChild == spanNode.lastChild && joinNext && joinPrev)
				{//Span obsahuje pouze text, ne dalsi spany
						var newNode = document.createTextNode(prevNodeText + spanNode.firstChild.nodeValue + nextNodeText);
						newNodes.push(newNode);
				}
				else
				{
						var spanNodeChild;
						var spanNodeEndChild;
						var newFirstNode = null;
						var newLastNode = null;
						
						
						if (joinPrev)
						{//Je potreba spojit text<span>text...
								newFirstNode = document.createTextNode(prevNodeText + spanNode.firstChild.nodeValue);
								newNodes.push(newFirstNode);
								
								spanNodeChild = spanNode.firstChild.nextSibling;
						}
						else
						{
								spanNodeChild = spanNode.firstChild;
						}
						
						if (joinNext)
						{//Je potreba spojit ...text</span>text
								newLastNode = document.createTextNode(spanNode.lastChild.nodeValue + nextNodeText);
								
								spanNodeEndChild = spanNode.lastChild;
						}
						else
						{
								spanNodeEndChild = null;
						}
						
						while (spanNodeChild != spanNodeEndChild)
						{
								newNodes.push(spanNodeChild);
								spanNodeChild = spanNodeChild.nextSibling;
						}
						
						if(newLastNode != null)
								newNodes.push(newLastNode);
				}
				
				var spanNodeNextSibling = spanNode.nextSibling;
				
				if(spanNodeNextSibling)
						for (var len = 0; len < newNodes.length; len++)
								spanNode.parentNode.insertBefore(newNodes[len], spanNodeNextSibling);

				else
						for (var len = 0; len < newNodes.length; len++)
								spanNode.parentNode.appendChild(newNodes[len]);
						
				spanNode.parentNode.removeChild(spanNode);
		}
};

/**
 * Vlozi fragmenty anotace do dokumentu a vytvori panel pro anotaci
 * @param {Annotation} annotation, objekt anotace
 * @param {Document} frame_doc, dokument, do ktereho se maji fragmenty vlozit -
 *                   obvykle "document"
 */
function injectAnnotation(annotation, frame_doc)
{
    if(annotation.fragments.length > 0)
    {
        $.each(annotation.fragments, function(ind,fragment) { injectFragment(fragment,annotation.id,annotation.type,frame_doc,annotation.nested_id, annotationExtensionChrome.bottomAnnotationWindow.annotsALinkType); });
        
        if (annotation.nested_id)
            var nestedAnnot = true;
				else
            var nestedAnnot = false;
				
        var panel = createRTAPanel(annotation.id, document.getElementById('aePanels'), nestedAnnot);
        return panel;
    }
    else
    {
				var sideBarPanel = createAnnotationToSidebar(annotation);
        return sideBarPanel;
    }
};

/**
 * Odstrani fragmenty anotace z dokumentu
 * @param {Annotation} annotation, objekt anotace
 * @param {Document} frame_doc, dokument, ze ktereho se maji fragmenty odstranit -
 *                   obvykle "document"
 */
function removeAnnotationFromDoc(annotation, frame_doc)
{
    //Pokusi se odstranit fragmenty z dokumentu i bocniho panelu,
    //protoze pokud se editovala anotace a z anotace se stala anotace
    //celeho dokumentu (a naopak), pri editaci by se zde nepokusil
    //smazat fragmenty (pripadne polozku v bocnim panelu),
    //protoze editovana anotace nebude mit v sobe zadny fragment (a naopak)
    
    //if(annotation.fragments.length > 0)
    //{
				removeFragments(annotation.id,frame_doc);
    //}
    //else
    //{
        try
        {
            removeAnnotationFromSidebar(annotation);
        }
        catch(ex)
        {}
    //} 
};

/**
 * Odstrani fragmenty anotace z dokumentu a smaze panel anotace
 * @param {Annotation} annotation, objekt anotace
 * @param {Document} frame_doc, dokument, ze ktereho se maji fragmenty odstranit -
 *                   obvykle "document"
 */

function removeAnnotation(annotation, frame_doc)
{
    removeAnnotationFromDoc(annotation, frame_doc);
    if (annotation.id != "")
        deleteRTAPanel(annotation.id);
};

/**
 * Vlozi anotaci do bocniho panelu anotacniho doplnku
 * @param {Annotation} annotation, objekt anotace
 */
function createAnnotationToSidebar(annotation)
{
		var sidebarDocument = document.getElementById("sidebar").contentDocument;
		if(isAnnotationSidebarActive(sidebarDocument))
		{
				try
				{            
            if (annotation.nested_id)
								var nestedAnnot = true;
						else
								var nestedAnnot = false;
                
						var RTAsideBarPanel = createRTASidebarPanel(annotation.id, nestedAnnot);
						actualizeRTASidebarPanel(RTAsideBarPanel, RTAsideBarPanel.id);
            return RTAsideBarPanel;
				}
				catch(ex)
		    {}
		}
    
    return null;
};

/**
 * Odstrani anotaci z bocniho panelu anotacniho doplnku
 * @param {Annotation} annotation, objekt anotace
 */
function removeAnnotationFromSidebar(annotation)
{
		var sidebarDocument = document.getElementById("sidebar").contentDocument;
		if (isAnnotationSidebarActive(sidebarDocument))
		{
				try
				{
					var RTAsideBarPanel = sidebarDocument.getElementById(annotation.id);
					RTAsideBarPanel.parentNode.removeChild(RTAsideBarPanel);
				}
				catch(ex)
				{}
		}
};

/**
 * Odstrani vsechny anotace "DB" z bocniho panelu anotacniho doplnku
 * @param {AnnotationsDB} annotDB, "databaze" obsahujici anotace k odstraneni
 */
function removeAnnotationsFromSidebar(annotDB)
{		
		$.each(annotDB.annotations, function(ind, annotation)
		{
				if(annotation.fragments.length < 1)
				{
						removeAnnotationFromSidebar(annotation);
				} 
		});
};

/**
 * Vlozi vsechny anotace "DB" do bocniho panelu anotacniho doplnku
 * @param {AnnotationsDB} annotDB, "databaze" obsahujici anotace k vlozeni
 */
function addAnnotationsToSidebar(annotDB)
{		
		$.each(annotDB.annotations, function(ind, annotation)
		{
				if(annotation.fragments.length < 1)
				{                
						createAnnotationToSidebar(annotation);
				} 
		});
};

/**
 * Test, zda je bocni panel anotacniho doplnku otevreny
 */
function isAnnotationSidebarActive(sidebarDocument)
{
		if (sidebarDocument.location.href == "chrome://annotationextension/content/annotDisplay/sideBar.xul")
				return true;
		else
				return false;
};

/**
 * Aktualizuje barvu fragmentu v dokumentu vsech anotaci.
 */
function updateAnnotationsColorInDoc()
{
    try
    {
        var annotations = annotationExtensionChrome.annotationsView.ANNOTATIONS.annotations;
        for (a in annotations)
        {
            var annot = annotations[a];
            
            var typeName = annotationExtension.functions.linearTypeURI(annot.type);
            var level = annot.lvl;

            var typeColor = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, level);
            
						if (annotationFragmentIsActive(annot.id, annotationExtensionChrome.annotationsView.frame_doc))
								setFragmentsBackground(annot.id, typeColor, annotationExtensionChrome.annotationsView.frame_doc, annot.tmpId);
        }
    }
    catch(ex)
    {//Chyba pri aktualizaci barev anotaci v dokumentu
        alert(ex.message);
    }
};

/**
 * Test zda je fragment anotace v dokumentu "aktivni" - je podbarven a po najeti
 * na nej se zobrazi jeho anotace
 * @param {String} id, ID spanu (anotace) reprezentujici fragment
 * @param {Document} doc, dokument ve kterem se nachazi fragment -
 *                   obvykle "document"
 */
function annotationFragmentIsActive(id, doc)
{
		var spanNodes = doc.getElementsByName(id);
		if (spanNodes.length > 0)
		{
				var active = spanNodes[0].getAttribute('active');
				if (active == true || active == 'true')
						return true;
				else
						return false;
		}
		else
				return false;
}

/**
 * Provede akce nad nove prijatymi anotacemi (add, change, remove)
 * @param {AnnotChanges object} annot_changes objekt s nove prijatymi anotacemi, zmenanami od serveru
 * @param {AnnotationsDB object} annotDB databaze, do ktere se ulozi nove prijate anotace
 * @param {Document object} frame_doc dokument, do ktereho se maji anotace vlozit
 */
function applyChanges(annot_changes,annotDB,frame_doc)
{
		try
		{
				//Pred provadenim zmen v dokumentu (na strance) je potreba ulozit aktualni vyber
				//textu, nove pridane anotace ho zrusi
				annotationExtensionChrome.bottomAnnotationWindow.saveCurrentTextSelectionForProperAnnot();
				
        var i = 0;
        while (annot_changes.add.length > 0)
        {
            var annotation = annot_changes.add.shift();
            i++;
            //alert(annotation.fragments[0].string());
								
            annotDB.addAnnotationDB(annotation);
						
            injectAnnotation(annotation, frame_doc);
            
            if (i == 30) //30
            {//TODO: optimalizovat "i" a "timeout"
                setTimeout(function() {applyChanges(annot_changes,annotDB,frame_doc);}, 10); 
                return;
            }
				}

        while (annot_changes.change.length > 0)
        {
            var annotation = annot_changes.change.shift();
            i++;
						//alert('START VYPIS');
						//$.each(annotDB.annotations, function(index,annotation){annotDB.annotations[index].alert()});
						//alert('END VYPIS');
						//alert('change:' + annotation.id + 'END');
            var annot_from_db = annotDB.getAnnotation(annotation.id);

						if (annot_from_db != undefined && annot_from_db != null)
						{
                removeAnnotation(annotation, frame_doc);
								
								annotDB.changeAnnotationDB(annotation);
						}
						else
						{//Pokud se edituje anotace a je v ni nova vnorena anotace, musi se pridat
						 //Vnorena anotace je v .change[] (prestoze se pridava nove)
						  annotDB.addAnnotationDB(annotation);
						}
						
						injectAnnotation(annotation, frame_doc);
            
            if (i == 30) //30
            {//TODO: optimalizovat "i" a "timeout"
                setTimeout(function() {applyChanges(annot_changes,annotDB,frame_doc);}, 10); 
                return;
            }
        }

				while (annot_changes.remove.length > 0)
        {
            var annotation = annot_changes.remove.shift();
 
            var annot_from_db = annotDB.getAnnotation(annotation.id);
						if (annot_from_db != undefined && annot_from_db != null)
						{
								//TODO: pokud by se mohla mazat vnorena anotace odkomentovat...
								//if (annot_from_db.nested_id)
								//{//Jde o vnorenou anotaci
								//				parentPanel.hidePopup();  //Nebo spis zavolat aktualizaci panelu?
								//}
								removeAnnotation(annot_from_db, frame_doc);
								annotDB.removeAnnotationDB(annot_from_db);
						}
        }
        
        while (annot_changes.suggestionsAdd.length > 0)
        {
            var annotation = annot_changes.suggestionsAdd.shift();
            i++;
								
            annotDB.addAnnotationDB(annotation);
						
            var panel = injectAnnotation(annotation, frame_doc);
            
            if (annotation.nested_id)
                var nestedAnnot = true;
            else
                var nestedAnnot = false;
            
            //NABIZENI ANOTACI
            if (nestedAnnot == false)
            {
                makeSuggestionPanelFromPanel(annotation.id, annotation.tmpId, panel);
                setFragmentsBorder(annotation.id, frame_doc, "1px", "dashed", annotationExtension.SUGGESTED_BORDER_COLOR);
            }
            else
            {//Vnorene anotaci nastav pouze tridu suggested
                setSuggestionClassToPanelContent(panel);
            }
            
            if (i == 30) //30
            {//TODO: optimalizovat "i" a "timeout"
                setTimeout(function() {applyChanges(annot_changes,annotDB,frame_doc);}, 10); 
                return;
            }
        }
        
        while (annot_changes.suggestionsDelete.length > 0)
        {
            var annotationId = annot_changes.suggestionsDelete.shift();
            deleteSuggestedAnnotation(annotationId, annotDB, frame_doc);
				}
    
				//Obnoveni vybraneho textu
				annotationExtensionChrome.bottomAnnotationWindow.restoreTextSelectionForProperAnnot();
		}
		catch(ex)
		{
				alert('domManipulations.js : applyChanges:\n' + ex.message);
		}
};

/**
 * Smaze nabidnutou anotaci a jeji vnorene anotace
 * @param {String} annotationId, id nabidnute anotace
 * @param {AnnotationsDB} annotDB, databaze, ve ktere je ulozena nabidnuta anotace
 * @param {Document} frame_doc, objekt dokumentu, kde jsou zobrazeny fragmenty anotace
 */
function deleteSuggestedAnnotation(annotationId, annotDB, frame_doc)
{
    try
    {
        var annot_from_db = annotDB.getAnnotation(annotationId);
        if (annot_from_db != undefined && annot_from_db != null)
        {
            for (var i = 0; i < annot_from_db.nestedAnnotationsId.length; i++)
            {
                deleteSuggestedAnnotation(annot_from_db.nestedAnnotationsId[i], annotDB, frame_doc);
            }
            
            removeAnnotation(annot_from_db, frame_doc);
            annotDB.removeAnnotationDB(annot_from_db);
        }
    }
    catch(ex)
    {}
}

/**
 * Odstrani vsechny potomky elementu
 * @param {ELEMENT_NODE} element uzel kteremu se odstrani vsichni potomci
 */
function removeChildrens(element)
{
    while(element.hasChildNodes())
        element.removeChild(element.firstChild);
};

/**
 * Prida do atributu colorsArray barvu.
 * @param {Element} node, uzel s aributem colorsArray
 * @param {String} color, barva, ktera se ma pridat
 * @param {String} id, id k barve
 */
function pushFragmentColor(node, color, id)
{
		var colors = node.getAttribute('colorsstack');
		var colorsArray = JSON.parse(colors);
		
		colorsArray.push([id, color])
		
		colors = JSON.stringify(colorsArray);
		node.setAttribute('colorsstack', colors);
};

/**
 * Odebere z atributu colorsArray prvni barvu a vrati ji
 * @param {Element} node, uzel s aributem colorsArray
 * @returns {Array} dvouprvkove pole, s id anotace, ke ktere barva patri a samotnou barvou
 */
function popFragmentColor(node)
{
		var colors = node.getAttribute('colorsstack');
		var colorsArray = JSON.parse(colors);
    
    if (colorsArray.length <= 0)
        return null;
		
		var color = colorsArray.pop();
		
		colors = JSON.stringify(colorsArray);
		node.setAttribute('colorsstack', colors);
		
		return color;
};

/**
 * Ziska z atributu colorsArray barvu s danum id
 * @param {String} id identifikujici barvu
 * @para {Element} node, uzel s parametrem colorsArray
 * @returns {String} barvu uzlu
 */
function getFragmentColorByID(node, id)
{
		if (node == null)
				return "";
		
		var colors = node.getAttribute('colorsstack');
		var colorsArray = JSON.parse(colors);
		
		for (var i = 0; i < colorsArray.length; i++)
		{
				if (colorsArray[i][0] == id)
						return colorsArray[i][1];
		}
		
		return "";
};

/**
 * Odstrani z atributu colorsArray vsechny barvy s danum id
 * @param {String} id identifikujici barvu
 * @para {Element} node, uzel s parametrem colorsArray
 */
function removeFragmentColorByID(node, id)
{
		if (node == null)
				return;
		
		var colors = node.getAttribute('colorsstack');
		var colorsArray = JSON.parse(colors);
		
		for (var i = 0; i < colorsArray.length; i++)
		{
				if (colorsArray[i][0] == id)
						colorsArray.splice(i, 1);
		}
		
		colors = JSON.stringify(colorsArray);
		node.setAttribute('colorsstack', colors);
};

/**
 * Nastavi fragmentum s id novou barvu
 * Pokud je color == "" a na zasobniku barev je nejaka barva ulozena nastavi prvni barvu ze zasobniku
 * @param {String} id, id(anotace ke ktere fragmenty patri) fragmentu, kterym se ma zmenit barva
 * @param {String} tmpId, tmpId(anotace ke ktere fragmenty patri) fragmentu, kterym se ma zmenit barva
 * @param {String} color, nova barva
 * @param {Document} doc, dokument, kde se nachazeji spany fragmentu
 */
function setFragmentsBackground(id, color, doc, tmpId)
{
		var spanNodes = doc.getElementsByName(id);
		for (var i = 0; i < spanNodes.length; i++)
		{
				setFragmentBackground(spanNodes[i], color, id, tmpId);
		}
};

/**
 * Zmeni barvu fragmentu(spanu fragmentu)
 * @param {Element} node, element pro ktery se ma zmenit barva.
 * @param {String} id, id(anotace ke ktere fragment patri) fragmentu
 * @param {String} id, tmpId(anotace ke ktere fragment patri) fragmentu
 * @param {String} color, nova barva
 */
function setFragmentBackground(node, color, id, tmpId)
{
    var width = "1px";
    var style = "dashed";
    
		if (color != "")
		{
        $(node).css("background-color",color);
        if (tmpId != null && tmpId != undefined)
          $(node).css("border", width + " " + style + " " + annotationExtension.SUGGESTED_BORDER_COLOR);
				
				//Pokud je podbarveni "schovane" pod ostatnimi barvami smaz ho -> bude znovu nahore
				//Pokud je nahore, pouze smaze starou barvu a nastavi novou
				removeFragmentColorByID(node, id);

				pushFragmentColor(node, color, id);
		}
		else
		{//Pokud se ma "zrusit pozadi"
				var newColor = popFragmentColor(node);
				//Pokud se id barvy == id fragmentu, aktualne nastavena barva spanu patri k fragmentu, kteremu se ma "zrusit" pozadi-barva
        if (newColor != null)
        {
            if (newColor[0] == id)
            {//Zmen barvu, jinak jen smaz barvu ze zasobniku
                newColor = popFragmentColor(node);
                if (newColor == undefined || newColor == null)
                {//V zasobniku zadna barva pro fragment, nastav fragmentu prazdne pozadi
                    $(node).css("background-color",color);
                    $(node).css("border",  "0px solid #000000");
                }
                else
                {
                    $(node).css("background-color",newColor[1]);
                    if (tmpId != null && tmpId != undefined)
                      $(node).css("border", width + " " + style + " " + annotationExtension.SUGGESTED_BORDER_COLOR);
                    pushFragmentColor(node, newColor[1], newColor[0]);	
                }
            }
            else
            {
                pushFragmentColor(node, newColor[1], newColor[0]);
                removeFragmentColorByID(node, id);				
            }
        }
		}
		
		var childNodes = node.childNodes;
		for (var i = 0; i < childNodes.length; i++)
		{
				if (childNodes[i].nodeType == Node.ELEMENT_NODE)
						setFragmentBackground(childNodes[i], color, id, tmpId);
		}
};

/**
 * Zobrazi anotaci(fragmenty anotace) na strance jinou barvou
 * @param {String} id, id anotace, ktera se ma "zvyraznit"
 */
function annotHighlight(id, doc)
{
		setFragmentsBackgroundHiglight(id, annotationExtension.ANNOTATION_HIGHLIGHTED, doc);
};

/**
 * Vrati anotaci(fragmentum anotace) puvodni barvu
 * @param {String} id, id anotace, ktere se ma obnovit puvodni barva zmenena funkci annotHighlight()
 */
function annotHighlightClear(id, doc)
{
		setFragmentsBackgroundHiglight(id, "", doc);
};

/**
 * Funkce setFragmentsBackground upravena pro zvyrazneni fragmentu...
 * Parametr "color" nesmi byt prazdny a nad fragmenty se nesmi volat jina zmena barvy
 * dokud se nezavola setFragmentsBackground s barvou nastavenou na "".
 */
function setFragmentsBackgroundHiglight(id, color, doc)
{
		var spanNodes = doc.getElementsByName(id);
    try
    {
        for (var i = 0; i < spanNodes.length; i++)
        {
            setFragmentBackground(spanNodes[i], color, 'highlightColor', null);
        }
    }
    catch(ex)
    {}
};

/**
 * Nastavi fragmentum s id okraj
 * @param {String} id, id(anotace ke ktere fragmenty patri) fragmentu, kterym se ma zmenit okraj
 * @param {Document} doc, dokument, kde se nachazeji spany fragmentu
 * @param {String} color, nova barva okraje (hexa)
 * @param {String} width, sirka okraje
 * @param {String} style, dashed, dotted, solid
 */
function setFragmentsBorder(id, doc, color, width, style)
{
		var spanNodes = doc.getElementsByName(id);
		for (var i = 0; i < spanNodes.length; i++)
		{
				setFragmentBorder(spanNodes[i], color, width, style, id);
		}
};

/**
 * Zmeni okraj fragmentu(spanu fragmentu)
 * @param {Element} node, element pro ktery se ma zmenit okraj.
 * @param {String} id, id(anotace ke ktere fragment patri) fragmentu
 * @param {String} color, nova barva okraje (hexa)
 * @param {String} width, sirka okraje
 * @param {String} style, dashed, dotted, solid
 */
function setFragmentBorder(node, color, width, style, id)
{
    $(node).css("border", width + " " + style + " " + color);	
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
///////////////////////// ALINK ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/**
 * Skryje anotace v dokumentu, krom daneho typu.
 * Po teto funkci je nutne zavolat restoreAnnotationsAfterSelectALink()
 * @param {String} type, typ ktery ma zustat "aktivni"
 * @param {String} color, barva jako se ma "aktivni" typ zobrazit
 * @param {document} doc, dokument, ve kterem se nachazeji fragmenty anotace
 */
function hideAnnotationsForSelectALink(type, color, doc)
{
		closeAllPanels();

		hideAnnotationsExceptType(type, color, doc);

		//Docasne zruseni listeneru na onmouseover nad spanem
		document.removeEventListener("ShowAPanelEvent", ShowAPanelEventListener, false, true);
		//document.removeEventListener("HideAPanelEvent", HideAPanelEventListener, false, true);
		document.removeEventListener("OpenAPanelEvent", OpenAPanelEventListener, false, true);
			
		document.addEventListener("ShowAPanelEvent", ShowAPanelWithoutNestedEventListener, false, true);		
	
		var webContent;
        webContent = document.getElementById('content');
        webContent.addEventListener("mouseup", selectALink, false, true);
}

/**
 * Obnovi fragmenty anotaci po skryti funkci hideAnnotationsForSelectALink()
 * @param {document} doc, dokument, ve kterem se nachazeji fragmenty anotace
 */
function restoreAnnotationsAfterSelectALink(doc)
{		
		var webContent;
        webContent = document.getElementById('content');
        webContent.removeEventListener("mouseup", selectALink, false, true);
				
		document.removeEventListener("ShowAPanelEvent", ShowAPanelWithoutNestedEventListener, false, true);
		
		//Vraceni listeneru zobrazeni panelu a vnorenych anotaci na span
		document.addEventListener("ShowAPanelEvent", ShowAPanelEventListener, false, true);
		//document.addEventListener("HideAPanelEvent", HideAPanelEventListener, false, true);
		document.addEventListener("OpenAPanelEvent", OpenAPanelEventListener, false, true);
		
		showMainAnnotations(doc);
}

/**
 * Funkce pro zpracovani udalosti, ktera prisla po kliknuti na anotaci(fragment, span)
 * jez byla zobrazena funkci hideAnnotationsForSelectALink()
 */
function selectALink(e)
{
		try
		{
				var active = $(e.target).attr('active');
		
				var interfaceID = annotationExtensionChrome.attributes.selectedAttrUIID;
				
				var annotContentTextbox = document.getElementById(interfaceID+'-textbox2-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
				var contentDeck = document.getElementById(interfaceID+'-contentDeck-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
					  
				if (active != 'true' ||
						//Nekliklo se na span anotace stejneho typu jako atribut nebo jinam do dokumentu
						window.content.getSelection().toString().length > 0
						//Pokud je delka vybraneho textu vetsi jak nula, nepuje o aLink, ale vyber textu						
						)
				{//Nejde o aLink nebo zruseni aLinku            
						if (contentDeck.selectedIndex == 1)
						{
								deleteALinkFromAttribute(interfaceID);								
						}
				}
				else
				{//aLink
            if (annotContentTextbox.value.length > 0)
            {//Pokud je vyplneny obsah anotace nemuze byt aLink
                let stringBundle = document.getElementById("annotationextension-string-bundle");
                var panelDesc = stringBundle.getString("annotationextension.attributes.annotLink") + ":";
                var panelText = stringBundle.getString("annotationextension.messages.aLinkNotPossibleDueToContent")
                annotationExtensionChrome.infoPanel.create('aeALinkInfoPanel', 'slow', panelDesc, panelText, 'aeCancelImage');
                annotationExtensionChrome.infoPanel.show('aeALinkInfoPanel', e.target);
            }
            else
            {
                var annotID = $(e.target).attr('name');
                if (checkChildsAttrsAndAlertWhenSelectNewALink(interfaceID))
                    setALinkToAttribute(interfaceID, annotID);
            }
				}
		}
		catch(ex)
		{
        alert('selectALink: \n' + ex.message);
		}
}

/**
 * Zkontroluje, zda je mozne priradit atributu alink beze ztraty vytvorenych
 * atributu u tohoto atributu, potom vrati true. Pokud ne, vyvola okno k potvrzeni.
 * @param {String} interfaceID, id atributu, ktery chceme zkontrolovat
 * @returns {Bool} true, pokud se ma atributu nastavit alink
 *                 false, jinak
 */
function checkChildsAttrsAndAlertWhenSelectNewALink(interfaceID)
{
    var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();
		var annotationObj = tab.getNestedAnnotation(interfaceID);
    
    if (annotationObj == null || annotationObj.multipleAnnotation != true || annotationObj.aLinks != true)
		{//Atribut nema nastaveny aLink
        var childsUI = annotationExtensionChrome.annotationProcessor.getAtributeElems(interfaceID);
        var hasNonDefAttr = annotationExtensionChrome.attributes.checkIfAttrHasNonDefaultAttrs(interfaceID);
        if (childsUI.length > 0 || hasNonDefAttr)
        {//Atribut ma nejake vytvorene atributy
            let stringBundle = document.getElementById("annotationextension-string-bundle");
            if (window.confirm(stringBundle.getString("annotationextension.attributes.setALinkToAttrConfirmLabel")))
                return true;
            else
                return false;        
        }
    }
    
    return true;
}

/**
 * Nastavi uzivatelskemu rozhrani aLink
 * @param {String} id, id anotace, ktere se ma nastavit do vyberu textu hodnota aLinku
 * @param {Array String} annotID, id anotaci odkazovane aLinkem
 */
function setALinkToUiById(id, annotID)
{
		var annotSelectBox = document.getElementById(id+'-textbox1-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
		
		var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
		var annots = []
		for (var i = 0; i < annotID.length; i++)
		{
				var a = annotDB.getAnnotation(annotID[i]);
				if (a != undefined && a != null)
						annots.push(a);
		}
		
		var text = "";
		var separ = ""; /**< Oddelovac jednotlivych anotaci */
    
    if (annotationExtensionChrome.browserOverlay.preferences.getCharPref("separateMode") == "newline")
    {
      separ = "\n";
    }
    else if (annotationExtensionChrome.browserOverlay.preferences.getCharPref("separateMode") == "space")
    {
      separ = " ";
    }
		
		for (var j = 0; j < annots.length; j++)
				for (var i = 0; i < annots[j].fragments.length; i++)
						text += annots[j].fragments[i].text + separ;
		
		annotSelectBox.value = text;
		
    var contentDeck = document.getElementById(id+'-contentDeck-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
		var aLinkLabelBox = document.getElementById(id+'-aLinkLabelBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    contentDeck.selectedIndex = 1;
		var onMouseOverText = '';
		var onMouseOutText = '';
		for (var i = 0; i < annotID.length; i++)
		{
				onMouseOverText += 'showALinkPanel("'+annotID[i]+'");';
				onMouseOutText += 'closeALinkPanel("'+annotID[i]+'");';
		}
    aLinkLabelBox.setAttribute('onmouseover', onMouseOverText);
    aLinkLabelBox.setAttribute('onmouseout', onMouseOutText);
		aLinkLabelBox.setAttribute('onmouseoutAeSaved', onMouseOutText);
		
		aLinkLabelBox.setAttribute('onclick', 'aLinkLabelBoxClick("'+id+'")');
}

/**
 * Handler pro kliknuti na box s informaci o odkazovane anotaci v uzivatelskem
 * rozhrani atributu.
 * @param {String} id, id uziv. rozhrani, atributu
 */
function aLinkLabelBoxClick(id)
{
  var aLinkLabelBox = document.getElementById(id+'-aLinkLabelBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
	var labelContentBox = document.getElementById(id+'-labelContentBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
  var onMouseOutText = aLinkLabelBox.getAttribute('onmouseout');
	
	if (onMouseOutText == "")
	{
		var onMouseOutTextSaved = aLinkLabelBox.getAttribute('onmouseoutAeSaved');
		aLinkLabelBox.setAttribute('onmouseout', onMouseOutTextSaved);
		labelContentBox.className = 'redBoxHover';
    }
	else
	{
		aLinkLabelBox.setAttribute('onmouseout', '');
		labelContentBox.className = 'redBoxBlueBorder';
  }
}

/**
 * Zrusi z uziv. rozhrani atributu aLink
 * @param {String} id, id uziv rozhrani
 */
function deleteALinkFromUiById(id)
{
		try
		{
				var contentDeck = document.getElementById(id+'-contentDeck-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
				var aLinkLabelBox = document.getElementById(id+'-aLinkLabelBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
				var selectedText = document.getElementById(id+'-textbox1-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());		
						
				contentDeck.selectedIndex = 0;
				selectedText.value = "";
				aLinkLabelBox.setAttribute('onmouseover', '');
				aLinkLabelBox.setAttribute('onmouseout', '');
		}
		catch(ex)
		{}
}

/**
 * Nastavi atributu "interfaceID" aLink na "annotID"
 * @param {String} id, id atributu, kteremu se ma nastavit aLink
 */
function setALinkToAttribute(interfaceID, annotID)
{
		var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();
		var annotationObj = tab.getNestedAnnotation(interfaceID);

		if (annotationObj == null || annotationObj.multipleAnnotation != true || annotationObj.aLinks != true)
		{//Vytvor novy aLink
				if (annotationObj != null)
				{//Pokud existuje jiny objekt pro tento atribut(typu anotace s vice vybery) je potreba ho smazat
						var nestedAnnots = tab.getNestedAnnotations();
						var nestAnnotIndex = nestedAnnots.getIndexByProp('uri', interfaceID);
						nestedAnnots.deleteOnIndex(nestAnnotIndex);
				}
				
				annotationObj = new annotationExtensionChrome.selectedAnnotation(interfaceID);
				annotationObj.setALink();
        
				annotationObj.addAnnotation(annotID, 0);
				annotationObj.hideSelectAnnotBoxForSelectAnnotation();
        annotationObj.hideAddDeleteBox();
        tab.nestedAnnotations.addNew(annotationObj);
				
				
				//setALinkToUiById(interfaceID, [annotID]);

				setALinkToAttributeProp(interfaceID, 'true');

				//Smazani interface a podstromu pro atribut typu anotace aLink
				//(atributy aLinku nelze editovat!!!)
				annotationExtensionChrome.attributes.deleteAttrInterfaceChilds(interfaceID);
				annotationExtensionChrome.attrDatasource.delAllObjectsInSeq(interfaceID);
				
				annotationExtensionChrome.attributes.showOrHideAddAttrToAttrButtonByID(interfaceID);
				//Ukonceni vyberu "vnorene anotace"
				//annotationExtensionChrome.bottomAnnotationWindow.selectNestedAnnotation(interfaceID);

		}
		else
		{//Pouze vloz (atribut uz ma nastaveny aLink)
				setALinkToUiById(interfaceID, [annotID]);
				annotationObj.setALinkToActiveAnnotation(annotID);
		}
}

/**
 * Zrusi atributu odkaz na anotaci
 * @param {String} interfaceId, id uzivatelskeho rozhrani atributu.
 */
function deleteALinkFromAttribute(interfaceID)
{
		var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();
		var annotationObj = tab.getNestedAnnotation(interfaceID);
		if (annotationObj != null && annotationObj.multipleAnnotation == true)
		{
				deleteALinkFromUiById(interfaceID);
				
				annotationObj.setALinkToActiveAnnotation("");
				
				if (annotationObj.len() <= 1)
				{//Jediny aLink nastaveny na "ne aLink" -> neni zadny aLink zruseni aLink objektu				
						//Nastaveni "" jako aLink => zruseni aLinku pro atribut
						setALinkToAttributeProp(interfaceID, "false");
						
						var nestedAnnotations = tab.getNestedAnnotations();
						var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', interfaceID);
						nestedAnnotations.deleteOnIndex(selectedAnnotationObjIndex);
						
						//Nastavuje se z aLinku na nested => nema atributy => nacteni atributu pro atribut typu vnorene anotace
						var type = annotationExtensionChrome.attributes.selectedAttrType;
						annotationExtensionChrome.attributes.selectAttributes(type, interfaceID, false, true, false);
						
						annotationExtensionChrome.attributes.showOrHideAddAttrToAttrButtonByID(interfaceID);
						
						annotationExtensionChrome.bottomAnnotationWindow.setTextSelectionListener(true);
						annotationExtensionChrome.selectedText.selectText();
				}
		}
}

/**
 * Nastavi atributu "id" do property aLink
 * @param {String} id, id atributu, kteremu se ma nastavit aLink
 * @param {String} aLink
 */
function setALinkToAttributeProp(id, aLink)
{
		annotationExtensionChrome.attrDatasource.changeResourceProp(id, 'aLink', aLink);		
}

/**
 * Skryje anotace v dokumentu, krom daneho typu.
 * @param {String} type, typ ktery ma zustat "aktivni"
 * @param {String} color, barva jako se ma "aktivni" typ zobrazit
 * @param {document} doc, dokument, ve kterem se nachazeji fragmenty anotace
 */
function hideAnnotationsExceptType(type, color, doc)
{
		var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;

		for each (var annotation in annotDB.annotations)
		{//Pro vsechny anotace v databazi
				var annotSpans = doc.getElementsByName(annotation.id);

				if (annotation.type == type && annotation.tmpId == null)
				{//Je to dany typ a zaroven neni nabidnuta anotace
						for (var i = 0; i < annotSpans.length; i++)
						{//Pro vsechny spany(fragmenty) anotace
								var span = annotSpans[i];
								
								span.setAttribute('active', true);
                $(span).css("background-color",color);
								pushFragmentColor(span, color, 'aLinkColor');
						}
				}
				else
				{
						for (var i = 0; i < annotSpans.length; i++)
						{//Pro vsechny spany(fragmenty) anotace
								var span = annotSpans[i];
								
								span.setAttribute('active', false);
                $(span).css("background-color","");
								$(span).css("border",  "0px solid #000000");
						}
				}
		}
}

/**
 * Zobrazi v dokumentu pouze anotace 1. urovne
 * @param {document} doc, dokument, ve kterem se nachazeji fragmenty anotaci
 */
function showMainAnnotations(doc)
{
		var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;

		for each (var annotation in annotDB.annotations)
		{//Pro vsechny anotace v databazi
				var annotSpans = doc.getElementsByName(annotation.id);
				
				if (!annotation.nested_id)
				{//Anotace nema definovany atribut nested_id(ke ktere anotaci patri) - jde o anotaci nejvyssi urovne						
						for (var i = 0; i < annotSpans.length; i++)
						{//Pro vsechny spany(fragmenty) anotace
								var span = annotSpans[i];
								
								removeFragmentColorByID(span, 'aLinkColor');
								
								var color = getFragmentColorByID(span, annotation.id);
                if (color == "")
                {
                    var type = annotation.type;
                    var typeName = annotationExtension.functions.linearTypeURI(type);
                    color = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, 0);
                }
								span.setAttribute('active', true);
                $(span).css("background-color",color);
                if (annotation.tmpId != null && annotation.tmpId != undefined)
                   $(span).css("border", "1px dashed " + annotationExtension.SUGGESTED_BORDER_COLOR);   
						}
				}
				else
				{
						for (var i = 0; i < annotSpans.length; i++)
						{
								var span = annotSpans[i];
								
								removeFragmentColorByID(span, 'aLinkColor');
		
								span.setAttribute('active', false);
                $(span).css("background-color","");
                $(span).css("border",  "0px solid #000000");

								//Pokud by byla nastavena barva fragmentu, odstran ji
								removeFragmentColorByID(span, annotation.id);
						}
				}
    }
}