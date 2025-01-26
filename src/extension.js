const vscode = require("vscode");
const { getConfiguration } = require("./configHandler.js");
const {
  clearAllStatusBars,
  updateStatusBar,
} = require("./statusBarManager.js");

let islimit = false; // 是否启用限制，默认值为false，将根据配置设置

/**
 * 激活插件时调用的主要函数
 * @param {Object} context - 上下文
 */
function activate(context) {
  // 注册命令，当执行fileline.examine命令时触发
  context.subscriptions.push(
    vscode.commands.registerCommand("fileline.examine", () => {
      islimit = getConfiguration("alimit");
      vscode.window.showInformationMessage("Welcome to use fileLine plugin!");
      updateStatusBar(
        vscode.window.activeTextEditor?.document,
        context,
        islimit
      );
    })
  );

  // 配置变化触发 更新
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (
      event.affectsConfiguration("vscodePluginFileLine.alimit") ||
      event.affectsConfiguration("vscodePluginFileLine.count") ||
      event.affectsConfiguration("vscodePluginFileLine.template") ||
      event.affectsConfiguration("vscodePluginFileLine.script") ||
      event.affectsConfiguration("vscodePluginFileLine.style")
    ) {
      islimit = getConfiguration("alimit");
      updateStatusBar(
        vscode.window.activeTextEditor?.document,
        context,
        islimit
      );
    }
  });

  // 文本编辑器变化时触发 更新
  vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      vscode.window.activeTextEditor &&
      event.document === vscode.window.activeTextEditor.document
    ) {
      updateStatusBar(event.document, context, islimit);
    }
  });
  // 打开文本时触发 更新
  vscode.workspace.onDidOpenTextDocument((document) => {
    if (
      vscode.window.activeTextEditor &&
      document === vscode.window.activeTextEditor.document
    ) {
      updateStatusBar(document, context, islimit);
    }
  });
  // 活动文本编辑器变化时触发 更新
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateStatusBar(editor.document, context, islimit);
    } else {
      clearAllStatusBars();
    }
  });
  // 没有活动编辑器，清除所有状态栏
  if (!vscode.window.activeTextEditor) {
    clearAllStatusBars();
  } else {
    updateStatusBar(vscode.window.activeTextEditor.document, context, islimit);
  }
}

function deactivate() {
  clearAllStatusBars(); // 清除所有状态栏项
}

module.exports = {
  activate,
  deactivate,
};
