const css = require('css');
const EOF = Symbol("EOF"); //EOF: End Of File

const layout = require("./layout.js")

let currentToken = null; //无论html里面有多复杂，都是当成一个token去处理
let currentAttribute = null;
//最后状态机的所有状态创建完token以后，我们要把它在同一个出口给它输出

let stack = [{ type: "document", children: [] }];
let currentTextNode = null;

//加入一个新的函数addCSSRules，这里我们把css规则暂存到一个数组里
let rules = [];
function addCSSRules(text){
    var ast = css.parse(text);
    //一个样式表里会有一个rules数组，也就是所谓的css规则
    rules.push(...ast.stylesheet.rules);
}

function match(element, selector) {
    if(!selector || !element.attributes)
        return false;

    // id选择器
    if(selector.charAt(0) == "#"){ 
        var attr = element.attributes.filter(attr => attr.name === "id")[0]
        if(attr && attr.value === selector.replace("#", ""))
            return true;
    }  else if(selector.charAt(0) == "."){ // class选择器
        var attr = element.attributes.filter(attr => attr.name === "class")[0]
        if(attr && attr.value === selector.replace(".", ""))
            return true;
    } else { //tagname选择器
        if(element.tagName === selector){
            return true;
        }
    }
    return false;
}

function specificity(selector){
    var p = [0, 0, 0, 0]; // this array is in order of [inline, ID, class, tagName]
    var selectorParts = selector.split(" ");
    for(var part of selectorParts){
        // assume selectorPart is a simple selector
        if(part.charAt(0) === "#"){
            p[1] += 1;
        } else if(part.charAt(0) === "."){
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compare(sp1, sp2) {
    for (let i = 0; i < 4; i++) {
        if (sp1[i] - sp2[i]) {
            return sp1[i] - sp2[i];
        }
    }
    return 0; // if all are equal, use the new one.
}

function computeCSS(element){
    //通过stack从内到外取得当前元素
    var elements = stack.slice().reverse();
    if(!element.computedStyle)
        element.computedStyle = {};

    for(let rule of rules){
        //这里默认不带逗号的declaration，所以只拿出一个selector
        var selectorParts = rule.selectors[0].split(" ").reverse();
        
        //把当前元素和选择器匹配
        if(!match(element, selectorParts[0]))
            continue;
        
        let matched = false;    
        //j代表当前选择器的位置
        var j = 1;
        //双循环选择器和元素的父元素来去查看他们是否能匹配，i代表当前父元素的位置
        for(var i = 0; i < elements.length; i++){
            if(match(elements[i], selectorParts[j])){
                j++;
            }
        }
        //检查是否所有的选择器都被匹配到了
        if(j >= selectorParts.length)
            matched = true;

        if(matched){
            //如果匹配到，我们把所有rules里的css属性应用到元素上
            //计算当前元素的specificity
            var sp = specificity(rule.selectors[0]);
            var computedStyle = element.computedStyle;
            for(var declaration of rule.declarations){
                if(!computedStyle[declaration.property])
                    computedStyle[declaration.property] = {};
                
                if(!computedStyle[declaration.property].specificity){
                    computedStyle[declaration.property].value = declaration.value;
                    computedStyle[declaration.property].specificity = sp;
                } else if(compare(computedStyle[declaration.property].specificity, sp) < 0){
                    //让新的区域覆盖它
                    computedStyle[declaration.property].value = declaration.value 
                    computedStyle[declaration.property].specificity = sp;
                }
            }
            // console.log(element.computedStyle);
        }
    }

}

function emit(token) {
  let top = stack[stack.length - 1]; //取出栈顶

  //进行入栈操作(startTag和endTag都对应着同一个element)
  if (token.type == "startTag") {
    let element = {
      type: "element",
      children: [],
      attributes: [],
    };

    element.tagName = token.tagName;

    for (let p in token) {
      //由于不需要type和tagName，把其他属性都push进element
      if (p != "type" && p != "tagName") {
        element.attributes.push({
          name: p,
          value: token[p],
        });
      }
    }

    computeCSS(element);
    //对偶操作,建立父子关系
    top.children.push(element);
    // element.parent = top; // If we add the parent property here, we can not do
    // JSON.stringify on DOM, as the TypeError "Converting circular structure to
    // JSON" can happen.
    
    // 自封闭的话没有必要去push
    if (!token.isSelfClosing) stack.push(element);

    currentTextNode = null;
  } else if (token.type == "endTag") {
    //检查tagName是否相等
    if (top.tagName != token.tagName) {
      throw new Error("Tag start end doesn't match!");
    } else {
        //++++++++++遇到style标签时，执行添加css规则的操作++++++++++//
        if(top.tagName === "style"){
            //把子元素文本拿出来作为我们css内容
            addCSSRules(top.children[0].content);
            //原本需要考虑link标签，但是由于link需要考虑多个情况，所以这里省略
        }
        layout(top);
      stack.pop();
    }
    currentTextNode = null;
  } else if(token.type == "text"){
      //没有文本节点的话创建一个新的
      if(currentTextNode == null){
          currentTextNode = {
              type: "text",
              content: ""
          }
          top.children.push(currentTextNode);
      }
      currentTextNode.content += token.content;
  }
}

function data(c) {
  if (c == "<") {
    return tagOpen;
  } else if (c == EOF) {
    emit({
      type: "EOF",
    });
    return;
  } else {
    emit({
      type: "text",
      content: c,
    });
    return data;
  }
}

function tagOpen(c) {
  if (c == "/") {
    return endTagOpen;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: "startTag", //自封闭和封闭都成为startTag
      tagName: "",
    };
    return tagName(c); //要么是开始标签，要么是自封闭标签
  } else {
    return;
  }
}

function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: "endTag",
      tagName: "",
    };
    return tagName(c);
  } else if (c == ">") {
  } else if (c == EOF) {
  } else {
  }
}

