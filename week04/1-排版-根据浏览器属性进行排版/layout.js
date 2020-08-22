function layout(element) {
    if(!element.computedStyle) {
        return;
    }

    // 做一些预处理
    let elementStyle = getStyle(element);

    // 目前只考虑 flex 布局
    if(elementStyle.display != 'flex') {
        return; 
    }

    // 只有元素标签才会有 computedStyle 属性
    let items = element.children.fliter(c => c.type == 'element');

    // order 属性？
    items.sort(function(a,b) {
        return (a.order || 0) - (b.order || 0);
    })

    ['width', 'height'].forEach( size => {
        if(style[size] == 'auto' || style[size] == '') {
            style[size] = null;
        }
    })

    if(!style.flexDirection || style.flexDirection == 'auto') {
        style.flexDirection = 'row';
    }

    if(!style.alignItems || style.alignItems == 'auto') {
        style.alignItems = 'stretch';
    }

    if(!style.justifyContent || style.justifyContent == 'auto') {
        style.justifyContent = 'flex-start';
    }

    if(!style.flexWrap || style.flexWrap == 'auto') {
        style.flexWrap = 'nowrap';
    }

    if(!style.alignContent || style.alignContent == 'auto') {
        style.alignContent = 'stretch';
    }

    let mainSize, mainStart, mainEnd, mainSign, mainBase, 
        crossSize, crossStart, crossEnd, crossSign, crossBase;

    if(style.flexDirection == 'row') {
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    else if(style.flexDirection == 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'botton';
    }
    else if(style.flexDirection == 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    else if(style.flexDirection == 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if(style.flexWrap == 'wrap-reverse') {
        // ES6 trick
        [crossStart, crossEnd] = [crossEnd, crossStart];
        crossSign = -1;
    }
    else {
        crossBase = 0;
        crossSign = 1;
    }


}

function getSytle(element) {
    if(!element.style) {
        element.style = {};
    }

    for(let prop in element.computedStyle) {
        elememt.style[prop] = element.computedStyle[prop].value;
    }

    if(element.style[prop].toString().match(/px$/)) {
        element.style[prop] = parseInt(element.style[prop]);
    }

    // 将字符串数字转换成 number 类型
    if(element.style[prop].toString().match(/^[0-9\.]+$/)) {
        element.style[prop] = parseInt(element.style[prop]);
    }

    return element.style;
}

module.exports = layout;