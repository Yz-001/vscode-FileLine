// const vscode = require('vscode');
// const { workspace } = vscode

// // 获取用户在设置配置数 如果没有设置，返回undefined
// export function getConfiguration(configName){
//   return workspace.getConfiguration().get(`vscodePluginFileLine.${configName}`);
// }

// //设置配置 最后一个参数，为true时表示写入全局配置，为false或不传时则只写入工作区配置
// export function setConfiguration(configName,value,isGlobal=true){
//   workspace.getConfiguration().update(`vscodePluginFileLine.${configName}`, value, isGlobal);
// }