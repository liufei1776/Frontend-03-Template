const EOF = Symbol('EOF'); // EOF: end of file

let currentToken = null;
let currentAttribute = null;

function emit(token) {
    console.log(token);
}



function data(char) {
    if(char == '<') {  // 标签开始，而不是‘开始标签’，并不能确定是三种标签的哪一种
        return tagOpen;
    }
    else if(char == EOF) {
        emit({type: 'EOF'});
        return;
    }
    else {
        emit({
            type: 'text',
            content: char
        })
        return data;
    }
}

function tagOpen(char) {
    if(char == '/') { //  判断是否是结束标签 '</'
        return endTagOpen;
    }
    else if(char.match(/^[a-zA-Z]$/)) {  // 要么是是一个开始标签，要么是一个自封闭标签
        currentToken = {
            type: 'startTag',
            tagName: ''
        }
        
        return tagName(char);
    }
    else {
        return;
    }
}

function endTagOpen(char) {
    if(char.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(char);
    }
    else if(char == '>') {  // '</>' 不应该出现

    }
    else if(char == EOF) {

    }
    else {

    }
}

function tagName(char) {
    if(char.match(/^[\t\n\f ]$/)) {  // 遇到空白符号，说明后面是属性，如<html props
        return beforeAttributeName;
    }
    else if(char == '/') {
        return selfClosingStartTag;  // 遇到了自封闭标签 <br/>
    }
    else if(char.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += char;  // .toLowerCase();
        return tagName;
    }
    else if(char == '>') {
        emit(currentToken);
        return data;
    }
    else {
        return tagName;
    }
}


// function beforeAttributeName(char) {
//     if(char.match(/^[\t\n\f ]$/)) { // 属性前面有多个空格等  <html   props
//         return beforeAttributeName;  
//     }
//     else if(char == '/' || char == '>' || char == EOF ) {
//         return afterAttributeName(char);
//     }
//     else if(char == '=') {
//         return beforeAttributeName;
//     }
//     else {
//         currentAttribute = {
//             name: '',
//             value: ''
//         }

//         return attributeName(char);
//     }
// }

function beforeAttributeName(char) {
    if(char.match(/^[\t\n\f ]$/)) { // 属性前面有多个空格等  <html   props
        return beforeAttributeName;  
    }
    else if(char == '/' || char == '>') {  // <div /> 
        return tagName(char); 
    }
    else if(char == EOF) {
        return data(char);
    }
    else if(char == '=') {
        throw 'A property in tag starts with "="'
    }
    else {
        currentAttribute = {
            name: '',
            value: ''
        }

        return attributeName(char);
    }

}


// function attributeName(char) {
//     if(char.match(/^[\t\n\f ]$/) || char == '/' || c == '>'  || c == EOF) {
//         return afterAttributeName(char);
//     }
//     else if(c == '=') {
//         return beforeAttributeValue;  // 解析属性值
//     }
//     else if(c == '\u0000') {

//     }
//     else if(c == '\"' ||  c == '\'' || c == '<' ) {

//     }
//     else {
//         currentAttribute.name += c;
//         return attributeName;
//     }
// }

function attributeName(char) {
    if(char.match(/^[\t\n\f ]$/)) {
        // <div a = '' >
        return attributeName;
    }
    else if(char == '=') {  // 属性name解析完毕，后面解析属性value
        return beforeAttributeValue;
    }
    else {
        currentAttribute.name += char;
        return attributeName;
    }
}


// function beforeAttributeValue(char) {
//     if(char.match(/^[\t\n\f ]$/) || char == '/' || c == '>'  || c == EOF) {
//         return beforeAttributeValue;
//     }
//     else if(c == '\"') {
//         return doubleQuotedAttributeValue;
//     }
//     else if(c == '\'') {
//         return singleQuotedAttributeValue;
//     }
//     else if(c == '>') {

//     }
//     else {
//         return UnquotedAttributeValue(char);
//     }
// }

function beforeAttributeValue(char) {
    if(char.match(/^[\t\n\f ]$/)) {
        // <div a =  "" >
        return beforeAttributeValue;
    }
    else if(char == '"') {
        return doubleQuotedAttributeValue;
    }
    else {
        console.log('beforeAttributeValue - unexpected');
    }
}



// function doubleQuotedAttributeValue(char) {
//     if(c == '"') {
//         // 引号结束
//         currentToken[currentAttribute.name] = currentAttribute.value;
//         return afterQuotedAttributedValue;
//     }
//     else if(c == '\u0000') {

//     }
//     else if(c == EOF) {

//     }
//     else {
//         currentAttribute.value += char;
//         return doubleQuotedAttributeValue;
//     }
// }

function doubleQuotedAttributeValue(char) {
    if(char == '"') {
        // 引号结束
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName; // 如果还有属性
    }  
    else {
        currentAttribute.value += char;
        return doubleQuotedAttributeValue;
    }  
}

// function singleQuotedAttributeValue(char) {
//     if(c == '\'') {
//         currentToken[currentAttribute.name] = currentAttribute.value;
//         return afterQuotedAttributedValue;
//     }
//     else if(c == '\u0000') {

//     }
//     else if(c == EOF) {

//     }
//     else {
//         currentAttribute.value += char;
//         return singleQuotedAttributeValue;
//     }
// }

// function afterQuotedAttributedValue(char) {
//     if(c.match(/^[\t\n\f ]$/)) { // 多个属性 <div class="" id="">
//         return beforeAttributeName;
//     }
//     else if(c == '/') {
//         return selfClosingStartTag;
//     }
//     else if(c == '>') {
//         currentToken[currentAttribute.name] = currentAttribute.value;
//         emit(currentToken);
//         return data;
//     }
//     else if(c == EOF) {

//     }
//     else {
//         currentAttribute.value +=  char;
//         return 
//     }
// }


function selfClosingStartTag(char) {
    // 对于自封闭标签而言，后面只有 '>‘  才是有效的 
    if(char == '>') {
        currentToken.selfClosing = true;
        // 封闭属性
        emit(currentToken);
        return data;
    }
    else if(char == 'EOF') {

    }
    else {

    }
}


module.exports = {
    parseHTML(html) {
        let state = data;
        for(let char of html) {
            state = state(char);
        }

        state = state(EOF);
    }
}