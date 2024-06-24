/*\
title: $:/modules/startup/count.js
type: application/javascript
module-type: startup

在TiddlyWiki中搜索文本并统计匹配结果数量
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块名称和同步状态
exports.name = "count";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 启动函数
exports.startup = function() {
  // 为根部件添加tm-count事件监听器
  $tw.rootWidget.addEventListener("tm-count",function(event) {
    // 从事件参数对象中提取参数
    var sourceTitle = event.paramObject.source, // 源tiddler标题
        search = event.paramObject.search, // 搜索的文本
        regex = event.paramObject.regex === "yes", // 是否使用正则表达式
        countTitle = event.paramObject.countTitle; // 存储计数的tiddler标题

    // 检查是否提供了必要的参数
    if (!sourceTitle || !search || !countTitle) {
      console.error("tm-count事件缺少参数");
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

    // 执行搜索并计数
    var matches = text.match(regExp);
    var count = matches ? matches.length : 0;

    // 将计数结果保存到指定的tiddler
    $tw.wiki.setText(countTitle, "text", null, count.toString());
  });
};

})();