const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// timeout: The time to wait after a disconnection before attempting to reconnect
const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=2000&reload=true';


module.exports = {
    mode: process.env.NODE_ENV || 'development',
    target: "web",
    devtool: "eval-source-map",
    // The base directory, an absolute path, for resolving entry points and loaders
    context: path.resolve(__dirname, 'src'),
    entry: {
        // dummy style entry to compile less file to css file
        style: './js/style.js',
        // Multi Page Application
        main: ['./js/main.js', hotMiddlewareScript],
        class_view: ['./js/class_view.js', hotMiddlewareScript],
        member: ['./js/member.js', hotMiddlewareScript],
        member_view: ['./js/member_view.js', hotMiddlewareScript],
        booking: ['./js/booking.js', hotMiddlewareScript],
        mybooking: ['./js/mybooking.js', hotMiddlewareScript],
        myreadbooks: ['./js/mybooks.js', hotMiddlewareScript],
        trial: ['./js/trial.js', hotMiddlewareScript],
        portal: ['./js/mobileportal.js', hotMiddlewareScript],
        course: ['./js/course.js', hotMiddlewareScript],
        course_view: ['./js/course_view.js', hotMiddlewareScript],
        setting: ['./js/setting.js', hotMiddlewareScript],
        statistics: ['./js/statistics.js', hotMiddlewareScript],
        admin: ['./js/admin.js', hotMiddlewareScript]
    },

    output: {
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'public'),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.js', '.vue', '.json'],
        //Create aliases to import or require certain modules more easily.
        alias: {
            //vue: 'vue/dist/vue.min.js'
        }
    },
    externals: {
        jquery: '$',
        vue: 'Vue'
    },
    module: {
        // Prevent webpack from parsing any files matching the given regular expression(s). 
        // Ignored files should not have calls to import, require, define or any other importing mechanism. 
        // This can boost build performance when ignoring large libraries.
        noParse: /jquery/,
        rules: [
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            // disable exporting css module as esModule, 
                            // because vue-style-loader load css module as commonjs
                            esModule: false,
                            sourceMap: true
                        }
                    }
                ],
            }, {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    // disable the Hot Reload explicitly
                    hotReload: true
                    // other vue-loader options go here
                    // esModules: false // removed from v14.0.0, more information refer to https://github.com/vuejs/vue-loader/releases/tag/v14.0.0
                    // also see https://github.com/webpack/webpack/issues/3929
                }
            },
            {
                // don't use babel to parse the js file until "runtime-generator" issue is resolved
                test: /\.j1s$/,
                include: path.resolve(__dirname, 'src'),
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env',
                                { "regenerator": true }
                            ]
                        ]
                    }
                }
            },
            // this will apple to template block `<template lang="pug">` in `.vue` files
            {
                test: /\.pug$/,
                loader: 'pug-plain-loader'
            },
            // this will apply to the global `style.less` file
            {
                test: /\.less$/,
                include: [
                    path.resolve(__dirname, "src/css")
                ],
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader'
                ]
            },
            // this will apply to both plain `.less` files
            // AND `<style lang="less">` blocks in `.vue` files
            {
                test: /\.less$/,
                include: [
                    path.resolve(__dirname, "src/js")
                ],
                use: [
                    'vue-style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: false,
                            sourceMap: true
                        },
                    },
                    'less-loader'
                ]
            }
        ]
    },
    plugins: [
        // make sure to include the plugin!
        new VueLoaderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        // make jquery available for all modules
        new webpack.ProvidePlugin({
            $: 'jquery'
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
        })
    ],
    performance: {
        hints: false
    }
};
