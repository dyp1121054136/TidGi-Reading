/*\
title: $:/modules/add-result-suffix.js
type: application/javascript
module-type: startup

为TiddlyWiki中的搜索结果添加编号后缀，并清除所有后缀
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块信息
exports.name = "add-result-suffix";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 启动函数
exports.startup = function() {
  // 定义一个名为addSuffix的命令
  $tw.rootWidget.addEventListener("tm-add-suffix", function(event) {
    var sourceTitle = event.paramObject.source,
        search = event.paramObject.search,
        regex = event.paramObject.regex === "yes",
        countTitle = event.paramObject.countTitle;

    if (!sourceTitle || !search || !countTitle) {
      console.error("tm-add-suffix事件缺少参数");
      return;
    }

    var text = $tw.wiki.getTiddlerText(sourceTitle);
    if (!text) {
      console.error("未找到源tiddler:", sourceTitle);
      return;
    }

    var pattern = regex ? search : $tw.utils.escapeRegExp(search);
    var regExp = new RegExp(pattern, 'g');

    var index = 0;
    var suffixedText = text.replace(regExp, function(match) {
      index++;
      var suffixNumber = ('' + index).slice(-3);
      // 使用宏调用代替直接插入HTML
      var suffixMacro = "<<result " + suffixNumber + ">>";
      return match + suffixMacro;
    });

    $tw.wiki.setText(sourceTitle, "text", null, suffixedText);
    $tw.wiki.setText(countTitle, "text", null, index.toString());
  });

  // 定义一个名为clearSuffix的命令
  $tw.rootWidget.addEventListener("tm-clear-suffix", function(event) {
    var sourceTitle = event.paramObject.source;

    if (!sourceTitle) {
      console.error("tm-clear-suffix事件缺少参数");
      return;
    }

    var text = $tw.wiki.getTiddlerText(sourceTitle);
    if (!text) {
      console.error("未找到源tiddler:", sourceTitle);
      return;
    }

    // 修改正则表达式以匹配宏调用
    var suffixRegExp = /<<result \d+>>/g;
    var clearedText = text.replace(suffixRegExp, '');

    $tw.wiki.setText(sourceTitle, "text", null, clearedText);
  });
};

})();