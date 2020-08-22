function getStyle(element) {
    if(!element.style) {
        element.style = {};
    }

    for(let prop in element.computedStyle) {
        element.style[prop] = element.computedStyle[prop].value;

        if(element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }

        // 将字符串数字转换成 number 类型
        if(element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }

    return element.style;
}

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
    let items = element.children.filter(c => c.type == 'element');

    // order 属性？
    items.sort(function(a,b) {
        return (a.order || 0) - (b.order || 0);
    })

    let style = elementStyle;

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

    
    // 如果没有设置主轴尺寸，则由子元素撑开
    let isAutoMainSize = false;
    if(!style[mainSize]) { // auto sizing
        elementStyle[mainSize] = 0;

        for(let i=0; i<items.length; i++) {
            // 视频中这里由问题
            let itemStyle = getStyle(items[i]);


            if(itemStyle[mainSize] != null || itemStyle[mainSize] != undefined) {
                elementStyle[mainSize] += itemStyle[mainSize]
            }
        }

        isAutoMainSize = true;
    }

    let flexLine = [];
    let flexLines = [flexLine];

    let mainSpace = elementStyle[mainSize]; // 用于计算当前主轴剩余空间
    let crossSpace = 0;

    for(let i=0; i<items.length; i++) {
        let itemStyle = getStyle(items[i]);

        if(itemStyle[mainSize] == null) {
            itemStyle[mainSize] = 0;
        }

        if(itemStyle.flex) {
            flexLine.push(item);
        }
        else if(style.flexWrap === 'nowrap' && isAutoMainSize) {
            // 计算剩余空间
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== undefined) {
                // 交叉轴最高的一个元素决定
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }

            flexLine.push(item);
        }
        else {
            //元素尺寸大于行的情况，压缩到行的大小
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }

            // 如果当前主轴行放不下了
            if (mainSpace < itemStyle[mainSize]) {
                // 存一些信息
                flexLine.mainSpace  = mainSpace;
                flexLine.crossSpace = crossSpace;
                
                //创建新一行
                flexLine = [item];
                flexLines.push(flexLine);

                //重置尺寸变量
                mainSpace  = style[mainSpace];
                crossSpace = 0;
            }
            else {
                // 能正常放下
                flexLine.push(items[i]);
            }

            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== undefined){
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            mainSpace -= itemStyle[mainSize];
        }
    }

    // 如果所有元素都拍完了，最后一行同样添加一些信息
    flexLine.mainSpace = mainSpace;
    // console.log(items);

    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    }
    else {
        flexLine.crossSpace = crossSpace;
    }

    // 单行逻辑
    if (mainSpace < 0) {
        let scale = style[mainSize] / (style[mainSize] - mainSpace);
        let currentMain = mainBase;
        for (let i = 0; i < items.length; i++) {
            let itemStyle = getStyle(items[i]);
            if (itemStyle.flex) {
            itemStyle[mainSize] = 0;
            }
            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        }
    }
    else {
        flexLines.forEach(function (items) {
            let mainSpace = items.mainSpace;
            let flexTotal = 0;
            for (let i = 0; i < items.length; i++) {
                let itemStyle = getStyle(items[i]);
                if ((itemStyle.flex !== null) && (itemStyle.flex !== undefined)) {
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }
        
            if (flexTotal > 0) {
                let currentMain = mainBase;
                for (let i = 0; i < items.length; i++) {
                    let itemStyle = getStyle(items[i]);
                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            }
            else {
                let currentMain, step;
                if (style.justifyContent === 'flex-start') {
                    currentMain = mainBase;
                    step = 0;
                }
                else if (style.justifyContent === 'flex-end') {
                    currentMain = mainSpace * mainSign + mainBase;
                    step = 0;
                }
                else if (style.justifyContent === 'center') {
                    currentMain = mainSpace / 2 * mainSign + mainBase;
                    step = 0;
                }
                else if (style.justifyContent === 'space-between') {
                    currentMain = mainBase;
                    step = mainSpace / (items.length - 1) * mainSign;
                }
                else if (style.justifyContent === 'space-around') {
                    step  = mainSpace / (items.length) * mainSign;
                    currentMain = step / 2 + mainBase;
                }
        
                for (let i = 0; i < items.length; i++) {
                    let itemStyle = getStyle(items[i]);
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        });
    }


    // 计算交叉轴
    if (!style[crossSize]) {
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        //auto模式，每个行的交叉轴尺寸相加得出
        for (let i = 0; i < flexLines.length; i++) {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSize;
        }
    }
    else {
        crossSpace = style[crossSize];
        //已经声明交叉轴尺寸，减去每个行占用得出剩余尺寸
        for (let i = 0; i < flexLines.length; i++) {
          crossSpace -= flexLines[i].crossSize;
        }
    }

    if (style.flexWrap === 'wrap-reverse') {
        crossBase = style[crossSize] || 0;
    }
    else {
        crossBase = 0;
    }

    let lineSize = style[crossSize] / flexLines.length;

    let step;
    if (style.alignContent === 'flex-start') {
        crossBase += 0;
        step = 0;
    }
    else if (style.alignContent === 'flex-end') {
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    else if (style.alignContent === 'center') {
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    else if (style.alignContent === 'space-between') {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    else if (style.alignContent === 'space-around') {
        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;
    }
    else if (style.alignContent === 'stretch') {
        crossBase += 0;
        step = 0;
    }

    flexLines.forEach(items => {
        let lineCrossSize = style.alignContent === 'stretch' ?
                            items.crossSpace + crossSpace / flexLines.length :
                            items.crossSpace;

        for (let i = 0; i < items.length; i++) {
            let itemStyle = getStyle(items[i]);
            let align = itemStyle.alignSelf || style.alignItems;

            if (itemStyle[crossSize] === null) {
                itemStyle[crossSize] = (align === 'stretch') ? lineCrossSize : 0;
            }

            if (align === 'flex-start') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            else if (align === 'flex-end') {
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }
            else if (align === 'center') {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            else if (align === 'stretch') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) ? itemStyle[crossSize] : items.crossSpace);
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
            }
        }
        crossBase += crossSign * (lineCrossSize + step);
    });
    
    console.log(items);


}



module.exports = layout;