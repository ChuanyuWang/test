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
        jquery: '//cdn.bootcss.com/jquery/3.3.1/jquery.min.js',
        jquery_dev: '//cdn.bootcss.com/jquery/3.3.1/jquery.js',
        bootstrap: '//cdn.bootcss.com/bootstrap/3.3.7/js/bootstrap.min.js',
        bootstrap_css: '//cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.min.css',
        bootstrap_dev: '//cdn.bootcss.com/bootstrap/3.3.7/js/bootstrap.js',
        momentjs: '//cdn.bootcss.com/moment.js/2.22.1/moment-with-locales.min.js',
        momentjs_dev: '//cdn.bootcss.com/moment.js/2.22.1/moment-with-locales.js',
        vue: '//cdn.bootcss.com/vue/2.5.16/vue.min.js',
        vue_dev: '//cdn.bootcss.com/vue/2.5.16/vue.js',
        i18next: '//cdn.bootcss.com/i18next/11.3.2/i18next.min.js',
        i18next_dev: '//cdn.bootcss.com/i18next/11.3.2/i18next.js',
        bootstrap_table_css: '//cdn.bootcss.com/bootstrap-table/1.12.1/bootstrap-table.min.css',
        bootstrap_table: '//cdn.bootcss.com/bootstrap-table/1.12.1/bootstrap-table.min.js',
        bootstrap_table_locale_zh_CN: '//cdn.bootcss.com/bootstrap-table/1.12.1/locale/bootstrap-table-zh-CN.min.js',
        bootstrap_datetimepicker: '//cdn.bootcss.com/bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js',
        bootstrap_datetimepicker_css: '//cdn.bootcss.com/bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css',
        bootbox: '//cdn.bootcss.com/bootbox.js/4.4.0/bootbox.min.js'
    }
};
