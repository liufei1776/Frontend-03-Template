import { Component } from '../framework.js';


/*
    自动播放Carousel
    最后一帧之后，衔接第一帧
*/


class Carousel extends Component {
    constructor() {
        super();
        this.root = null;
        this.attributes = Object.create(null);
    }

    /* 课程中的代码 */
    // 就像 React 一样，组件必须实现 render 方法
    // render() {
    //     this.root = document.createElement('div');
    //     this.root.classList.add("carousel");

    //     for(let imgPath of this.attributes.src) {
    //         // 使用img，会自带拖拽，可能会带来不必要的麻烦
    //         // let child = document.createElement('img');

    //         let child = document.createElement('div');
    //         child.style.backgroundImage = `url("${imgPath}")`;
    //         this.root.appendChild(child);
    //     }

    //     let children = this.root.children;
    //     let currentIndex = 0;
    //     setInterval(()=>{
    //         let nextIndex = (currentIndex + 1) % children.length;

    //         let current = children[currentIndex];
    //         let next = children[nextIndex];

    //         next.style.transition = 'none';
    //         next.style.transform = `translateX(${100 -nextIndex * 100}%)`;

    //         setTimeout(()=>{
    //             next.style.transition = '';
    //             current.style.transform = `translateX(${-100 -currentIndex * 100}%)`;
    //             next.style.transform = `translateX(${-nextIndex * 100}%)`;

    //             currentIndex = nextIndex;
    //         }, 16);

    //     }, 3000)

    //     return this.root;
    // }



    /* 按照自己能理解的方式 写的  */
    render() {
        this.root = document.createElement('div');
        this.root.classList.add("carousel");
        
        let box = document.createElement('div');
        box.classList.add('box');

        const IMG_WIDTH = 500;
        box.style.width = IMG_WIDTH * this.attributes.src.length + 'px';

        
        // 初始化
        for(let imgPath of this.attributes.src) {
            let div = document.createElement('div');
            div.style.backgroundImage = `url("${imgPath}")`;
            box.appendChild(div);
        }
        console.log(box.childNodes);
        this.root.appendChild(box);

        // 每次transition后
        box.addEventListener('transitionend', function(){
           let left = box.removeChild(box.childNodes[0]);
           box.appendChild(left);

           box.style.transition = 'none'; 
           box.style.transform = 'translateX(0px)';
        })


        const timer = setInterval(()=>{
            box.style.transition = '';
            box.style.transform = `translateX(${-IMG_WIDTH}px)`;
        }, 3000);

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


export { Carousel };
