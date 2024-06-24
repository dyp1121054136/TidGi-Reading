/*\
title: $:/modules/startup/count-characters.js
type: application/javascript
module-type: startup

统计TiddlyWiki当前条目的字数和字符数

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块名称和同步状态
exports.name = "count-characters";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 启动函数
exports.startup = function() {
  // 为根部件添加tm-count-characters事件监听器
  $tw.rootWidget.addEventListener("tm-count-characters", function(event) {
    // 从事件参数对象中提取参数
    var title = event.paramObject.title || "$:/temp/currentTiddler"; // 当前条目标题

    // 获取当前条目的文本
    var text = $tw.wiki.getTiddlerText(title);
    if (!text) {
      console.error("未找到条目:", title);
      return;
    }

    // 初始化计数器
    var totalChars = 0,
        chineseChars = 0,
        punctuation = 0,
        letters = 0,
        numbers = 0;

    // 遍历文本，统计字符
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      totalChars++;

      if (/[^\u4e00-\u9fa5]/.test(char)) { // 如果不是汉字
        if (/[，。！？；：“”‘’（）《》【】]/.test(char)) { // 全角标点
          punctuation++;
        } else if (/[a-zA-Z]/.test(char)) { // 字母
          letters++;
        } else if (/\d/.test(char)) { // 数字
          numbers++;
        }
      } else {
        chineseChars++; // 汉字
      }
    }

    // 计算字数（汉字和标点）
    var totalWords = chineseChars + punctuation;

    // 将统计结果保存到状态Tiddlers
    $tw.wiki.setText("$:/state/character-count/total", "text", null, totalChars.toString());
    $tw.wiki.setText("$:/state/character-count/chinese", "text", null, chineseChars.toString());
    $tw.wiki.setText("$:/state/character-count/punctuation", "text", null, punctuation.toString());
    $tw.wiki.setText("$:/state/character-count/letters", "text", null, letters.toString());
    $tw.wiki.setText("$:/state/character-count/numbers", "text", null, numbers.toString());
    $tw.wiki.setText("$:/state/character-count/words", "text", null, totalWords.toString());
  });
};

})();