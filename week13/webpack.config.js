const path = require('path');

module.exports = {
    entry: './main.js',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // presets: ['@babel/preset-env', '@babel/preset-react'],
                        presets: ['@babel/preset-env'],
                        plugins: [
                            ['@babel/plugin-transform-react-jsx', {pragma: 'createElement'}]
                            // '@babel/plugin-transform-react-jsx'
                        ]
                    }
                }

            }
        ]
    },
    devServer: {
        contentBase: './dist'
    }
}