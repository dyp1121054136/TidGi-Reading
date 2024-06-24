/*\
title: $:/core/modules/editor/operations/text/save-all.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to select the entire text and save it to a specified tiddler and field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["save-all"] = function(event,operation) {
	var tiddler = event.paramObject.tiddler,
		field = event.paramObject.field || "text";
	if(tiddler && field) {
		operation.cutStart = 0;
		operation.cutEnd = operation.text.length;
		this.wiki.setText(tiddler, field, null, operation.text );
	}
};

})();