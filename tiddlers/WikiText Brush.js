if(typeof hljs !== 'undefined')
(() => {
    var e = (() => {
        "use strict";
        return (e) => {
          ////// REPEATABLE ELEMENTS //////
            const f = { scope: "type", begin: /\[|\]|<|>|{(?!{)|}(?!})/, end: /\s*/ }, //TRANSCLUSION FILTER
            j = { scope: "string", begin: /!![\w-_]*(?=}}|}\w)/ }, //TRANSCLUSION FIELD
          //TRANSCLUSION
            t = { scope: "type", begin: /{{{?.*}}}?/, returnBegin: !0, contains: [
                { scope: "section", begin: /{{{?/, end: /}}}?/, excludeBegin: !0, excludeEnd: !0, contains: [ f,
                    { scope: "type", begin: /(?<=(\]|>|}|{{{.?\[))[\w!]/, end: /\w(?=(\[|<|{))/ }, //FILTER OPERATOR
                    { scope: "type", begin: /\|\|.*(?=!!)/, contains: [j] }, //TRANSCLUSION TEMPLATE WITH FIELD
                    { scope: "type", begin: /\|\|.*(?=}})/ }, //TRANSCLUSION TEMPLATE, NO FIELD
                    { scope: "link", begin: /##.*(?=}})/ }, //TRANSCLUSION DATA
                    j,
                ], },
            ], },
          //HTML
            n = { begin: /<\/?[A-Za-z_]/, end: />/, subLanguage: "xml", relevance: 0, contains: [t] },
          //LINKS AND IMAGES
            a = { scope: "type",
                variants: [
                    { begin: /\[\[.+?\]\]/, relevance: 0 },
                    { begin: /\[ext\[.+?\]\]/, relevance: 0 },
                    { begin: /\[img\s?(.*)?\[.+?\]\]/, relevance: 0 },
                    { begin: /((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?/, relevance:2, },
                ],
                returnBegin: !0,
                contains: [
                  //DESCRIPTION PART
                    { scope: "string", begin: /\[(ext|img\s?(.*)?)?\[(?=(.*)\|.*\])/, end: /.(?=\|)/, excludeBegin: !0 },
                  //LINK PART
                    { scope: "selector-class", begin: /(?<!\])\|/, end: /\]\]/, excludeBegin: !0, excludeEnd: !0 },
                  //LINK ONLY
                    { scope: "selector-class", begin: /\[(ext|img\s?(.*)?)?\[(?!(.*)\|(.*)\])/, end: /\]\]/, excludeBegin: !0, excludeEnd: !0 },
                  //BARE LINK
                    { scope: "selector-class", begin: /(http|ftp)s?:\/\//, end: /.(?=(\s|\n|\)|\]|"|}))/ },
                ],
            },
          //BOLD
            i = {
                scope: "strong",
                contains: [],
                variants: [
                    { begin: /'{2}/, end: /'{2}/, excludeBegin: !0, excludeEnd: !0 },
                ],
            },
          //ITALICS
            s = {
                scope: "emphasis",
                contains: [],
                variants: [
                    { begin: /(?<!:)\/{2}(?!\/)/, end: /\/{2}/, excludeBegin: !0, excludeEnd: !0 },
                ],
            };
            i.contains.push(s), s.contains.push(i);
            let c = [n, a, t];
            return (
                (i.contains = i.contains.concat(c)),
                (s.contains = s.contains.concat(c)),
                (c = c.concat(i, s)),
                {
                    name: "WikiText",
                    aliases: ["tw", "tid", "tiddlywiki", "wikitext"],
                    contains: [
                      //HEADERS
                        { scope: "section", begin: /^\s*!{1,6}/, end: /$/, contains: c },
                      //HTML
                        n,
                      //MACROS AND WIDGETS
                        { scope: "variable",
                            variants: [
                                { begin: /<\/?[$]?(?=[.a-zA-Z])/, end: /(?<!>)>(?!>)/, relevance: 0 },
                                { begin: /<<(?!<)/, end: />>(?!>)/, relevance: 0 },
                                { begin: /\\define/, end: /\\end/ },
                            ],
                            returnBegin: !0,
                            contains: [
                                { scope: "variable", begin: /\\define/ }, //MACRO DEFINE
                                { scope: "variable", begin: /(?<=(<|<\/|<<))\$?[.a-zA-Z_-]+\b/ }, //WIDGETS & MACROS
                                { scope: "link", begin: /[a-zA-Z]+=/, returnBegin: !0, contains:[ //ATTRIBUTE NAME
                                    {scope:"comment", begin: /=/},
                                ], },
                                { scope: "link", begin: /(?<!(<<))\b[a-zA-Z0-9_-]+\b/ }, //MACRO VARIABLE
                                { scope: "string", begin: /"\s*(?=\[)/, end: /"(?=(\s|>|\/>))/, contains: [f, //FILTER WITHIN STRINGS
                                    { scope: "type", begin: /(?<=(\]|>|}|".?\[))(?<!\[\[)[\w!]/, end: /\w(?=(\[|<|{))/ }, //FILTER OPERATOR
                                    { scope: "section", begin: /(?<=(\[|<|{))./, end: /.(?=(\]|>|}))/ }, //FILTER PARAMETER
                                ], },
                                { scope: "string", begin: /(?<=(\s|=|:))"""/, end:/"""(?=(\s|\)|>|\/>))/, contains: c }, // ATTRIBUTE VALUE
                                { scope: "string", begin: /(?<=(\s|=|:))"/, end:/"(?=(\s|\)|>|\/>))/, contains: c }, // ATTRIBUTE VALUE
                                { scope: "string", begin: /(?<=(\s|=|:))'/, end:/'(?=(\s|\)|>|\/>))/, contains: c }, // ATTRIBUTE VALUE
                                t, //TRANSCLUSION WITHIN WIDGET/MACRO
                            ],
                        },
                      //STYLING
                        { scope: "string", variants: [ {begin: /@{2}.*?(?=\s)/, end: /\s*/}, {begin: /@@/}, ], },
                        { begin: /(?<=(<style>))(\n|\#|\.|.)/, end: /(\n|.)(?=(<\/style>))/, subLanguage: "css" },
                      //BULLETS
                        { scope: "bullet", begin: /(?<=[*#])\.[.a-zA-Z-_]+\b/ }, //CLASS
                        { scope: "bullet", begin: /^[ \t]*([*#]+)/, end: /\s*/, }, //LIST
                        { scope: "bullet", begin: /(?<=[*#>]+)[*#]+/, end: /\s*/ }, //LIST AFTER BLOCKQUOTE
                      //DEFINITIONS
                        { scope: "bullet", begin: /^\s*;/, end: /$/, excludeEnd: !0 },
                        { scope: "bullet", begin: /^\s*:(?=\s*)/, end: /\s*/, excludeEnd: !0,
                            contains: [
                                { begin: /(?<=:)[*#]+(?=\s*)/, end: /\s*/ }, //LIST AFTER DEFINITION
                                { scope: "quote", begin: /(?<=:)[>]+/, end: /\s*/ }, //BLOCKQUOTE AFTER DEFINITION
                            ],
                        },
                      //TABLES
                        { scope: "section", variants: [ //HEADERS
                            { begin: /^\|\s*!/, end: /\|$/ },
                            { begin: /^\|(?=(.*\|h$))/, end: /h$/, relevance: 2, },
                        ], },
                        { scope: "quote", begin: /^\|(?=(.*\|f$))/, end: /f$/, relevance: 2, }, //FOOTERS
                        { scope: "string", begin: /^\|(?=(.*\|(k|c)$))/, end: /(k|c)$/, relevance: 2, }, //CLASSES & COMMENTS
                        { scope: "variable", begin: /\|/, end: /\s*/ }, //GENERAL
                      //TEXT FORMATTING
                        i, //BOLD
                        s, //ITALICS
                        { scope: "selector-class", begin: /_{2}/, end: /_{2}/, excludeBegin: !0, excludeEnd: !0 }, //UNDERLINE
                        { scope: "quote", begin: /~{2}/, end: /\s*/ }, //STRIKE THROUGH
                        { scope: "quote", begin: /\^{2}/, end: /\s*/ }, //SUPERSCRIPT
                        { scope: "quote", begin: /,{2}/, end: /\s*/ }, //SUBSCRIPT
                      //TRANSCLUSION
                        t,
                      //BLOCKQUOTE
                        { scope: "quote", begin: /(?<=[<>])\.[.a-zA-Z-_]+\b/ }, //CLASS
                        { scope: "quote", begin: /^\s*>+|^\s*<<</, end: /\s*/, contains: c }, //BLOCKQUOTE
                        { scope: "quote", begin: /(?<=[*#>]+)>+/, end: /\s*/ }, //BLOCKQUOTE AFTER LISTS
                      //CODE BLOCK
                        {
                            scope: "code",
                            variants: [
                                { begin: /(`{3,})[^`](.|\n)*?\1`*[ ]*/ },
                                { begin: /```/, end: /```+[ ]*$/ },
                                { begin: /``?.+?``?/ },
                            ],
                        },
                      //HARD LINEBREAKS BLOCK
                        { scope: "bullet", begin: /^\s*"""/, end: /$/ },
                      //TYPED BLOCK
                        { scope: "code", begin: /^\s*\${3}/, end: /$/ },
                      //HORIZONTAL RULE
                        { scope: "bullet", begin: /^\s*---+/, end: /$/ },
                      //LINKS
                        a,
                    ],
                }
            );
        };
    })();
    hljs.registerLanguage("wikitext", e);
})();