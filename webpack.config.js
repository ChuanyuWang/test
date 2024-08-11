const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// timeout: The time to wait after a disconnection before attempting to reconnect
const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=2000&reload=true';


module.exports = {
    mode: process.env.NODE_ENV || 'development',
    target: "web",
    devtool: "source-map",
    // The base directory, an absolute path, for resolving entry points and loaders
    context: path.resolve(__dirname, 'src'),
    entry: {
        // dummy style entry to compile less file to css file
        style: './pages/style.js',
        // Multi Page Application
        main: ['./pages/home/main.js', hotMiddlewareScript],
        class_view: ['./pages/home/class_view.js', hotMiddlewareScript],
        member: ['./pages/members/member.js', hotMiddlewareScript],
        member_detail: ['./pages/members/member_detail.js', hotMiddlewareScript],
        booking: ['./pages/booking/booking.js', hotMiddlewareScript],
        mybooking: ['./pages/booking/mybooking.js', hotMiddlewareScript],
        myreadbooks: ['./pages/mybooks/mybooks.js', hotMiddlewareScript],
        trial: ['./pages/trial/trial.js', hotMiddlewareScript],
        portal: ['./pages/app/mobileportal.js', hotMiddlewareScript],
        cockpit: ['./pages/cockpit/cockpit.js', hotMiddlewareScript],
        poster: ['./pages/poster/poster.js', hotMiddlewareScript],
        course: ['./pages/course/course.js', hotMiddlewareScript],
        course_view: ['./pages/course/course_view.js', hotMiddlewareScript],
        setting: ['./pages/settings/setting.js', hotMiddlewareScript],
        statistics: ['./pages/statistics/statistics.js', hotMiddlewareScript],
        admin: ['./pages/admin/admin.js', hotMiddlewareScript],
        finance: ['./pages/finance/finance.js', hotMiddlewareScript],
        contract_create: ['./pages/finance/contract_create.js', hotMiddlewareScript],
        contract_detail: ['./pages/finance/contract_detail.js', hotMiddlewareScript]
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
                    // enable the Hot Reload for development
                    hotReload: true
                    // other vue-loader options go here
                    // esModules: false // removed from v14.0.0, more information refer to https://github.com/vuejs/vue-loader/releases/tag/v14.0.0
                    // also see https://github.com/webpack/webpack/issues/3929
                }
            },
            // this will apply to all `.js` files and template block "<script>" in `.vue` files
            // convert ECMAScript 2015+ code into a backwards compatible version
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            // See below for more @babel/preset-env options.
                            // https://babeljs.io/docs/en/babel-preset-env
                            ['@babel/preset-env', { "targets": "defaults" }]
                        ],
                        plugins: []
                    }
                }
            },
            // this will apply to template block `<template lang="pug">` in `.vue` files
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
                    path.resolve(__dirname, "src/pages"),
                    path.resolve(__dirname, "src/components")
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
