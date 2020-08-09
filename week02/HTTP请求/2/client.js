const net = require('net');
const { runInThisContext } = require('vm');

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

    send() {
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser;
            resolve('');
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