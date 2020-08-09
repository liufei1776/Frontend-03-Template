function match(string) {
    let state = start;
    
    for(let c of string) {
        state = state(c);
    }
    
    return state === end;
}

// start状态机，即start函数
function start(c) {
    if(c == 'a')
        // 返回下一个状态机，即foundA函数
        return foundA;
    
    return start;      
}

// end状态 永远返回 end 
function end(c) {
    return end;
}

function foundA(c) {
    if(c == 'b')
        return foundB;  // 状态机 foundA -> foundB
    
    return start(c);
}

function foundB(c) {
    if(c == 'c') 
        return foundC;  // foundB -> foundC
    
    return start(c);
    
}

function foundC(c) {
    if(c == 'd')
        return foundD;
        
    return start(c);
}

function foundD(c) {
    if(c == 'e') 
        return foundE;
   
     return start(c);     
}

function foundE(c) {
    if(c == 'f')
        return end;
    
    return start(c);    
}


console.log(match('ababcdef'));