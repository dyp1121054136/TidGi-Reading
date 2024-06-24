/*\
title: $:/modules/add-line-anchors.js
type: application/javascript
module-type: startup

为TiddlyWiki中的当前条目每一行添加锚点
\*/

(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块信息
exports.name = "add-line-anchors";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 定义添加锚点的函数
var addAnchorsToLines = function(tiddlerTitle) {
  // 获取当前条目的文本
  var text = $tw.wiki.getTiddlerText(tiddlerTitle);

  // 创建撤销状态条目
  $tw.wiki.setText("$:/state/undo/add-line-anchors", "text", null, text);

  // 将文本按行分割
  var lines = text.split("\n");

  // 过滤掉空行
  var nonEmptyLines = lines.filter(function(line) {
    return line.trim() !== "";
  });

  // 为每一行添加锚点
  var anchoredLines = nonEmptyLines.map(function(line, index) {
    // 生成唯一的锚点ID，不包括空行
    var anchorId = index + 1; // 从1开始编号
    // 创建锚点HTML
    var anchor = `<<line-anchor "${anchorId}">>`;
    // 将锚点添加到行尾
    return line + anchor;
  });

  // 将带锚点的行合并回文本，保留空行
  var updatedText = lines.map(function(line) {
    if (line.trim() !== "") {
      return anchoredLines.shift(); // 添加锚点的非空行
    }
    return line; // 空行保持原样
  }).join("\n");

  // 保存修改后的文本回条目
  $tw.wiki.setText(tiddlerTitle, "text", null, updatedText);
};

// 定义清除锚点的函数
var clearAnchorsFromLines = function(tiddlerTitle) {
  // 获取当前条目的文本
  var text = $tw.wiki.getTiddlerText(tiddlerTitle);

  // 清除所有行尾的锚点，但保留行尾的空格和其他内容
  var clearedText = text.replace(/(\s*)<<line-anchor "[0-9]+">>$/gm, function(match, leadingSpaces) {
    // leadingSpaces 是行首的空格或缩进
    return leadingSpaces; // 返回行首的空格或缩进，移除锚点
  });

  // 保存修改后的文本回条目
  $tw.wiki.setText(tiddlerTitle, "text", null, clearedText);
};

// 启动函数
exports.startup = function() {
  // 添加事件监听器来添加锚点
  $tw.rootWidget.addEventListener("tm-add-line-anchors", function(event) {
    var tiddlerTitle = event.paramObject.title;
    if (tiddlerTitle) {
      addAnchorsToLines(tiddlerTitle);
    } else {
      console.error("tm-add-line-anchors事件缺少参数 'title'");
    }
  });

  // 添加事件监听器来清除锚点
  $tw.rootWidget.addEventListener("tm-clear-line-anchors", function(event) {
    var tiddlerTitle = event.paramObject.title;
    if (tiddlerTitle) {
      clearAnchorsFromLines(tiddlerTitle);
    } else {
      console.error("tm-clear-line-anchors事件缺少参数 'title'");
    }
  });
};

})();