const css = require('css');


/*也可以用任何随机字符串 
  只要保证不变且不会被认为是html字符就行 
  只是用symbol不是明文 不会被后续代码修改
*/
const EOF = Symbol('EOFjakh');
const type = Symbol('type'); // 为了区分 <input type> 中的type

let currentToken = null;
let currentAttribute = null;


let stack = [
    {
        type: 'document',
        children: []
    }
]
let currentTextNode = null;

function emit(token) {
    // console.log(token);
    let top = stack[stack.length - 1];

    if(token[type] == 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attributes: []
        }

        element.tagName = token.tagName;

        // 元素属性
        for(let key in token) {
            if(key !== type && key !== 'tagName') {
                element.attributes.push({
                    name: key,
                    value: token[key]
                })
            }
        }

        // 在 startTag 的时候就添加css
        computeCSS(element);

        top.children.push(element);
        // element.parent = top;

        if(!token.selfClosing) {  // 非封闭标签
            stack.push(element);
        }

        currentTextNode = null;
    }
    else if(token[type] == 'endTag') {
        if(top.tagName != token.tagName) {
            throw 'Tag start end does not match!';
        }
        else {
            // +++++++++++++ 遇到 Style结束 标签，执行添加CSS规则的操作+++++++++++++
            if(top.tagName == 'style') {
                // top.children[0] 就是 文本节点
                addCSSRules(top.children[0].content);
            }

            stack.pop();
        }

        currentTextNode = null;
    }
    else if(token[type] == 'text') {
        if(currentTextNode == null) {
            currentTextNode = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNode);
        }

        currentTextNode.content += token.content;
    }
}



// 加入一个新的函数 addCSSRules, 这里我们把CSS规则暂存到一个数组里
let rules = [];
function addCSSRules(text) {
    let ast = css.parse(text);
    // console.log(JSON.stringify(ast, null, "    "));
    rules.push(...ast.stylesheet.rules);
}

function computeCSS(element) {
    // console.log(rules);
    // console.log('compute CSS for Element', element);

    // 获取父元素
    // 课程代码
    // reverse 会影响原数组，这里必须copy出一个副本
    let elements = stack.slice().reverse();

    // or
    // let elements = [...stack].reverse();

    if(!element.computedStyle) {
        // 带有CSS样式的DOM
        element.computedStyle = {};
    }

    for(let rule of rules) {
        // 因为不考虑 组合选择器，所以 selector 也就是1个
        // split 是 拆解出 所有 父选择器
        // revers 之后，跟 elements 顺序保持一致
        let selectorParts = rule.selectors[0].split(" ").reverse();

        // match 函数还没有实现
        if(!match(element, selectorParts[0])) {
            // 从所有 css rules 找到 当前元素的 css规则
            // 如果 当前 rule 不 match，那么看下一个 rule
            continue;
        }

        let matched = false;

        // 为什么是1，因为当前stack是不包含 当前元素的，存的都是父元素
        let j = 1; 

        for(let i=0; i<elements.length; i++) {
            if(match(elements[i], selectorParts[j])) {
                j++;
            }
        }

        if(j >= selectorParts.length) {
            matched = true;
        }

        if(matched) {
            // 如果匹配到，我们要加入
             console.log('-------Element ', element, ' matches rule ', rule);
            
            // 生成 computed 属性
            for(let declaration of rule.declarations) {
                // init computedStyle if not exist
                if(!element.computedStyle[declaration.property]) {
                    element.computedStyle[declaration.property] = {};
                }

                // 计算 CSS 优先级
                let sp = sepecificity(rule.selectors[0]);

                if(!element.computedStyle[declaration.property].sepecificity) {
                    element.computedStyle[declaration.property].sepecificity = sp;
                }
                else if(compareSepecificity(element.computedStyle[declaration.property].sepecificity, sp) < 0) {
                    element.computedStyle[declaration.property].sepecificity = sp;
                }

                element.computedStyle[declaration.property].value = declaration.value;
               
            }
            console.log(element.computedStyle);
        
        }
    }

}

function sepecificity(selector) {
    let level = [0, 0, 0, 0];

    let selectorParts = selector.split(' ');
    for(let part of selectorParts) {
        if(part[0] == '#') {
            level[1]++;
        }
        else if(part[0] == '.') {
            level[2]++;
        }
        else {
            level[3]++;
        }
    }

    return level;
}

function compareSepecificity(sp1, sp2) {
    // 如果同级相同，差值为0，不走if
    if(sp1[0] - sp2[0]) 
        return sp1[0] - sp2[0];

    if(sp1[1] - sp2[1]) 
        return sp1[1] - sp2[1];
    
    if(sp1[2] - sp2[2]) 
        return sp1[2] - sp2[2];    
    
    return sp1[3] - sp2[3];    
}




