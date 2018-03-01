const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const I18nPlugin = require('./i18nPlugin');

module.exports = {
  context: __dirname,
  entry: {
    main: path.join(__dirname, 'main.js')
  },
  output: {
    path: path.join(__dirname, 'js'),
    filename: '[name].js'
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new I18nPlugin({
      i18nFilePath: path.join(__dirname, 'i18n.xls'),
      languages: ['en_US', 'zh_CN'],
      // languages: {
      //   en_US: '英文',
      //   zh_CN: '中文'
      // },
      i18nOutputPath: 'curLanguage.js'
    })
  ]
}