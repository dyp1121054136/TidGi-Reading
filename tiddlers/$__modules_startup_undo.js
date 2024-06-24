/*\
title: $:/modules/startup/undo.js
type: application/javascript
module-type: startup

注册撤销功能

\*/
(function(){

exports.name = "undo";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
  // 监听tm-undo事件
  $tw.rootWidget.addEventListener("tm-undo", function(event) {
    // 获取当前tiddler的标题
    var sourceTitle = event.paramObject.source || $tw.wiki.getTiddlerText("$:/state/searchNreplace/source");
    // 获取当前tiddler的文本，以便在重做时使用
    var currentText = $tw.wiki.getTiddlerText(sourceTitle);
    
    // 检查是否有可用的撤销文本
    var undoText = $tw.wiki.getTiddlerText("$:/state/searchNreplace/undo");
    if (undoText) {
      // 在撤销之前，将当前状态保存到重做tiddler
      $tw.wiki.setText("$:/state/searchNreplace/redo", "text", null, currentText);
      
      // 恢复源tiddler的文本到撤销文本
      $tw.wiki.setText(sourceTitle, "text", null, undoText);
    }
  });
};

})();