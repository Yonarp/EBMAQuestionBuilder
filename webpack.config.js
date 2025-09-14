var path = require('path');
var APP_DIR = path.resolve(__dirname, 'src');

module.exports = {
    // mode: 'production',
    mode: 'development',
    devtool: 'inline-cheap-source-map', // debug ? "inline-sourcemap" : null,
    entry: {
        D1: './src/customField.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'customField.js',
        library: 'Survey',
        libraryTarget:'window'
    },
    externals: [
        {
            react: {
                commonjs: 'react',
                commonjs2: 'react',
                amd: 'react',
                window: 'React'
            },
        },
        /@material-ui\/core\/.*/,
    ],
    module : {
        rules : [
            {
                test : /\.(js|jsx)$/,
                include : APP_DIR,
                loader : 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(ts|tsx)$/,
                use: {
                    loader: 'ts-loader',
                    options: { projectReferences: true },
                },
                exclude: /node_modules/,
            },
        ]
    },
    resolve: { extensions: ['.tsx', '.ts', '.js', '.jsx'] },
};
