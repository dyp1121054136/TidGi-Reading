/*\
title: $:/modules/update-scroll-anchors.js
type: application/javascript
module-type: startup

更新TiddlyWiki中的滚动锚点位置和滚动距离参数
\*/
(function(){
  "use strict";

  exports.name = "update-scroll-anchors";
  exports.platforms = ["browser"];
  exports.after = ["startup"];
  exports.synchronous = true;

  exports.startup = function() {
    // 添加滚动事件监听器来更新锚点位置
    window.addEventListener('scroll', function() {
      updateScrollAnchors();
    });
  };

  function updateScrollAnchors() {
    // 获取当前滚动位置，以像素为单位
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // 获取当前滚动底部位置，以像素为单位
    var scrollBottom = scrollTop + window.innerHeight;

    // 获取所有带有.scroll-top或.scroll-bottom类的元素
    var anchors = document.querySelectorAll('.scroll-top, .scroll-bottom');
    anchors.forEach(function(anchor) {
      // 根据滚动位置更新元素的位置
      var position = anchor.classList.contains('scroll-top') ? scrollTop : scrollBottom;
      anchor.style.top = (position + 'px');
    });
  }

})();