function tagName(c) {
  //一般标签都是以空白结束，空白符有tab符，换行符，禁止符合空格符 4种
  //例如<html prop 我们遇到空格就知道后面要跟一些属性了
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/") {
    // <html/> 这种自封闭标签
    return selfClosingStartTag;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c; //.toLowerCase()
    return tagName;
  } else if (c == ">") {
    //普通的开始标签
    emit(currentToken);
    return data;
  } else {
    return tagName;
  }
}

function beforeAttributeName(c) {
  //处理<http maaa = a>的空格
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/" || c == ">" || c == EOF) {
    return afterAttributeName(c); //E.g., <div >, reconsume ">" in the after attribute name state.
  } else if (c == "=") {
    // This is an unexpected-equals-sign-before-attribute-name parse error.

  } else {
    currentAttribute = {
      name: "",
      value: "",
    };
    // console.log("currentAttribute", currentAttribute);
    return attributeName(c);
  }
}

function attributeName(c) {
  // console.log(currentAttribute);
  // <div class="abc" />遇到后面的空格或者/,>之类结束的情况
  if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
    return afterAttributeName(c);
  } else if (c == "=") {
    //<div class="abc"> 等于后面是value
    return beforeAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == '"' || c == "'" || c == "<") {
  } else {
    currentAttribute.name += c;
    return attributeName;
  }
}

function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {  //ignore the white spaces
    return beforeAttributeValue;
  } else if (c == '"') {
    return doubleQuotedAttributeValue;
  } else if (c == "'") {
    return singleQuotedAttributeValue;
  } else if (c == ">") {
    //return data
  } else {
    return UnquotedAttributeValue(c);
  }
}

function afterAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == "=") {
    return beforeAttributeValue;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == EOF) {
  } else {
    // 理论上这条分支是多余的，从beforeAttributeName或者attributeName状态进入时c已经确定了
    // currentToken[currentAttribute.name] = currentAttribute.value
    currentAttribute = {
      name: "",
      value: "",
    };
    return attributeName(c);
  }
}

function doubleQuotedAttributeValue(c) {
  if (c == '"') {
    // 只找双引号结束
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function singleQuotedAttributeValue(c) {
  if (c == "'") {
    // 只找单引号结束
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return singleQuotedAttributeValue;
  }
}

//<div id=xx class=xx> id的后面一定要有空格
function afterQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == EOF) {
  } else {
    // This is a missing-whitespace-between-attributes parse error. Reconsume in the
    // before attribute name state. E.g., <div id="a"x=...    
    // currentAttribute.value += c;
    // return doubleQuotedAttributeValue;
    return beforeAttributeName(c);
  }
}

//只找空白符结束 e.g., <html maaa=a >. The last "a" is the unquotedAttributeValue
function UnquotedAttributeValue(c) {
  //把结束的属性的name和value写进currentToken
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  } else if (c == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == "\u0000") {
  } else if (c == '"' || c == "'" || c == "=" || c == "<" || c == "`") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return UnquotedAttributeValue;
  }
}

function selfClosingStartTag(c) {
  //只有<div>这种遇到>是正确格式
  if (c == ">") {
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data;
  } else if (c == "EOF") {
    // throw exception
  } else {
    // throw exception
  }
}

module.exports.parseHTML = function parseHTML(html) {
  // console.log(html);
  let state = data;
  //对每个字符循环去完成状态机
  for (let c of html) {
    state = state(c);
  }
  //html最后有一个文件终结，有些文本结点可能面临没有结束的状态，
  // 所以最后必须额外给一个无效的字符
  state = state(EOF); //状态机会强迫一些结点完成截止
  // console.log(stack[0]);
  return stack[0];
};