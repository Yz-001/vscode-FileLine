const vscode = require("vscode");
/**
 * 获取指定名称的配置项
 * @param {string} configName - 配置项名称
 * @returns {*} 配置项的值
 */
function getConfiguration(configName) {
  return vscode.workspace
    .getConfiguration()
    .get(`vscodePluginFileLine.${configName}`);
}

/**
 * 获取配置项数值化
 * @param {string} configName - 配置项名称
 * @returns {number|null} 数值型配置项的值
 */
function getNumericConfiguration(configName) {
  const configValue = getConfiguration(configName);
  const numericValue = Number(configValue);
  return isNaN(numericValue) || configValue === "" ? null : numericValue;
}

module.exports = {
  getConfiguration,
  getNumericConfiguration,
};
