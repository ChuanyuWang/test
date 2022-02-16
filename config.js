module.exports = {
    log4js: {
        /**
         * use the `disableClustering: true` option in your log4js configuration
         * to have every process behave as if it were the master process. 
         * Be careful if you’re logging to files.
         */
        disableClustering: true,
        appenders: {
            dev: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '[%d{hh:mm:ss.SSS}] [%p] <%f{1}:%l> %m'
                }
            },
            out: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '[%x{ISOTime}] [%p] %m',
                    tokens: {
                        ISOTime: function(logEvent) {
                            return logEvent.startTime.toISOString();
                        }
                    }
                }
            }
        },
        categories: {
            default: { appenders: ['dev'], level: 'trace', enableCallStack: true },
            production: { appenders: ['out'], level: 'info', enableCallStack: false }
        }
    },
    /**
     * Free CDN library
     * 1. https://cdnjs.com/
     * 2. https://www.staticfile.org/
     * 3. https://docs.microsoft.com/en-us/aspnet/ajax/cdn/overview
     * 4. http://www.bootcdn.cn/ rename to https://cdn.bootcdn.net/
     * 5. https://unpkg.com/
     * 6. https://www.jsdelivr.com/
     * 7. http://cdn.bytedance.com/
     * 8. https://www.staticaly.com
     */
    cdnlibs: {
        jquery: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/jquery/3.4.1/jquery.min.js',
        jquery_dev: 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y/jquery/3.4.1/jquery.js',
        bootstrap: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/twitter-bootstrap/3.4.1/js/bootstrap.min.js',
        bootstrap_css: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/twitter-bootstrap/3.4.1/css/bootstrap.min.css',
        bootstrap_dev: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-y/twitter-bootstrap/3.4.1/js/bootstrap.js',
        momentjs: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-y/moment.js/2.22.1/moment-with-locales.min.js',
        momentjs_dev: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/moment.js/2.22.1/moment-with-locales.js',
        /**
         * Steps of upgrade vue version?
         * 1. Update vue CDN version
         * 2. Update vue-template-compiler version, the same as vue
         */
        vue: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/vue/2.6.14/vue.min.js',
        vue_dev: 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y/vue/2.6.14/vue.js',
        i18next: 'https://cdn.jsdelivr.net/npm/i18next@20.2.4/i18next.min.js',
        i18next_dev: 'https://cdn.jsdelivr.net/npm/i18next@20.2.4/i18next.js',
        bootstrap_table_css: 'https://cdn.jsdelivr.net/npm/bootstrap-table@1.15.5/dist/bootstrap-table.min.css',
        table_export: 'https://unpkg.com/tableexport.jquery.plugin@1.10.22/tableExport.min.js',
        bootstrap_table: 'https://cdn.jsdelivr.net/npm/bootstrap-table@1.15.5/dist/bootstrap-table.min.js',
        bootstrap_table_vue: 'https://cdn.jsdelivr.net/npm/bootstrap-table@1.15.5/dist/bootstrap-table-vue.min.js',
        bootstrap_table_export: 'https://cdn.jsdelivr.net/npm/bootstrap-table@1.15.5/dist/extensions/export/bootstrap-table-export.min.js',
        bootstrap_table_locale_zh_CN: 'https://cdn.jsdelivr.net/npm/bootstrap-table@1.15.5/dist/locale/bootstrap-table-zh-CN.min.js',
        bootstrap_datetimepicker: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/eonasdan-bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js',
        bootstrap_datetimepicker_css: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/eonasdan-bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css',
        bootbox: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootbox.js/4.4.0/bootbox.min.js',
        echarts: 'https://cdn.jsdelivr.net/npm/echarts@3.8.5/dist/echarts.min.js',
        echarts_dev: 'https://cdn.jsdelivr.net/npm/echarts@3.8.5/dist/echarts.js'
    }
};
