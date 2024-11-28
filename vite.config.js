import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { resolve } from 'path'

// vite.config.js, refer to https://vitejs.dev/config/
export default defineConfig({
    publicDir: 'public',
    plugins: [vue()],
    build: {
        target: 'es2015', // https://esbuild.github.io/api/#target
        outDir: 'public', // outDir is the same with publicDir 
        emptyOutDir: false, // outDir is same with publicDir, DO NOT clean before build
        copyPublicDir: false, // outDir is same with publicDir, no need to copy
        rollupOptions: {
            input: {
                style: resolve(__dirname, 'src/css/style.less'),
                main: resolve(__dirname, 'src/pages/home/main.js')
            },
            output: {
                format: 'es',
                entryFileNames: 'js/[name].js',
                assetFileNames: 'css/[name].[ext]'
            }
        },
        /**
         * refer to https://vite.dev/config/build-options.html#build-csscodesplit
         * Enable/disable CSS code splitting. 
         * When enabled, CSS imported in async JS chunks will be preserved as chunks and fetched together when the chunk is fetched.
         * If disabled, all CSS in the entire project will be extracted into a single CSS file.
         */
        cssCodeSplit: false
    },
    server: {
        middlewareMode: true
    }
})
