module.exports = {
    log4js: {
        /**
         * use the `disableClustering: true` option in your log4js configuration
         * to have every process behave as if it were the master process. 
         * Be careful if you’re logging to files.
         */
        disableClustering: true,
        /**
         * install the pm2-intercom module to PM2 before enable below option
         * Refer to https://log4js-node.github.io/log4js-node/clustering.html
         */
        //pm2: true,
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
                    pattern: '[%x{ISOTime}] [%z] [%p] %m',
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
        jquery: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/jquery/3.5.1/jquery.min.js',
        jquery_dev: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-y/jquery/3.5.1/jquery.js',
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
        i18next: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-y/i18next/20.2.4/i18next.min.js',
        i18next_dev: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/i18next/20.2.4/i18next.js',
        bootstrap_table_css: 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootstrap-table/1.15.5/bootstrap-table.min.css',
        table_export: 'https://unpkg.com/tableexport.jquery.plugin@1.10.22/tableExport.min.js',
        bootstrap_table: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootstrap-table/1.15.5/bootstrap-table.min.js',
        bootstrap_table_vue: 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootstrap-table/1.15.5/bootstrap-table-vue.min.js',
        bootstrap_table_export: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootstrap-table/1.15.5/extensions/export/bootstrap-table-export.min.js',
        bootstrap_table_locale_zh_CN: 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootstrap-table/1.15.5/locale/bootstrap-table-zh-CN.min.js',
        bootstrap_datetimepicker: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/eonasdan-bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min.js',
        bootstrap_datetimepicker_css: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/eonasdan-bootstrap-datetimepicker/4.17.47/css/bootstrap-datetimepicker.min.css',
        bootbox: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/bootbox.js/4.4.0/bootbox.min.js',
        echarts: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/echarts/5.3.0/echarts.min.js',
        echarts_dev: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/echarts/5.3.0/echarts.js',
        blueimp_md5: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-y/blueimp-md5/2.19.0/js/md5.min.js',
        axios: 'https://cdn.jsdelivr.net/npm/axios@1.3.4/dist/axios.min.js',
        axios_dev: 'https://cdn.jsdelivr.net/npm/axios@1.3.4/dist/axios.js',
        vuetify: 'https://cdn.bootcdn.net/ajax/libs/vuetify/2.6.14/vuetify.min.js',
        vuetify_dev: 'https://cdn.bootcdn.net/ajax/libs/vuetify/2.6.14/vuetify.js',
        vuetify_css: 'https://cdn.bootcdn.net/ajax/libs/vuetify/2.6.14/vuetify.min.css',
        vuetify_css_dev: 'https://cdn.bootcdn.net/ajax/libs/vuetify/2.6.14/vuetify.css',
        vue_router: 'https://cdn.bootcdn.net/ajax/libs/vue-router/3.6.5/vue-router.min.js',
        vue_router_dev: 'https://cdn.bootcdn.net/ajax/libs/vue-router/3.6.5/vue-router.js'
    }
};
