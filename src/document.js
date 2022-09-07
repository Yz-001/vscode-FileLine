const vscode = require('vscode');
const { activeTextEditor } = vscode.window

//重置文档内容
export function resetActiveText(content) {
  if (content) {
    activeTextEditor.edit(editBuilder => {
      // 从开始到结束，全量替换
      const end = new vscode.Position(activeTextEditor.document.lineCount + 1, 0);
      editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), content);
    })
  }
}