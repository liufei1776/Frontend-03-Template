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
                console.log('服务端返回数据啦', data.toString());

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
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;  
        this.WAITING_HEADER_SPACE = 3;  // 冒号后面的空格
        this.WAITING_HEADER_VALUE  = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END  = 6;  // header 和 body 之间的空行
        this.WAITING_BODY = 7;
        
        
        this.current = this.WAITING_STATUS_LINE;
        this.statusLIne = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;
    }

    receive(string) {
        // 利用状态机原理
        for(let i=0; i<string.length; i++) {
            this.receiveChar(string[i]);
        }
    }
    receiveChar(char) {
        if(this.current = this.WAITING_STATUS_LINE) {
            if(char == '\r') {
                // 换行是 \r\n
                // 遇到 \r 就说明下面就是  \n
                this.current = this.WAITING_STATUS_LINE_END;
            }
            else {
                this.statusLine += char;
            }
        }
        else if(this.current = this.WAITING_STATUS_LINE_END) {
            if(char == '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        }
        else if(this.current == this.WAITING_HEADER_NAME) {
            if(char == ':') {
                // ':' 后面是空格
                this.current = this.WAITING_HEADER_SPACE;
            }
            else if(char == '\r') {
                // 开头就遇到了 \r, 说明是空行
                this.current = this.WAITING_HEADER_BLOCK_END;
            }
            else {
                this.headerName += char;
            }
        }
        else if(this.current == this.WAITING_HEADER_SPACE) {
            if(char == ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        }
        else if(this.current == this.WAITING_HEADER_VALUE) {
            if(char == '\r') {
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers[this.headName] = this.headerValue;
                this.headerName = '';
                this.headerValue = '';
            }
            else {
                this.headerValue += char;
            }
        }
        else if(this.current == this.WAITING_HEADER_LINE_END) {
            if(char == '\n') {
                // 当前 header 属性结束，解析下一个header属性
                this.current = this.WAITING_HEADER_NAME;
            }
        }
        else if(this.current == this.WAITING_HEADER_BLOCK_END) {
            if(char == '\n') {
                this.current = this.WAITING_HEADER_BLOCK_END;
            }
        }
        else if(this.current == this.WAITING_BODY) {
            console.log(char);

            // 对body还需要额外处理
        }
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