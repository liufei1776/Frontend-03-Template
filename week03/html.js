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
    body div #myid {
        width: 100px;
        background-color: #ff5000;
    }
    body div img {
        width: 30px;
        background-color: #ff1111;
    }
</style>
</head>
<body>
<div>
    <img id="myid" class="fade" />
    <input type="text" value="123" />
</div>    
</body>
</html>`;


module.exports = {
    html
}