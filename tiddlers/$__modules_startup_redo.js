/*\
title: $:/modules/startup/redo.js
type: application/javascript
module-type: startup

注册重做功能

\*/
(function(){

exports.name = "redo";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
  // 监听tm-redo事件
  $tw.rootWidget.addEventListener("tm-redo", function(event) {
    // 检查是否有可用的重做文本
    var redoText = $tw.wiki.getTiddlerText("$:/state/searchNreplace/redo");
    if (redoText) {
      // 恢复源tiddler的文本到重做文本
      var sourceTitle = event.paramObject.source || $tw.wiki.getTiddlerText("$:/state/searchNreplace/source");
      $tw.wiki.setText(sourceTitle, "text", null, redoText);
    }
  });
};

})();