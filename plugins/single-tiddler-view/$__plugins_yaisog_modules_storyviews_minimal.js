/*\
title: $:/core/modules/storyviews/minimal.js
type: application/javascript
module-type: storyview

Views the story as a linear sequence, without any animations

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MinimalStoryView = function(listWidget) {
	this.listWidget = listWidget;
};

MinimalStoryView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listWidget.findListItem(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listItemWidget = this.listWidget.children[listElementIndex],
		targetElement = listItemWidget.findFirstDomNode();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		return;
	}
	targetElement.scrollIntoView();
};

MinimalStoryView.prototype.remove = function(widget) {
	if(typeof widget.destroy === 'function') {
		widget.destroy();
	} else {
		widget.removeChildDomNodes();
	}
};

exports.minimal = MinimalStoryView;

})();
