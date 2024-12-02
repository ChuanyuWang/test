import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { resolve } from 'path'

const pagesPath = "src/pages";

// vite.config.js, refer to https://vitejs.dev/config/
export default defineConfig({
    publicDir: 'public',
    plugins: [vue()],
    build: {
        target: 'es2015', // https://esbuild.github.io/api/#target
        outDir: 'public', // outDir is the same with publicDir 
        emptyOutDir: false, // outDir is same with publicDir, DO NOT clean before build
        copyPublicDir: false, // outDir is same with publicDir, no need to copy
        manifest: true,
        rollupOptions: {
            input: {
                style: resolve(__dirname, 'src/css/style.less'),
                main: resolve(__dirname, pagesPath, 'home/main.js'),
                class_detail: resolve(__dirname, pagesPath, 'home/class_view.js'),
                member: resolve(__dirname, pagesPath, 'members/member.js'),
                member_detail: resolve(__dirname, pagesPath, 'members/member_detail.js'),
                booking: resolve(__dirname, pagesPath, 'booking/booking.js'),
                mybooking: resolve(__dirname, pagesPath, 'booking/mybooking.js'),
                mybooks: resolve(__dirname, pagesPath, 'mybooks/mybooks.js'),
                trial: resolve(__dirname, pagesPath, 'trial/trial.js'),
                cockpit: resolve(__dirname, pagesPath, 'cockpit/cockpit.js'),
                course: resolve(__dirname, pagesPath, 'course/course.js'),
                course_detail: resolve(__dirname, pagesPath, 'course/course_view.js'),
                setting: resolve(__dirname, pagesPath, 'settings/setting.js'),
                statistics: resolve(__dirname, pagesPath, 'statistics/statistics.js'),
                contracts: resolve(__dirname, pagesPath, 'finance/finance.js'),
                contract_detail: resolve(__dirname, pagesPath, 'finance/contract_detail.js'),
                contract_create: resolve(__dirname, pagesPath, 'finance/contract_create.js'),
                admin: resolve(__dirname, pagesPath, 'admin/admin.js'),

                // below pages under development
                portal: resolve(__dirname, pagesPath, 'app/mobileportal.js'),
                poster: resolve(__dirname, pagesPath, 'poster/poster.js'),
            },
            output: {
                format: 'es',
                entryFileNames: 'js/[name].js',
                assetFileNames: 'css/[name].[ext]',
                chunkFileNames: 'js/[name].js',
                // The trick comes from https://github.com/rollup/rollup/issues/2756
                //manualChunks: () => 'everything.js',
                manualChunks: (id) => {
                    if (id.includes('src/components') || id.includes('src/common') || id.includes('src/services')) {
                        return 'common';
                    }
                },
                banner: (chunk) => {
                    // need to mark the comment as important by using /*! */ instead of /* */
                    return `
                        /*!
                        * Version: ${process.env.npm_package_version || '1.0.0'}
                        * Copyright ©2017-${new Date().getFullYear()} Chuanyu Wang
                        * File: ${chunk.fileName}
                        */`;
                }
            }
        },
        /**
         * refer to https://vite.dev/config/build-options.html#build-csscodesplit
         * Enable/disable CSS code splitting. 
         * When enabled, CSS imported in async JS chunks will be preserved as chunks and fetched together when the chunk is fetched.
         * If disabled, all CSS in the entire project will be extracted into a single CSS file.
         * Long discussion in https://github.com/vitejs/vite/issues/1579
         */
        cssCodeSplit: false
    },
    server: {
        middlewareMode: true
    }
})
