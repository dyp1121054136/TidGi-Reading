/*\
title: $:/plugins/ahanniga/context-menu/ContextListener.js
type: application/javascript
module-type: widget

这个小组件为tiddlers实现了上下文菜单
\*/

(function () {

    // 在上下文菜单HTML中存储tiddler文本值时使用
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
    var template = `<div id="contextMenu" class="context-menu" style="display: none; z-index: 9999;"></div>`;

    var ContextListener = function (parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    ContextListener.prototype = new Widget();


    // 主要渲染函数？同时也在DOM父元素上附加了上下文菜单事件处理程序以及点击处理程序来隐藏上下文菜单
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
		
		// 获取修饰键设置
		const ctrlOverride = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/ctrl-override", "yes") === "yes" ? true : false;
		const altOverride = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/alt-override", "yes") === "yes" ? true : false;
		const shiftOverride = $tw.wiki.getTiddlerText("$:/plugins/phiv/context-menu-selection-addin/config/shift-override", "yes") === "yes" ? true : false;
       
        // 如果用户按下了正确的修饰键，则覆盖上下文菜单，改为显示浏览器上下文菜单
        if ((event.ctrlKey && ctrlOverride) || (event.shiftKey && shiftOverride) || (event.altKey && altOverride) ) {
				return true;
        }
        // 如果Saq的链接上下文菜单存在并已触发
        if($tw.wiki.getTiddler("$:/state/sq/links-context-menu/")) { 
				return true;
        }

        // 如果菜单不存在，创建并追加到文档主体
        if (menu == null) {
            this.document.body.appendChild(htmlToElement(template));
            menu = document.getElementById("contextMenu");
            menu.addEventListener("click", function (event) { self.menuClicked.call(self, event) });
			menu.addEventListener("submit", function (event) { self.menuClicked.call(self, event) });
        }
        menu.innerHTML = "";

        // Streams节点兼容性
        // 最近包含属性[data-node-title]的DOM元素
        const node = event.target.closest("[data-node-title]");
        const nodeTitle = node && node.dataset["nodeTitle"];

        const closestTarget = event.currentTarget.closest("[data-tiddler-title]");

        // 如果事件不是在Streams节点上的常规逻辑
        targ = nodeTitle || closestTarget.getAttribute("data-tiddler-title"); // 基于视图模板中包含currentTiddler的div属性
        const tiddlerText=$tw.wiki.getTiddlerText(targ);

        const sTarg = sanitize(targ);
        const menuHtml = [`<form targ="${sTarg}"><ul>`];
        const titles = $tw.wiki.getTiddlersWithTag("$:/tags/tiddlercontextmenu");

        // 预先计算文本匹配的数量，以便设置格式化菜单项的样式
        // 首先转义选中文本中的特殊字符
        const re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection.trim())+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g");
        const match_count = (selection.trim().length==0)?0:(tiddlerText.match(re) || []).length; // 如果没有匹配项，则禁用标记
		

        // 预先计算文本匹配的数量，以便设置清除格式化菜单项的样式
        // 这个正则表达式查找特定行格式包裹选中文本
        const clear_re = new RegExp("([\\/'_~\\^,]{2}|`|@@\\.[A-Za-z]+ )"+escapeRegex(selection.trim())+"?(\\1|@@)","g");
        const clear_match_count = (selection.trim().length==0)?0:(tiddlerText.match(clear_re) || []).length;
        
        for (var a = 0; a < titles.length; a++) {
            tid = $tw.wiki.getTiddler(titles[a]);
            showHide = tid.getFieldString("text", "hide");
            
            // 菜单项tiddlers可以在条件字段中控制它们的显示；如果条件不满足
            // 该条目将被隐藏
            condition = tid.getFieldString("condition")===""?"[["+titles[a]+"]]":  tid.getFieldString("condition");
            hideme = ($tw.wiki.filterTiddlers(condition).length==0 || showHide !== "show")?"hideme":"";
            action = sanitize(tid.getFieldString("tm-message", "tm-dummy")); // 这个变量将插入到HTML标签中，因此需要净化

            // 这个变量将插入到HTML标签中，因此需要净化
            label = sanitize(tid.getFieldString("caption", "未标记选项"))+ ((action==="tm-clear" && clear_match_count>1)?" ("+clear_match_count+" 个匹配)":"") + ((action==="tm-markup" && match_count>1)?" ("+match_count+" 个匹配)":"");

            //icon = $tw.wiki.getTiddlerText(tid.getFieldString("icon", "$:/core/images/blank"));
            icon = $tw.wiki.renderText("text/html","text/vnd.tiddlywiki",$tw.wiki.getTiddlerText(tid.getFieldString("icon", "$:/core/images/blank")),{
            		parseAsInline: mode !== "block"
            	});
            //console.log("icon:"+tid.getFieldString("icon", "$:/core/images/blank"));
            separator = tid.fields["separate-after"] === undefined ? "" : "menu-separator";

if (action === "tm-quick-editfix") {
    // 预先计算未修剪文本的匹配数量，以便设置格式化菜单项的样式
    const qe_re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection)+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g"); // 首先转义选中文本中的特殊字符
    const qe_match_count = (selection.length === 0) ? 0 : (tiddlerText.match(qe_re) || []).length; // 如果没有匹配项，则禁用标记
    decorator = ((qe_match_count === 0) ? "item-disabled" : ((qe_match_count > 1) ? "red" : "green"));

    // 获取当前时间并格式化为 "YYYY-0MM-0DD 0hh:0mm:0ss"
    const getCurrentTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 月份是从0开始的
        const day = now.getDate();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // 格式化月份、日期、小时、分钟、秒数，确保它们前面有0
        const formattedMonth = month < 10 ? `0${month}` : month;
        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedHours = hours < 10 ? `0${hours}` : hours;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

        return `"${year}${formattedMonth}${formattedDay}${formattedHours}${formattedMinutes}${formattedSeconds}"`;
    };

    // 后缀的值，包含当前时间
    const suffix = "<<bookmark " + getCurrentTime() + ">>";

// 从wiki存储中获取是否添加后缀的配置
const addSuffixConfig = $tw.wiki.getTiddlerText("$:/quick-editfix/bookmark", "yes");
const addSuffix = addSuffixConfig === "yes" ? true : false;

    // 将后缀添加到选中文本的后面，如果addSuffix为true
    const editedSelection = addSuffix ? selection + suffix : selection;

    menuHtml.push(`<li class="${separator}${hideme} ${decorator}"><label>修改: ` + ((qe_match_count > 1) ? "(" + qe_match_count + ")" : "") + `</label><input type="hidden" id="selectionStore" value="${sanitize(selection)}" /><input type="text" id="quick-editfix" value="${sanitize(editedSelection)}" /></li>`);
}

else if (action==="tm-new-tiddler") {
    // 处理tiddler已经存在的情况，并将标签更改为"Link to tiddler"
    var existingTitle = ($tw.wiki.filterTiddlers("[match["+selection+"]]").length>0 ||$tw.wiki.filterTiddlers("[match["+toTitleCase(selection)+"]]").length>0);

    label = (existingTitle)?("Link to tiddler"):(sanitize(tid.getFieldString("caption", "未标记选项"))) +  ((match_count>1)?" ("+match_count+" 个匹配)":"");
    menuHtml.push(`<li  class="${separator}${hideme} ${decorator}"><a action=`+((existingTitle)?"tm-link":"tm-new-tiddler") +` targ="${sTarg}" menu_source="${titles[a]}" href="#!">${icon} ${label}</a></li>`);
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

    menuHtml.push(`<li  class="${separator}${hideme} ${decorator}${clear_decorator}"><a action="${action}" targ="${sTarg}" menu_source="${titles[a]}" href="#!">${icon} ${label}</a></li>`);
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
//document.getElementById('quick-editfix').select(); //这是一个不错的触摸，但是原始选择消失了
event.preventDefault();
return false;
};

// 菜单项点击或提交事件的处理程序
ContextListener.prototype.menuClicked = function (event) {
	
    const action = event.target.getAttribute("action"); // 定义动作和参数的tiddler
    const targ = event.target.getAttribute("targ");

    const actionTid = $tw.wiki.getTiddler(event.target.getAttribute("menu_source"));
    const mode = (actionTid?actionTid.getFieldString("mode","link"):"link");
    const markup_prefix = (actionTid?actionTid.getFieldString("markup-prefix",""):"");
    const markup_suffix = (actionTid?actionTid.getFieldString("markup-suffix",""):"");
	
    // 用户点击输入/标签时，选择会被重置，所以我们将其存储在隐藏的输入中
    const selectionStore = document.getElementById("selectionStore");
    const selection = (selectionStore != null)?selectionStore.value:"";
	
    const qe_input = (document.getElementById("quick-editfix")!=null)?document.getElementById("quick-editfix").value:"";
    const text=$tw.wiki.getTiddlerText(targ);
	
    var stid, state, ptid;

    // 用户在输入字段中按下了回车键
    if (event.type=="submit"){ // 快速编辑按下回车键

        // 我们需要将selection替换为qe_input文本，在源tiddler的文本中
        if (selection.length > 0 && (qe_input !== selection)) {

            const qe_re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection)+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g");
            $tw.wiki.setText(targ,"text",null,text.replace(qe_re,qe_input));
        }
        this.hideMenu();
        event.preventDefault();
        return false;
		
		// 用户点击标签或输入（忽略）
		} else if (event.target.tagName.toLowerCase() !== 'a') { // 拦截点击除锚点（标签，输入）之外的所有内容
			event.stopPropagation(); return false;
		}
		
		
		// 以下为上下文菜单项点击的常规处理
		
		// 匹配所有常规单词匹配，避免其他wikitext装饰
        const re = new RegExp("(?<!<<[^>]*|{{[^}]*|\\\\define[^\n]*)"+escapeRegex(selection.trim())+"(?![^<]*>>|}}[^{]*|[.\n]*\\\\end)","g");
        const rg = /\\n/g; // 用于解释\n字符
        const clear_re = new RegExp("([\\/'_~\\^,]{2}|`|@@\\.[A-Za-z]+ )"+escapeRegex(selection.trim())+"?(\\1|@@)","g"); 
		
		// 来自菜单项的常规操作，除了快速编辑

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
				// 只有当选择项与现有tiddler完全匹配或经过标题转换匹配现有tiddler时，才可能创建链接
				// 测试是否为直接匹配
				if (selection.trim().length > 0 && $tw.wiki.filterTiddlers("[match["+selection.trim()+"]]").length > 0) {
					$tw.wiki.setText(targ,"text",null,text.replace(re,"[["+selection.trim()+"]]")); // 直接匹配
				} else {
					// 如果选择项与现有tiddler不完全匹配或经过标题转换后也不匹配现有tiddler，则创建间接链接
					$tw.wiki.setText(targ,"text",null,text.replace(re,"[["+selection.trim()+"|"+toTitleCase(selection.trim())+"]]")); // 间接匹配
				}
				break;
			case "tm-excise":
				var newTitle = $tw.wiki.generateNewTitle(targ);
				newTitle = newTitle || $tw.wiki.getTiddlerText("$:/language/DefaultNewTiddlerTitle");
				$tw.wiki.addTiddler(new$tw.Tiddler({title: newTitle}));
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