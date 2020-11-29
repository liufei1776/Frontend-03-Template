import { Component, createElement } from '../framework.js';


/*
    实现鼠标拖拽切换图片功能
    判断“拖拽是否过半”
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
        console.log(this.root.children);

       
        let basePosition = 0;  // 记录处于当前第几张图片上

        // 添加鼠标事件
        this.root.addEventListener('mousedown', event => {
            
            // 记录鼠标点击的起始点位置
            let startX = event.clientX;


            let move = event => {
                let distanceX = event.clientX - startX;

                let box = this.root.children[0];
                box.style.transition = 'none';
                // 注意移动的基准
                box.style.transform = `translateX(${-basePosition * IMG_WIDTH + distanceX}px)`;
            }

            let up = event => {
                let distanceX = event.clientX - startX;
                //console.log(Math.round(distanceX / 500));

                // 判断是是否“移动过半”
                // 更新basePosition, 重新记录“基准”
                basePosition = basePosition - Math.round(distanceX / 500);
                console.log(basePosition);

                // 边缘检测
                basePosition = basePosition < 0 ? 0 :
                               basePosition > 3 ? 3 :
                               basePosition;


                box.style.transition = '';  
                box.style.transform = `translateX(${-basePosition * IMG_WIDTH}px)`;

                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            }

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);

        });



        // // 每次transition后
        // box.addEventListener('transitionend', function(){
        //    let left = box.removeChild(box.childNodes[0]);
        //    box.appendChild(left);

        //    box.style.transition = 'none'; 
        //    box.style.transform = 'translateX(0px)';
        // })


        // const timer = setInterval(()=>{
        //     box.style.transition = '';
        //     box.style.transform = `translateX(${-IMG_WIDTH}px)`;
        // }, 3000);

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
