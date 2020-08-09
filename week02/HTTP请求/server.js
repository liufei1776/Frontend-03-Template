const http = require('http');

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
        response.end('Hello World\n');
    })
})

server.listen(8088);

console.log('server started');