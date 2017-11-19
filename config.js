module.exports = {
    port : 7004,
    log4js : {
        appenders : [{
                type : "console"
            }
        ],
        replaceConsole : true
    },
    cdnlibs : {
        vue     : '//cdn.bootcss.com/vue/2.2.4/vue.min.js',
        vue_dev : '//cdn.bootcss.com/vue/2.2.4/vue.js',
        i18next : '//cdn.bootcss.com/i18next/8.2.1/i18next.min.js',
        i18next_dev : '//cdn.bootcss.com/i18next/8.2.1/i18next.js'
    }
};
