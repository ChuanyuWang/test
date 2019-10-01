module.exports = {
    port: 7004,
    log4js: {
        appenders: [{
            type: "console"
        }
        ],
        replaceConsole: true
    },
    /**
     * Free CDN library
     * 1. https://cdnjs.com/
     * 2. https://www.staticfile.org/
     * 3. https://docs.microsoft.com/en-us/aspnet/ajax/cdn/overview
     * 4. http://www.bootcdn.cn/ (reject .cc .top)
     */
    cdnlibs: {
        jquery: 'https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js',
        jquery_dev: 'https://cdn.bootcss.com/jquery/3.4.1/jquery.js',
        bootstrap: 'https://cdn.bootcss.com/twitter-bootstrap/3.4.1/js/bootstrap.min.js',
        bootstrap_css: 'https://cdn.bootcss.com/twitter-bootstrap/3.4.1/css/bootstrap.min.css',
        bootstrap_dev: 'https://cdn.bootcss.com/twitter-bootstrap/3.4.1/js/bootstrap.js',
        momentjs: 'https://cdn.bootcss.com/moment.js/2.22.1/moment-with-locales.min.js',
        momentjs_dev: 'https://cdn.bootcss.com/moment.js/2.22.1/moment-with-locales.js',
        vue: 'https://cdn.bootcss.com/vue/2.5.22/vue.min.js',
        vue_dev: 'https://cdn.bootcss.com/vue/2.5.22/vue.js',
        i18next: '/libs/i18next.min.js',
        i18next_dev: '/libs/i18next.js',
        bootstrap_table_css: 'https://cdn.bootcss.com/bootstrap-table/1.12.1/bootstrap-table.min.css',
        bootstrap_table: 'https://cdn.bootcss.com/bootstrap-table/1.12.1/bootstrap-table.min.js',
        bootstrap_table_locale_zh_CN: 'https://cdn.bootcss.com/bootstrap-table/1.12.1/locale/bootstrap-table-zh-CN.min.js',
        bootstrap_datetimepicker: 'https://cdn.bootcss.com/bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js',
        bootstrap_datetimepicker_css: 'https://cdn.bootcss.com/bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css',
        bootbox: 'https://cdn.bootcss.com/bootbox.js/4.4.0/bootbox.min.js',
        echarts: 'https://cdn.bootcss.com/echarts/3.8.5/echarts.min.js',
        echarts_dev: 'https://cdn.bootcss.com/echarts/3.8.5/echarts.js'
    }
};
