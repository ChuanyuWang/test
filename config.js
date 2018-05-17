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
        jquery: '//cdn.staticfile.org/jquery/3.2.1/jquery.min.js',
        jquery_dev: '//cdn.staticfile.org/jquery/3.2.1/jquery.js',
        bootstrap: '//ajax.aspnetcdn.com/ajax/bootstrap/3.3.7/bootstrap.min.js',
        bootstrap_css: '//ajax.aspnetcdn.com/ajax/bootstrap/3.3.7/css/bootstrap.css',
        bootstrap_dev: '//ajax.aspnetcdn.com/ajax/bootstrap/3.3.7/bootstrap.js',
        momentjs: '//cdn.staticfile.org/moment.js/2.18.1/moment-with-locales.min.js',
        momentjs_dev: '//cdn.staticfile.org/moment.js/2.18.1/moment-with-locales.js',
        vue: '//cdnjs.cloudflare.com/ajax/libs/vue/2.5.16/vue.min.js',
        vue_dev: '//cdnjs.cloudflare.com/ajax/libs/vue/2.5.16/vue.js',
        i18next: '//cdnjs.cloudflare.com/ajax/libs/i18next/11.3.2/i18next.min.js',
        i18next_dev: '//cdnjs.cloudflare.com/ajax/libs/i18next/11.3.2/i18next.js',
        bootstrap_table_css: '//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/bootstrap-table.min.css',
        bootstrap_table: '//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/bootstrap-table.min.js',
        bootstrap_table_locale_zh_CN: '//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/locale/bootstrap-table-zh-CN.min.js',
        bootstrap_datetimepicker: '//cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js',
        bootstrap_datetimepicker_css: '//cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css',
        bootbox: '//cdn.staticfile.org/bootbox.js/4.4.0/bootbox.min.js'
    }
};
