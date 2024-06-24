/*\
title: $:/modules/paste-clipboard.js
type: application/javascript
module-type: startup

从剪贴板中粘贴文本内容到TiddlyWiki
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// 导出模块名称和同步状态
exports.name = "paste-clipboard";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// 启动函数
exports.startup = function() {
  // 为根部件添加tm-paste事件监听器
  $tw.rootWidget.addEventListener("tm-paste", function(event) {
    // 显示加载指示器
    $tw.notifier.display("正在粘贴剪贴板内容...");

    // 尝试读取剪贴板内容
    navigator.clipboard.readText()
      .then(text => {
        // 从事件参数对象中提取参数
        var pasteTitle = event.paramObject.pasteTitle; // 存储剪贴板内容的tiddler标题

        // 将剪贴板内容设置到指定的tiddler中
        if (pasteTitle) {
          $tw.wiki.setText(pasteTitle, "text", null, text);
          // 显示成功通知
          $tw.notifier.display("剪贴板内容已成功粘贴。");
        } else {
          // 显示错误通知
          $tw.notifier.display("粘贴失败，未指定tiddler标题。");
        }
      })
      .catch(err => {
        // 记录错误并在控制台中输出
        console.error("粘贴剪贴板内容时发生错误:", err);
        // 显示错误通知
        $tw.notifier.display("粘贴剪贴板内容时发生错误。");
      });
  });
};

})();