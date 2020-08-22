const net = require('net');
const parser = require('./parser.js');
const images = require('images');
const render = require('./render.js');

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
                    console.log('Connected', this.toString());
                    connection.write(this.toString());
                });
            }

            // 客户端监听服务端返回的数据(response)
            connection.on('data', data => {
                console.log('Response accepted', data.toString());

                const parser = new ResponseParser();

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
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;
    }

    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }

    // 组装resposne消息
    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);

        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('')
        }
    }

    receive(string) {
        // 利用状态机原理
        for(let i=0; i<string.length; i++) {
            this.receiveChar(string[i]);
        }
    }
    receiveChar(char) {
        if(this.current === this.WAITING_STATUS_LINE) {
            if(char === '\r') {
                // 换行是 \r\n
                // 遇到 \r 就说明下面就是  \n
                this.current = this.WAITING_STATUS_LINE_END; 
            }
            else {
                this.statusLine += char;
            }
        }
        else if(this.current === this.WAITING_STATUS_LINE_END) {
            if(char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        }
        else if(this.current === this.WAITING_HEADER_NAME) {
            if(char === ':') {
                // ':' 后面是空格
                this.current = this.WAITING_HEADER_SPACE;
            }
            else if(char === '\r') {
                // 开头就遇到了 \r, 说明是空行
                this.current = this.WAITING_HEADER_BLOCK_END;

                // 创建 BodyParser 实例的时机
                if(this.headers['Transfer-Encoding'] === 'chunked') {
                    this.bodyParser = new TrunkedBodyParser();
                    console.log('bodyParser instance created');
                }
            }
            else {
                this.headerName += char;
            }
        }
        else if(this.current === this.WAITING_HEADER_SPACE) {
            if(char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        }
        else if(this.current === this.WAITING_HEADER_VALUE) {
            if(char === '\r') {
                this.headers[this.headerName] = this.headerValue;
                this.headerName = '';
                this.headerValue = '';
                this.current = this.WAITING_HEADER_LINE_END;
            }
            else {
                this.headerValue += char;
            }
        }
        else if(this.current === this.WAITING_HEADER_LINE_END) {
            if(char === '\n') {
                // 当前 header 属性结束，解析下一个header属性
                this.current = this.WAITING_HEADER_NAME;
            }
        }
        else if(this.current === this.WAITING_HEADER_BLOCK_END) {
            if(char === '\n') {
                this.current = this.WAITING_BODY;
            }
        }
        else if(this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char);
        }
    }
}


class TrunkedBodyParser {
    constructor() {
        this.WAITING_LENGTH = 0; 
        this.WAITING_LENGTH_LINE_END= 1;
        this.READING_TRUNK = 2;  
        this.WAITING_NEW_LINE = 3;  
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }

    receiveChar(char) {
        if(this.current === this.WAITING_LENGTH) {
            // 找到 \r , 说明已经读到了 length
            if(char === '\r') {
                // 遇到长度位0的，说明后面没有文本了，不用等待接受流了。
                if(this.length === 0) {
                    this.isFinished = true;
                    return;
                }

                this.current = this.WAITING_LENGTH_LINE_END;
            }
            else {
                this.length *= 16;
                this.length += parseInt(char, 16);
            }
        }
        else if(this.current === this.WAITING_LENGTH_LINE_END) {
            if(char === '\n') {
                this.current = this.READING_TRUNK;
            }
        }
        else if(this.current === this.READING_TRUNK) {
            this.content.push(char);
            this.length--;

            if(this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        }
        else if(this.current === this.WAITING_NEW_LINE) {
            // 文本后面的 \r\n
            // 如 hello world\r\n

            if(char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        }
        else if(this.current === this.WAITING_NEW_LINE_END) {
            if(char === '\n') {
                this.current = this.WAITING_LENGTH;
            }
        }
    }
}




// 立即执行函数
/* 在使用立即执行的函数表达式时，可以利用 void 运算符让 JavaScript 引擎把一个function关键字识别成函数表达式而不是函数声明（语句）。*/
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

    // console.log('response', response);

    let dom = parser.parseHTML(response.body);
    // console.log(JSON.stringify(dom, null, '  '));

    let viewport = images(800,600);

    render(viewport, dom);

    viewport.save('viewport.jpg');

}();