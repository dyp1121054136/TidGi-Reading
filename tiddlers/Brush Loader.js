exports.after = ['load-modules'];

exports.startup = function startup() {
  let hljs = $tw.modules.execute('$:/plugins/tiddlywiki/highlight/highlight.js');

  $tw.modules.forEachModuleOfType('highlighter', function(title, module) {
    let moduleSource = $tw.wiki.getTiddlerText(title);
    console.log('loading brush: ' + title);
    $tw.utils.evalSandboxed(moduleSource, {hljs:hljs, exports:{}}, title);
  });
};