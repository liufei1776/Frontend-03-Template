const EOF = Symbol('EOF'); // EOF: end of file

function data(char) {

}

module.exports = {
    parseHTML(html) {
        let state = data;
        for(let char of html) {
            state = state(char);
        }

        state = state(EOF);
    }
}