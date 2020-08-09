const net = require('net');

class Request {
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {};

        // 注意：一定要有content-type
        if(!this.headers['Content-Type']) {
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if(this.headers['Content-Type'] == 'application/json') {
            this.bodyText = JSON.stringify(this.body);
        } 
        else if(this.headers['Content-Type'] == 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }

        this.headers['Content-Length'] = this.bodyText.length;
    }

    toString() {
        // return `${this.method} ${this.path} HTTP/1.1\r\n` +
        //        `${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}` + 
        //        `\r\n\r\n${this.bodyText}`;

        return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r\n\r\n${this.bodyText}`;
    }

    send(connection) {
        return new Promise((resolve, reject) => {
            
            // 创建connection 或 使用已有connection
            if(connection) {
                connection.write(this.toString());
            }
            else {
                // net 模块
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    // 如果连接成功，调用callback
                    connection.write(this.toString());
                });
            }

            // 客户端监听服务端返回的数据(response)
            connection.on('data', data => {
                console.log(data.toString());

                const parser = new ResponseParser;

                parser.receive(data.toString());
                if(parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            });

            connection.on('error', err => {
                reject(err);
                connection.end();
            });
        });
    }

}

// Response 逐步接受 信息
class ResponseParser {
    receive(string) {
        // 利用状态机原理
        for(let i=0; i<string.length; i++) {
            this.receiveChar(string[i]);
        }
    }
    receiveChar(char) {
        
    }
}



// 立即执行函数
void async function() {
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '8088',
        path: '/',
        headers: {
            'X-Foo2': 'customed'
        },
        body: {
            name: 'winter'
        }
    });

    let response = await request.send();

    console.log(response);

}();