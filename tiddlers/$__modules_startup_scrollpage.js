/*\
title: $:/modules/startup/scrollpage.js
type: application/javascript
module-type: startup
\*/

(function() {
  "use strict";

  exports.name = "scrollpage";
  exports.platforms = ["browser"];
  exports.after = ["startup"];
  exports.synchronous = true;

  // 新增一个函数，用于获取元素的行高
  function getElementLineHeight(element) {
    const style = window.getComputedStyle(element);
    return parseFloat(style.lineHeight);
  }

  function getCharWidth(element) {
    const testSpan = document.createElement("span");
    testSpan.style.visibility = "hidden";
    testSpan.style.whiteSpace = "nowrap";
    testSpan.textContent = "m";
    element.appendChild(testSpan);
    const charWidth = testSpan.offsetWidth;
    element.removeChild(testSpan);
    return charWidth;
  }

  // 增加了一个新函数，用于滚动到最近的行和最近的字符
  function alignScrollToNearestLine(container, lineHeight, extraLines, charWidth, extraChars) {
    const lineHeightMisalignment = container.scrollTop % lineHeight;
    const charWidthMisalignment = container.scrollLeft % charWidth;
    if (lineHeightMisalignment > lineHeight / 2) {
      container.scrollTop += lineHeight - lineHeightMisalignment;
    } else if (lineHeightMisalignment <= lineHeight / 2) {
      container.scrollTop -= lineHeightMisalignment;
    }
    // 额外滚动 extraLines 行
    container.scrollTop += lineHeight * extraLines;

    if (charWidthMisalignment > charWidth / 2) {
      container.scrollLeft += charWidth - charWidthMisalignment;
    } else if (charWidthMisalignment <= charWidth / 2) {
      container.scrollLeft -= charWidthMisalignment;
    }
    // 额外滚动 extraChars 字符
    container.scrollLeft += charWidth * extraChars;
  }

  function getScrollPixels(scrollValue, length) {
    if (typeof scrollValue === 'number') return parseFloat(scrollValue);
    if (scrollValue.endsWith('vh')) return window.innerHeight * parseInt(scrollValue) / 100;
    if (scrollValue.endsWith('vw')) return window.innerWidth * parseInt(scrollValue) / 100;
    if (scrollValue.endsWith('%')) return length * parseFloat(scrollValue) / 100;
    return undefined;
  }

  function scrollToPosition(params) {
    let direction = params.direction;
    let viewportHeight = window.innerHeight;
    let scrollDistance = params.scrollDistance ? params.scrollDistance : viewportHeight;
    let scrollTime = parseFloat(params.scrollTime);
    let targetElement = params.targetElement;
    let scrollContainerSelector = params.scrollContainerSelector;
    let extraLines = params.extraLines !== undefined ? Number(params.extraLines) : 0;
    let extraChars = params.extraChars !== undefined ? Number(params.extraChars) : 0;
    let scrollPixel = getScrollPixels(scrollDistance, viewportHeight);

let offset = parseFloat(params.offset || "0");

  // 在此处处理虚拟EM偏移
  let offsetValue = offset && offset.endsWith('em') ? emToPixel(parseFloat(offset)) : parseFloat(offset || "0");
    
    let container = scrollContainerSelector ? document.querySelector(scrollContainerSelector) : null;
    if (container) {
      const lineHeight = getElementLineHeight(container);
      let charWidth = getCharWidth(container);
      
      if (direction === "top") {
        container.scrollTop = 0;
      } else if (direction === "bottom") {
        container.scrollTop = container.scrollHeight;
      } else if (direction === "next" || direction === "prev") {
        container.scrollTop += (direction === "next" ? scrollPixel : -scrollPixel);
        alignScrollToNearestLine(container, lineHeight, extraLines, charWidth, extraChars);
      } else if (direction === "left" || direction === "right") {
        container.scrollLeft += (direction === "right" ? scrollPixel : -scrollPixel);
      } else if(direction === "leftMost-tb-rl") {
        container.scrollLeft = -container.scrollWidth; //滚动到最左边，注意是负数（从右到左阅读）
      } else if(direction === "rightMost-tb-rl") {
        container.scrollLeft = 0; //滚动到最右边（从右到左阅读）
      }
      if (scrollTime > 0) {
        container.style.transition = `scroll ${scrollTime}s ease-in-out`;
        setTimeout(() => container.style.transition = "", scrollTime * 1000);
      }
    } else {
      let windowY = window.pageYOffset;
      let scrollTo;

      if (direction === "next" || direction === "prev") {
        scrollTo = direction === "next" ? (windowY + scrollPixel) : (windowY - Math.abs(scrollPixel));
        scrollTo = Math.min(document.body.scrollHeight - viewportHeight, Math.max(scrollTo, 0));
        window.scrollTo({
          top: scrollTo,
          behavior: scrollTime > 0 ? "smooth" : "auto"
        });
      } else if (direction !== undefined) {
        console.error("tm-scrollpage事件的direction参数值不合法");
      }
    }
  }

// 辅助函数：将em单位的偏移量转换为像素单位
function emToPixel(value) {
  return value * parseFloat(window.getComputedStyle(document.documentElement).fontSize);
}

// 滚动到元素位置的函数
function scrollToElementPosition(className, scrollTime, scrollContainerSelector, offset) {

  // 如果偏移量是以em为单位，将其转换为像素
  let offsetValue = offset && offset.endsWith('em') ? emToPixel(parseFloat(offset)) : parseFloat(offset || "0");

  // 获取待滚动元素
  let targetElement = document.querySelector('.' + className);
  if (targetElement) {
    let targetPosition = targetElement.getBoundingClientRect().top + 
                        (scrollContainerSelector ? document.querySelector(scrollContainerSelector).scrollTop
                                                 : window.pageYOffset);
    targetPosition += offsetValue;
    // 执行滚动操作
    if (scrollContainerSelector) {
      document.querySelector(scrollContainerSelector).scrollTo({
        top: targetPosition,
        behavior: scrollTime > 0 ? "smooth" : "auto"
      });
    } else {
      window.scrollTo({
        top: targetPosition,
        behavior: scrollTime > 0 ? "smooth" : "auto"
      });
    }
  } else {
    console.error("没有找到类名为 " + className + " 的元素");
  }
}

  exports.startup = function() {
    $tw.rootWidget.addEventListener("tm-scrollpage", function(event) {
      let params = event.paramObject || {};
      // 如果targetElement和scrollTime参数被提供，则使用scrollToElementPosition函数
      if (params.targetElement && params.scrollTime) {
        scrollToElementPosition(params.targetElement, parseFloat(params.scrollTime), params.scrollContainerSelector, params.offset);
      } else {
        // 否则，使用原有的scrollToPosition函数
        if (!params.direction && !params.scrollDistance && !params.scrollTime && !params.targetElement && !params.scrollContainerSelector) {
          return console.error("缺少参数: direction 或 scrollDistance 或 scrollTime 或 targetElement 或 scrollContainerSelector");
        }
        scrollToPosition(params);
      }
    });
  };
})();
