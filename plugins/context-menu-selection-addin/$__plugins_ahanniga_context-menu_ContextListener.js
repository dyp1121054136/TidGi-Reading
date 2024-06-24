/*\
title: $:/plugins/ahanniga/context-menu/ContextListener.js
type: application/javascript
module-type: widget

This widgets implements context menus to tiddlers
\*/

(function () {

	//used when storing text values from tiddler in context menu HTML
    var sanitize = function (string) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            "/": '&#x2F;',
        };
        const reg = /[&<>"'/]/ig;
		//const reg = /[&<>"']/ig;
        return string.replace(reg, (match) => (map[match]));
    };

    function escapeRegex(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
	
    var toTitleCase = function (str) {
        return str.replace(/\S+/g, str => str.charAt(0).toUpperCase() + str.substr(1).toLowerCase());
    }

    var htmlToElement = function (html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var template = `<div id="contextMenu" class="context-menu" style="display: none; z-order: 9999;"></div>`;

    var ContextListener = function (parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };


    ContextListener.prototype = new Widget();


    //main rendering function?; also attaches the context menu event handler on DOM parent as well as click handler to hide the context menu
    ContextListener.prototype.render = function (parent, nextSibling) {
        this.parentDomNode = parent;
        var self = this;
        parent.addEventListener("contextmenu", function (event) { self.contextmenu.call(self, event) });
        document.onclick = this.hideMenu;
    };

    ContextListener.prototype.contextmenu = function (event) {
        var self = this;
        var menu = document.getElementById("contextMenu");
        const selection = document.getSelection().toString();
		var label, action, icon, tid, targ, showHide, separator, decorator, condition, hideme, mode;
		
		//fetch modifier key settings
		const ctrlOverride = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/ctrl-override", "yes") === "yes" ? true : false;
		const altOverride = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/alt-override", "yes") === "yes" ? true : false;
		const shiftOverride = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/shift-override", "yes") === "yes" ? true : false;
       
        //override the context menu if the user presses the correct modifier key; to instead show browser context menu
        if ((event.ctrlKey && ctrlOverride) || (event.shiftKey && shiftOverride) || (event.altKey && altOverride) ) {
				return true;
        }
        //Saq's links context menu present and triggered
        if($tw.wiki.getTiddler("$:/state/sq/links-context-menu/")) { 
				return true;
        }

        //if menu doesn't exist, create and append it to document body
        if (menu == null) {
            this.document.body.appendChild(htmlToElement(template));
            menu = document.getElementById("contextMenu");
            menu.addEventListener("click", function (event) { self.menuClicked.call(self, event) });
			menu.addEventListener("submit", function (event) { self.menuClicked.call(self, event) });
        }
        menu.innerHTML = "";


        //Streams node compatibility 
        //nearest DOM element that contains this attribute [data-node-title]
        const node = event.target.closest("[data-node-title]"); 
        const nodeTitle = node && node.dataset["nodeTitle"];

        const closestTarget = event.currentTarget.closest("[data-tiddler-title]");

        //regular logic if the event was not on a Streams node
        targ = nodeTitle || closestTarget.getAttribute("data-tiddler-title"); //based on the div attribute in view template that contains currentTiddler		
        const tiddlerText=$tw.wiki.getTiddlerText(targ);

		const sTarg = sanitize(targ);
        const menuHtml = [`<form targ="${sTarg}"><ul>`];
        const titles = $tw.wiki.getTiddlersWithTag("$:/tags/tiddlercontextmenu");

        //pre-compute number of text matches in order to set the formatting menu items' style
		//escape the special characters in text selection first
        const re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection.trim())+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g"); 
        const match_count = (selection.trim().length==0)?0:(tiddlerText.match(re) || []).length; //disable markup if there are no matches
		

        //pre-compute number of text matches in order to set the clear formatting menu item's style
        //this regular expression looks for specific line format wrapping around the text selection
        const clear_re = new RegExp("([\\/'_~\\^,]{2}|`|@@\\.[A-Za-z]+ )"+escapeRegex(selection.trim())+"?(\\1|@@)","g"); 
        const clear_match_count = (selection.trim().length==0)?0:(tiddlerText.match(clear_re) || []).length;
        
        for (var a = 0; a < titles.length; a++) {
            tid = $tw.wiki.getTiddler(titles[a]);
            showHide = tid.getFieldString("text", "hide");
            
            //menu item tiddlers can have a condition field that controls their appearance; if the condition is not met
            //the entry will be hidden
            condition = tid.getFieldString("condition")===""?"[["+titles[a]+"]]":  tid.getFieldString("condition");
            hideme = ($tw.wiki.filterTiddlers(condition).length==0 || showHide !== "show")?"hideme":"";
            action = sanitize(tid.getFieldString("tm-message", "tm-dummy")); //this variable will be inserted into HTML tag, hence sanitize

			//this variable will be inserted into HTML tag, hence sanitize
            label = sanitize(tid.getFieldString("caption", "Unlabelled Option"))+ ((action==="tm-clear" && clear_match_count>1)?" ("+clear_match_count+" matches)":"") + ((action==="tm-markup" && match_count>1)?" ("+match_count+" matches)":""); 

            //icon = $tw.wiki.getTiddlerText(tid.getFieldString("icon", "$:/core/images/blank"));
            icon = $tw.wiki.renderText("text/html","text/vnd.tiddlywiki",$tw.wiki.getTiddlerText(tid.getFieldString("icon", "$:/core/images/blank")),{
            		parseAsInline: mode !== "block"
            	});
            //console.log("icon:"+tid.getFieldString("icon", "$:/core/images/blank"));
            separator = tid.fields["separate-after"] === undefined ? "" : "menu-separator";

            if (action==="tm-quick-edit" ) {
				//pre-compute number of _untrimmed_ text matches in order to set the formatting menu items' style
				const qe_re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection)+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g"); //escape the special characters in text selection first
				const qe_match_count = (selection.length==0)?0:(tiddlerText.match(qe_re) || []).length; //disable markup if there are no matches
				decorator = ((qe_match_count==0)?"item-disabled":((qe_match_count>1)?"red":"green"));

				menuHtml.push(`<li class="${separator} ${hideme} ${decorator}"><label>Quick edit: `+((qe_match_count>1)?("("+qe_match_count+")"):"")+`</label><input type="hidden" id="selectionStore" value="`+sanitize(selection)+`" /><input type="text" id="quick-edit" value="`+sanitize(selection)+`" /></li>`);
				
			} else if (action==="tm-new-tiddler") {
					//let's handle cases for which the tiddler already exists, and change the label to "Link to tiddler"
					var existingTitle = ($tw.wiki.filterTiddlers("[match["+selection+"]]").length>0 || $tw.wiki.filterTiddlers("[match["+toTitleCase(selection)+"]]").length>0);

					label = (existingTitle)?("Link to tiddler"):(sanitize(tid.getFieldString("caption", "Unlabelled Option"))) +  ((match_count>1)?" ("+match_count+" matches)":"");
					menuHtml.push(`<li  class="${separator} ${hideme} ${decorator}"><a action=`+((existingTitle)?"tm-link":"tm-new-tiddler") +` targ="${sTarg}" menu_source="${titles[a]}" href="#!">${icon} ${label}</a></li>`);
			} else {
				if (action==="tm-markup" || action==="tm-excise") {
					decorator = (match_count==0)?"item-disabled":((match_count>1)?"red":"green");
				} else { 
					decorator = ""; 
				}
				if (action==="tm-clear") {
					clear_decorator = (clear_match_count==0)?"item-disabled":((clear_match_count>1)?"red":"green");
				} else {
					clear_decorator = "";
				}

				menuHtml.push(`<li  class="${separator} ${hideme} ${decorator} ${clear_decorator}"><a action="${action}" targ="${sTarg}" menu_source="${titles[a]}" href="#!">${icon} ${label}</a></li>`);
			}

        }

        menuHtml.push("</ul></form>");
        menu.append(htmlToElement(menuHtml.join("")))

        if (menu.style.display == "block") {
            this.hideMenu();
        } else {
            menu.style.display = 'block';
            menu.style.left = event.pageX + "px";
            menu.style.top = event.pageY + "px";
        }
        //document.getElementById('quick-edit').select(); //nice touch, however the original selection vanishes
        event.preventDefault();
        return false;
    };
	
    //even handler for clicks on menu items or submit events
    ContextListener.prototype.menuClicked = function (event) {
		
        const action = event.target.getAttribute("action"); //the tiddler that defines the action and parameters
        const targ = event.target.getAttribute("targ");

	    const actionTid = $tw.wiki.getTiddler(event.target.getAttribute("menu_source"));
		const mode = (actionTid?actionTid.getFieldString("mode","link"):"link");
        const markup_prefix = (actionTid?actionTid.getFieldString("markup-prefix",""):"");
        const markup_suffix = (actionTid?actionTid.getFieldString("markup-suffix",""):"");
		
		//selection gets reset when user clicks input/label, so we stored it in a hidden input
        const selectionStore = document.getElementById("selectionStore");
		const selection = (selectionStore != null)?selectionStore.value:"";
		
		const qe_input = (document.getElementById("quick-edit")!=null)?document.getElementById("quick-edit").value:"";
        const text=$tw.wiki.getTiddlerText(targ);
		
        var stid, state, ptid;

		//user presses enter in input field
	    if (event.type=="submit"){ //quick edit enter key pressed

			//we need to replace the selection, with qe_input text, in source tiddler's text
			if (selection.length > 0 && (qe_input !== selection)) {

				const qe_re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection)+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g");
				$tw.wiki.setText(targ,"text",null,text.replace(qe_re,qe_input));
			}
			this.hideMenu();
			event.preventDefault();
			return false;
		
		//user clicks on label or input (ignore)
		} else if (event.target.tagName.toLowerCase() !== 'a') { //intercept clicks on anything but anchors (label, input)
			event.stopPropagation(); return false;
		}
		
		
		//regular handling below for clicks on context menu items
		
		//match all regular word matches, avoiding other wikitext decoration
        const re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection.trim())+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g");
        const rg = /\\n/g; //used to interpret the \n characters
        const clear_re = new RegExp("([\\/'_~\\^,]{2}|`|@@\\.[A-Za-z]+ )"+escapeRegex(selection.trim())+"?(\\1|@@)","g"); 
		
		//regular action from menu items other than quick edit

		this.hideMenu();
		switch (action) {
			case "tm-fold-tiddler":
				stid = `$:/state/folded/${targ}`;
				state = $tw.wiki.getTiddlerText(stid, "show") === "show" ? "hide" : "show";
				$tw.wiki.setText(stid, "text", null, state);
				break;
			case "tm-copy-to-clipboard":
				this.dispatchEvent({ type: action, param: selection});
				break;
			case "tm-add-tag":
				this.dispatchEvent({ type: action, param: selection});
				break;
			case "tm-print":
				this.dispatchEvent({ type: action, event: event });
				break;
			case "tm-unfold-all-tiddlers":
				this.dispatchEvent({ type: action, param: targ, foldedStatePrefix: "$:/state/folded/" });
				break;
			case "tm-new-tiddler":
				var convertCase = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/title-case", "yes") === "yes" ? true : false;
				var caseInversion = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/ctrl-case-override", "yes") === "yes" ? true : false;

				var newTitle = ((convertCase && !(caseInversion && event.ctrlKey)) || (!convertCase && (caseInversion && event.ctrlKey)))?toTitleCase(selection.trim()):selection.trim();

				this.dispatchEvent({ type: "tm-new-tiddler", paramObject: {title: newTitle }});
				if (selection.trim().length > 0) {$tw.wiki.setText(targ,"text",null,text.replace(re,"[["+selection.trim()+(selection.trim()===newTitle?"]]":"|"+newTitle+"]]"))); }
				break;
			case "tm-link": 
				//this is only possible if either the selection has an exact match to an exiting tiddler or if the selection has a match to an existing tiddler after title case conversion
				//testing if it is a direct match
				if (selection.trim().length > 0 && $tw.wiki.filterTiddlers("[match["+selection.trim()+"]]").length > 0) {
					$tw.wiki.setText(targ,"text",null,text.replace(re,"[["+selection.trim()+"]]")); //direct match
				} else {
					$tw.wiki.setText(targ,"text",null,text.replace(re,"[["+selection.trim()+"|"+toTitleCase(selection.trim())+"]]")); //indirect match
				}
				break;
			case "tm-excise":
				var newTitle = $tw.wiki.generateNewTitle(targ);
				newTitle = newTitle || $tw.wiki.getTiddlerText("$:/language/DefaultNewTiddlerTitle");
				$tw.wiki.addTiddler(new $tw.Tiddler({title: newTitle}));
				this.dispatchEvent({ type: "tm-new-tiddler", paramObject: {title: newTitle, text: selection.trim()}});
				if (selection.trim().length > 0) {$tw.wiki.setText(targ,"text",null,text.replace(re,((mode==="link")?"[[":"{{")+ newTitle +((mode==="link")?"]]":"}}"))); }
				break;
			case "tm-markup":
				if (selection.trim().length > 0) {$tw.wiki.setText(targ,"text",null,text.replace(re,markup_prefix.replace(rg,"\n")+selection.trim()+markup_suffix.replace(rg,"\n")));}
				break;
			case "tm-clear":
				if (selection.trim().length > 0) {$tw.wiki.setText(targ,"text",null,text.replace(clear_re,selection.trim()));}
				break;
			case "tm-search":
				if (selection.trim().length > 0) $tw.wiki.setText("$:/state/tab--1498284803","text",null,"$:/core/ui/AdvancedSearch/Standard");
				if (selection.trim().length > 0) {$tw.wiki.setText("$:/temp/advancedsearch","text",null,selection.trim());}
				if (selection.trim().length > 0) {$tw.wiki.setText("$:/temp/advancedsearch/input","text",null,selection.trim());}
				this.dispatchEvent({ type: "tm-navigate", navigateTo: "$:/AdvancedSearch"});
				break;
			case "tm-clear":
				if (selection.trim().length > 0) {$tw.wiki.setText(targ,"text",null,text.replace(clear_re,selection.trim()));}
				break;
			case "sp-print-river":
				var curEntries = [];
				ptid = $tw.wiki.getTiddler("$:/PrintList");
				if(ptid !== undefined) {
					var list = ptid.getFieldList("list");
					if(Array.isArray(list) && list.indexOf(targ) < 0) {
						for(a = 0; a < list.length; a++) {
							curEntries.push(list[a]);
						}
					}
				}
				curEntries.push(targ);
				$tw.wiki.setText("$:/PrintList", "list", 0, curEntries);
				$tw.rootWidget.dispatchEvent({ type: 'tm-open-window', param: '$:/plugins/BTC/PrintRiver/ui/Templates/PrintRiver' });
				break;
			case "tm-new-here":
				this.dispatchEvent({ type: "tm-new-tiddler", paramObject: {tags: targ}});
				break;
			default:
				this.dispatchEvent({ type: action, param: targ });
		}

        event.preventDefault();
        return false;
    };

    ContextListener.prototype.refresh = function (changedTiddlers) {
        return false;
    };

    ContextListener.prototype.hideMenu = function () {
        var menu = document.getElementById("contextMenu");
        if (menu != null) {
            menu.style.display = "none";
        }
    };

    exports.contextMenu = ContextListener;

})();