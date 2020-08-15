const EOF = Symbol('EOF'); // EOF: end of file

let currentToken = null;

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


function beforeAttributeName(char) {
    if(char.match(/^[\t\n\f ]$/)) { // 属性前面有多个空格等  <html   props
        return beforeAttributeName;  
    }
    else if(char == '/') {
        // 考虑 <img pros= />
        return tagName(char);
    }
    else if(char == '>') {
        // return data;  // 视频中好像不对
        return tagName(char);
    }
    // 其他情况，暂不做详细处理，目前只要等 '>' 出现
    else if(char == '=') {
        return beforeAttributeName;
    }
    else {
        return beforeAttributeName;
    }
}

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