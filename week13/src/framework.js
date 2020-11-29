class Component {
    constructor() {
        // 在子类中直线render 方法

        // 不希望一开始马上渲染，在 mountTo 时再渲染
        // this.root = this.render();
    }

    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }

    appendChild(child) {
        child.mountTo(this.root);
    }
   
    // 普通元素也可以使用 mountTo 方法了
    mountTo(parent) {
        parent.appendChild(this.root);
    }
}



// 对普通元素进行包装，达到与组件相同的行为
class ElementWrapper extends Component {
    constructor(type) {
        super();
    }

    render() {
        return document.createElement(type);
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super();
    }

    render() {
        return document.createTextNode(content);
    }
}


// 实现createElement功能
function createElement(type, attributes, ...children) {
    let element;

    if(typeof type === 'string') {
        element = new ElementWrapper(type);
    }
    else {
        element = new type;
    }

    // attributes是对象
    for(let attr in attributes) {
        element.setAttribute(attr, attributes[attr]);
    }

    // chidren是数组
    for(let child of children) {

        // 如果子节点是 文本节点
        if(typeof child === 'string') {
            child = new TextWrapper(child);
        }

        element.appendChild(child); // 实际执行的是 mountTo 方法
    }

    return element;
}



// Test
// let div = new ElementWrapper('div');

export { Component, createElement };
