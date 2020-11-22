import {Component, createElement} from './framework.js';

class Carousel extends Component {
    constructor() {
        super();
        this.root = null;
        this.attributes = Object.create(null);
    }

    // 就像 React 一样，组件必须实现 render 方法
    render() {
        this.root = document.createElement('div');

        for(let imgPath of this.attributes.src) {
            // 使用img，会自带拖拽，可能会带来不必要的麻烦
            let child = document.createElement('img');
            child.src = imgPath;
            this.root.appendChild(child);
        }


        return this.root;
    }

    // @override 
    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    // @override
    mountTo(parent) {
        // 延迟渲染：在所有属性和事件准备结束后，再渲染
        parent.appendChild(this.render());
    }
}



const imgs = [
    'https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg',
    'https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg',
    'https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg',
    'https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg'
];



// src会被 JSX 解析成正确的 attriburtes
let a = <Carousel src={imgs}/>;
a.mountTo(document.body);