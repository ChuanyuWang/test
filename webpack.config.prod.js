const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const TerserPlugin = require('terser-webpack-plugin');
const pkg = require('./package.json');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');


module.exports = {
    mode: process.env.NODE_ENV || 'production',
    target: "web",
    // Avoid inline-*** and eval-*** use in production as they can increase bundle size and reduce the overall performance.
    devtool: '',
    // The base directory, an absolute path, for resolving entry points and loaders
    context: path.resolve(__dirname, 'src'),
    entry: {
        // dummy style entry to compile less file to css file
        style: './pages/style.js',
        // Multi Page Application
        main: './pages/home/main.js',
        class_view: './pages/home/class_view.js',
        member: './pages/members/member.js',
        member_detail: './pages/members/member_detail.js',
        booking: './pages/booking/booking.js',
        mybooking: './pages/booking/mybooking.js',
        myreadbooks: './pages/mybooks/mybooks.js',
        trial: './pages/trial/trial.js',
        portal: './pages/app/mobileportal.js',
        poster: './pages/poster/poster.js',
        cockpit: './pages/cockpit/cockpit.js',
        course: './pages/course/course.js',
        course_view: './pages/course/course_view.js',
        setting: './pages/settings/setting.js',
        statistics: './pages/statistics/statistics.js',
        admin: './pages/admin/admin.js',
        finance: './pages/finance/finance.js',
        contract_create: './pages/finance/contract_create.js',
        contract_detail: './pages/finance/contract_detail.js'
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
                            sourceMap: false
                        }
                    }
                ],
            }, {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    // disable the Hot Reload explicitly for production
                    hotReload: false
                    // other vue-loader options go here
                    // esModules: false // removed from v14.0.0, more information refer to https://github.com/vuejs/vue-loader/releases/tag/v14.0.0
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
                            // disable exporting css module as esModule, 
                            // because vue-style-loader load css module as commonjs
                            esModule: false,
                            sourceMap: false
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
        //new webpack.HotModuleReplacementPlugin(),
        // make jquery available for all modules
        new webpack.ProvidePlugin({
            $: 'jquery'
        }),
        new ESLintPlugin(),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(),
            new webpack.BannerPlugin({
                entryOnly: false,
                banner: (obj) => {
                    const today = new Date();
                    const year = today.getFullYear();

                    let banner = `${pkg.name}\n`;
                    banner += `Version: ${pkg.version}\n`;
                    banner += `Copyright ©2017-${year} ${pkg.author}\n\n`;
                    banner += `File: [filebase]\n`;
                    banner += `Path: [file]`;

                    return banner;
                }
            }),
            new OptimizeCssAssetsPlugin()
        ],
    },
    performance: {
        hints: "warning"
    }
};
