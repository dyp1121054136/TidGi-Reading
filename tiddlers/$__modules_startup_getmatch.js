/*\
title: $:/modules/startup/getmatch.js
type: application/javascript
module-type: startup

在TiddlyWiki中搜索文本并获取单个匹配结果
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块名称和同步状态
exports.name = "getmatch";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 启动函数
exports.startup = function() {
  // 为根部件添加tm-get-match事件监听器
  $tw.rootWidget.addEventListener("tm-get-match",function(event) {
    // 从事件参数对象中提取参数
    var sourceTitle = event.paramObject.source, // 源tiddler标题
        search = event.paramObject.search, // 搜索的文本
        regex = event.paramObject.regex === "yes", // 是否使用正则表达式
        stateTitle = event.paramObject.stateTitle; // 存储状态的tiddler标题

    // 检查是否提供了必要的参数
    if (!sourceTitle || !search || !stateTitle) {
      console.error("tm-get-match事件缺少参数");
      return;
    }

    // 获取源tiddler的文本
    var text = $tw.wiki.getTiddlerText(sourceTitle);
    if (!text) {
      console.error("未找到源tiddler:", sourceTitle);
      return;
    }

    // 构建正则表达式
    var pattern = regex ? search : $tw.utils.escapeRegExp(search);
    var regExp = new RegExp(pattern, 'g');

    // 执行搜索并获取匹配结果
    var matches = text.match(regExp);

    // 如果只有一个匹配结果，则保存到状态tiddler
    if (matches && matches.length === 1) {
      $tw.wiki.setText(stateTitle, "text", null, matches[0]);
    } else {
      // 如果没有匹配结果或匹配结果不止一个，则清空状态tiddler
      $tw.wiki.setText(stateTitle, "text", null, "");
    }
  });
};

})();