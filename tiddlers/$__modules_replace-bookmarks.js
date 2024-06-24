/*\
title: $:/modules/replace-bookmarks.js
type: application/javascript
module-type: startup

为TiddlyWiki中的书签添加时间戳
\*/

(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块信息
exports.name = "replace-bookmarks";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 定义替换书签的函数
var replaceBookmarks = function(tiddlerTitle) {
  // 获取当前条目的文本
  var text = $tw.wiki.getTiddlerText(tiddlerTitle);
  // 定义书签正则表达式
  var bookmarkRegExp = /<<bookmark ([^\s]*)>>/g;
  // 查找所有匹配的书签
  var bookmarks = text.match(bookmarkRegExp);

  // 如果有书签，则替换它们
  if (bookmarks && bookmarks.length > 0) {
    var currentDate = new Date();
    bookmarks.forEach(function(bookmark, index) {
      // 为每个书签生成唯一的时间戳
      var timestamp = new Date(currentDate.getTime() + index * 1000);
      var YYYY = timestamp.getFullYear();
      var MM = ('0' + (timestamp.getMonth() + 1)).slice(-2);
      var DD = ('0' + timestamp.getDate()).slice(-2);
      var hh = ('0' + timestamp.getHours()).slice(-2);
      var mm = ('0' + timestamp.getMinutes()).slice(-2);
      var ss = ('0' + timestamp.getSeconds()).slice(-2);
      var formattedTimestamp = YYYY + MM + DD + hh + mm + ss;
      // 替换当前书签
      text = text.replace(bookmark, '<<bookmark "' + formattedTimestamp + '">>');
    });

    // 保存修改后的文本回条目
    $tw.wiki.setText(tiddlerTitle, "text", null, text);
  }
};

// 启动函数
exports.startup = function() {
  // 添加事件监听器
  $tw.rootWidget.addEventListener("tm-replace-bookmarks", function(event) {
    var tiddlerTitle = event.paramObject.title;
    if (tiddlerTitle) {
      replaceBookmarks(tiddlerTitle);
    } else {
      console.error("tm-replace-bookmarks事件缺少参数 'title'");
    }
  });
};

})();