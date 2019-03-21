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
        jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
        jquery_dev: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js',
        bootstrap: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js',
        bootstrap_css: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css',
        bootstrap_dev: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.js',
        momentjs: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.1/moment-with-locales.min.js',
        momentjs_dev: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.1/moment-with-locales.js',
        vue: 'https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.16/vue.min.js',
        vue_dev: 'https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.16/vue.js',
        i18next: 'https://cdnjs.cloudflare.com/ajax/libs/i18next/11.3.2/i18next.min.js',
        i18next_dev: 'https://cdnjs.cloudflare.com/ajax/libs/i18next/11.3.2/i18next.js',
        bootstrap_table_css: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/bootstrap-table.min.css',
        bootstrap_table: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/bootstrap-table.min.js',
        bootstrap_table_locale_zh_CN: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/locale/bootstrap-table-zh-CN.min.js',
        bootstrap_datetimepicker: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js',
        bootstrap_datetimepicker_css: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css',
        bootbox: 'https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js',
        echarts: 'https://cdnjs.cloudflare.com/ajax/libs/echarts/3.8.5/echarts.min.js',
        echarts_dev: 'https://cdnjs.cloudflare.com/ajax/libs/echarts/3.8.5/echarts.js'
    }
};
