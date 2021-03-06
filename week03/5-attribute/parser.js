/*也可以用任何随机字符串 
  只要保证不变且不会被认为是html字符就行 
  只是用symbol不是明文 不会被后续代码修改
*/
const EOF = Symbol('EOF');
const type = Symbol('type'); // 为了区分 <input type> 中的type

let currentToken = null;
let currentAttribute = null;

function emit(token) {
    console.log(token);
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

        state = state(EOF);
    }
}