function match(element, selector) {

    // selector 为空，or 当前元素是文本节点（文本节点没有 attributes）
    if(!selector || !element.attributes) {
        return false;
    }

    // id 选择器
    if(selector.charAt(0) == '#') {
        // <div id="myId">
        let attr = element.attributes.filter(attr => attr.name == 'id');
        if(attr[0] && attr[0].value === selector.replace('#','')) {
            console.log('id 选择器 返回true')
            return true;
        }
    }
    // class 选择器
    else if(selector.charAt(0) == '.') {
        let attr = element.attributes.filter(attr => attr.name == '.');
        if(attr[0] && attr[0].value === selector.replace('.','')) {
            console.log('class 选择器 返回true')
            return true;
        }
    }
    // 元素选择器
    else {
        if(element.tagName == selector) {
            console.log('tag 选择器 返回true')
            return true;
        }
    }

    return false;
}




function showUnexpected(name, char) {
    console.log(`${name} unexpected char: ${char}`);
}

/*
   1. 开始标签,如<div>
   2. 结束标签，如</div>
   3. 单标签/自封闭标签<img/>
*/


function data(char) {
    // 标签开始，而不是“开始标签”，并不呢个确定是哪一种
    if(char == '<') {
        return tagOpen;
    }
    else if(char == EOF) {
        emit({
            [type]: 'EOF'
        });
        return;
    }
    else {
        // 非标签。如 style标签内 里的 css属性
        emit({
            [type]: 'text',
            content: char
        });
        return data;
    }
}

function tagOpen(char) {
    // 结束标签 </div>
    if(char == '/') {
        return tagEnd;
    }
    // 要么是是一个开始标签，要么是一个自封闭标签
    else if(char.match(/^[a-zA-Z]$/)) {
        currentToken = {
            [type]: 'startTag',
            tagName: ''
        }

        // 解析 tag name
        return tagName(char);
    }
    
    showUnexpected(tagOpen.name, char);
    return;
}

function tagEnd(char) {
    // </div>
    if(char.match(/^[a-zA-Z]$/)) {
        currentToken = {
            [type]: 'endTag',
            tagName: ''
        }

        return tagName(char);
    }

    showUnexpected(tagEnd.name, char);
    return;
}


// 解析 tag name
function tagName(char) {
    // 遇到空白符号，说明后面是属性，或者封闭标签
    // <div class= > or <img />
    // 先统一按属性状态走
    if(char.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    }
    // 遇到了自封闭标签 <br />
    else if(char == '/') {
        return selfClosingStartTag;
    }
    else if(char.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += char;
        return tagName;
    }
    else if(char == '>') {
        emit(currentToken); // 标签结束了
        return data;  // 从新开始
    }
    
    showUnexpected(tagName.name, char);
    return;

}


function selfClosingStartTag(char) {
    // 对于自封闭标签而言，后面只有 '>‘  才是有效的 
    if(char == '>') {
        currentToken.selfClosing = true;
        // 封闭属性
        emit(currentToken);
        return data;
    }
    
    return;
}



function beforeAttributeName(char) {
    // 属性前面有多个空格等  <html   props
    if(char.match(/^[\t\n\f ]$/)) { 
        return beforeAttributeName;  
    }
    // 考虑封闭标签 <img    /> or <br>
    else if(char == '/' || char == '>') {
        return tagName(char);
    }
    else if(char == '=') {
        throw 'A property in tag starts with "="';
    }

    currentAttribute = {
        name: '',
        value: ''
    }

    return attributeName(char);
}

// 解析 attribute name
function attributeName(char) {
    if(char.match(/^[\t\n\f ]$/)) {
        // <div a = '' >
        return attributeName;
    }
    else if(char == '=') {  // 属性name解析完毕，后面解析属性value
        return beforeAttributeValue;
    }

    currentAttribute.name += char;
    return attributeName;
}

function beforeAttributeValue(char) {
    if(char.match(/^[\t\n\f ]$/)) {
        // <div a =  "" >
        return beforeAttributeValue;
    }
    // 简单一些，规定只能使用 双引号
    else if(char == '"') {
        return doubleQuotedAttributeValue;
    }

    showUnexpected(beforeAttributeValue.name, char);
    return;
}

function doubleQuotedAttributeValue(char) {
    if(char == '"') {
        // 双引号结束
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName; // 如果还有属性
    }  

    currentAttribute.value += char;
    return doubleQuotedAttributeValue;
}



module.exports= {
    parseHTML(html) {
        let state = data;
        for(let char of html) {
            state = state(char);
        }

        state = state(EOF); // 最后给个结束标志
        
        return stack[0];
    }

    
}
