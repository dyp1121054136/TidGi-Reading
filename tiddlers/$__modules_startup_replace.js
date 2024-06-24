/*\
title: $:/modules/startup/replace.js
type: application/javascript
module-type: startup

在TiddlyWiki中搜索和替换文本

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块名称和同步状态
exports.name = "replace";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 启动函数
exports.startup = function() {
  // 为根部件添加tm-replace事件监听器
  $tw.rootWidget.addEventListener("tm-replace", function(event) {
    // 从事件参数对象中提取参数
    var sourceTitle = event.paramObject.source,
        search = event.paramObject.search,
        replace = event.paramObject.replace,
        global = event.paramObject.global !== "no",
        regex = event.paramObject.regex === "yes",
        destinationTitle = event.paramObject.destination || sourceTitle,
        prefix = event.paramObject.prefix,
        suffix = event.paramObject.suffix;

    // 验证必要的参数
    if (!sourceTitle || !search) {
      console.error("tm-replace事件缺少参数: sourceTitle 或 search");
      return;
    }

    // 获取源tiddler的文本
    var text = $tw.wiki.getTiddlerText(sourceTitle);
    if (!text) {
      console.error("未找到源tiddler:", sourceTitle);
      return;
    }

    // 保存源文本到撤销状态tiddler
    $tw.wiki.setText("$:/state/searchNreplace/undo", "text", null, text);

    // 构建正则表达式
    var modifiers = global ? 'g' : '';
    var pattern = regex ? search : $tw.utils.escapeRegExp(search);
    var regExp = new RegExp(pattern, modifiers);

    // 执行搜索和替换
    var replacedText;
    if (prefix || suffix) {
      // 如果提供了前缀或后缀，使用replace方法添加前缀和后缀
      replacedText = text.replace(regExp, function(match) {
        return prefix + match + suffix;
      });
    } else {
      // 直接使用replace方法
      replacedText = text.replace(regExp, replace);
    }

    // 将替换后的文本保存到目标tiddler
    $tw.wiki.setText(destinationTitle, "text", null, replacedText);
  });
};

})();