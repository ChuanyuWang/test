const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const TerserPlugin = require('terser-webpack-plugin');
const pkg = require('./package.json');
const ESLintPlugin = require('eslint-webpack-plugin');


module.exports = {
    mode: process.env.NODE_ENV || 'production',
    target: "web",
    // Avoid inline-*** and eval-*** use in production as they can increase bundle size and reduce the overall performance.
    devtool: '',
    entry: {
        // Multi Page Application
        main: './src/js/main.js',
        class_view: './src/js/class_view.js',
        member: './src/js/member.js',
        member_view: './src/js/member_view.js',
        booking: './src/js/booking.js',
        mybooking: './src/js/mybooking.js',
        myreadbooks: './src/js/mybooks.js',
        trial: './src/js/trial.js',
        course: './src/js/course.js',
        course_view: './src/js/course_view.js',
        setting: './src/js/setting.js',
        statistics: './src/js/statistics.js',
        admin: './src/js/admin.js'
    },

    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/js'),
        publicPath: '/js/'
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
                    // disable the Hot Reload explicitly
                    hotReload: false
                    // other vue-loader options go here
                    // esModules: false // removed from v14.0.0, more information refer to https://github.com/vuejs/vue-loader/releases/tag/v14.0.0
                }
            },
            {
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
            // this will apply to both plain `.less` files
            // AND `<style lang="less">` blocks in `.vue` files
            {
                test: /\.less$/,
                use: [
                    'vue-style-loader',
                    {
                        loader: 'css-loader',
                        options: {
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
        new ESLintPlugin()
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
            })
        ],
    },
    performance: {
        hints: "warning"
    }
};
