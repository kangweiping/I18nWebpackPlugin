const Parser = require('webpack/lib/Parser');
const ConstDependency = require("webpack/lib/dependencies/ConstDependency");
const NullFactory = require("webpack/lib/NullFactory");
const XLSX = require('xlsx');

const cnCharacterPattern = /[\u4E00-\u9FA5]/;
const isFunction = fn => typeof fn === 'function'; 

function I18nPlugin(options) {
  this.options = options;
  this.i18nData = {};
  this.languages = this.normalizeLanguages(options.languages);
  this.enhanceParser();
}

I18nPlugin.prototype.enhanceParser = function() {
  Parser.prototype.walkLiteral = function(expr) {
    if (cnCharacterPattern.test(expr.value)) {
      var dep = new ConstDependency(`i18n(${expr.raw})`, expr.range);
      dep.loc = expr.loc;
      this.state.current.addDependency(dep);
    }
  };
};

I18nPlugin.prototype.normalizeLanguages = function(languages) {
  if (Array.isArray(languages)) {
    return languages.reduce((res, key) => {
      res[key] = key;
      return res;
    }, {});
  }
  return languages;
};

I18nPlugin.prototype.readData = function() {
  if (isFunction(this.options.readData)) {
    this.options.readData.call(this);
    return;
  }
  const workbook = XLSX.readFile(this.options.i18nFilePath);
  const workSheet = workbook.Sheets[workbook.SheetNames[0]];
  const key = workSheet.A1.v;
  const data = XLSX.utils.sheet_to_json(workSheet);
  const languages = this.languages;
  Object.keys(languages).forEach(language => {
    const i18nData = this.i18nData[language] = {};
    data.forEach(item => {
      i18nData[item[key]] = item[languages[language]]; // TODO fix duplicate key
    });
  });
};

I18nPlugin.prototype.getContent = function(language) {
  const content = JSON.stringify(this.i18nData[language], null, 2);

  return `;(function() {
  var i18nData = ${content};
  window.i18n = function(key) {
    return i18nData[key];
  };
}());
`;
};

I18nPlugin.prototype.apply = function(compiler) {
  const options = this.options;
  const self = this;
  this.readData();

  compiler.plugin('emit', function(compilation, callback) {
    const outputPath = compilation.getPath(compiler.outputPath);
    Object.keys(self.languages).forEach(language => {
      const content = self.getContent(language);
      compilation.assets[`${language}.js`] = {
        source: function () {
          return content;
        },
        size: function () {
          return content.length;
        }
      };
    });
    callback();
  });
  compiler.plugin('compilation', function(compilation, params) {
		// compilation.dependencyFactories.set(ConstDependency, new NullFactory());
    // compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());

    // for html-webpack-plugin
    compilation.plugin('html-webpack-plugin-before-html-processing', function(args, callback) {
      args.assets.js.unshift(options.i18nOutputPath);
      return callback();
    });
  });
};

module.exports = I18nPlugin;
