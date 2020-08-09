// 使用状态机 完成 ‘abababx’的 处理

let abGroup = 0;

function match(string) {
    let state = start;

    for(let char of string) {
        state = state(char);
    }

    return state === end;
}


function start(char) {
    if(char == 'a') {
        return findB;
    }

    return start;
}


function end(char) {
    return end;
}

function findB(char) {
    if(char == 'b') {
        abGroup++;

        // 满足 3个 ‘ab’ 组合，下一个是否是X
        if(abGroup == 3) {
            return findX;
        }

        // 一个 ‘ab’ 组合找到了，返回状态start，重新找
        return start;
    }

    return start(char);
}

function findX(char) {
    if(char == 'x') {
        return end;
    }

    // 清零
    abGroup = 0;

    return start(char);
}

console.log(match('abababx'));
console.log(match('abababc'));