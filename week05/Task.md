## 练习题
请写出下面选择器的优先级
1. div#a.b .c[id=x] --- [0,1,3,1]
2. #a:not(#b) --- [0,2,0,0]
3. *.a --- [0,0,1,0]
4. div.a --- [0,0,1,1]

原理参考 NOTE.md

## 思考题
为什么 first-letter 可以设置 float 之类的，而 first-line 不行呢？

假设有
```html
<p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nesciunt odit tenetur necessitatibus blanditiis pariatur vitae minus voluptate eum ipsam, laudantium culpa fugit dolorem mollitia reiciendis est maxime assumenda tempora sequi?</p>
```
解释这个问题，可以从两个点出发：
1. first-letter 和 first-line 只能作用于块集元素。本例子中是 p 元素。
2. 使用 float 的前提是，元素必须有“宽度”。

对于first-letter，一个字母的宽度是“可知的”(例如 font-size)，在p元素内，也就是 p 元素内文档流内，自然是可以设置float。

而first-line，其首行文字内容的宽度是“无法预测的”。首先文字内容宽度会自动填充到父元素（这里是P元素）的100%。同时 p 元素受 “块级元素流特性”影响，其宽度可根据浏览器窗口不断变化。因此无法有效判断首行的宽度的。 既然没有固定宽度，那么float的前提条件就不满足。