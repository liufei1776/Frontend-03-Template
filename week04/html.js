// let html = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Document</title>
// </head>
// <body>
//     <div>hello world<div>
// </body>
// </html>`;

let html = `<html maaa="a" la="b" >
<head>
<style>
   #container {
       width:500px;
       height:300px;
       display:flex;
       background-color: rgb(255, 255, 255);
   }

   #container #myid {
       width:200px;
       height: 100px;
       background-color: rgb(255, 0, 0);
   }

   #container .c1{
       flex:1;
       background-color: rgb(0, 255, 0);
   }
</style>
</head>
<body>
    <div id="container">
        <div id="myid"></div>
        <div class="c1"></div>
    </div>    
</body>
</html>`;


module.exports = {
    html
}