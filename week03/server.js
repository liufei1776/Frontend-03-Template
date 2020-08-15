const http = require('http');
const responseBody = require('./html.js');

const server = http.createServer((request, response) => {
    let body = [];

    request.on('error', err => {
        console.log('Error!');
        console.error(err);
    }).on('data', chunck => {
        // 服务端监听客户端发送过来的数据(request);

        console.log('Data!', chunck.toString());

        // 课程代码这句有问题，不能toString
        // body.push(chunck.toString());

        body.push(chunck);
        console.log('body', body);

    }).on('end', ()=>{
        console.log('End!');
        body = Buffer.concat(body).toString();
        console.log('body:', body);
        response.writeHead(200, {'Content-type': 'text/html'});

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

        response.end(responseBody.html);
    })
})

server.listen(8088);

console.log('server started');