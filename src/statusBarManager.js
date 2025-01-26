const vscode = require("vscode");
const { getNumericConfiguration } = require("./configHandler.js");

const COUNT_TEXT = "Count"; // 汇总展示文字
const VSCODE_ARROWUP_ICON = "$(arrow-circle-up)"; // 上限icon
const OVER_BAR_COLOR = "red"; // 上限color
const NEED_COMPUTE_TAG = [
  {
    lintFileType: "vue",
    tags: ["template", "script", "style"],
    method: setVueStatusBarBtn,
  },
]; // 定义需要计算标签的文件类型及对应标签 除自定义外，其他的都按固定展示count处理
let statusBarObj = {}; // 状态栏对象，用于存储所有状态栏项

/**
 * 清除所有状态栏项
 */
function clearAllStatusBars() {
  Object.keys(statusBarObj).forEach((key) => {
    disposeStatusBarItem(key);
  });
}

/**
 * 销毁单个状态栏项
 * @param {string} key - 状态栏项的键名
 */
function disposeStatusBarItem(key) {
  statusBarObj[key]?.dispose();
  delete statusBarObj[key];
}

/**
 * 更新状态栏显示内容
 * @param {vscode.TextDocument} document - 当前激活的文本文档
 */
function updateStatusBar(document, context, islimit) {
  if (!document) {
    clearAllStatusBars();
    return;
  }
  const customUpdateFileItem = NEED_COMPUTE_TAG.find((item) =>
    document.fileName.endsWith(`.${item.lintFileType}`)
  );
  if (customUpdateFileItem) {
    customUpdateFileItem.method(document, context, islimit);
  } else {
    handleUpdateOtherBar(document, islimit);
  }
}

/**
 * 设置文件总数bar
 * @param {vscode.TextDocument} document - 当前激活的文本文档
 * @param {boolean} islimit - 是否启用上限制
 * @param {boolean} isClearCountBar - 是否要更新创建状态栏count项
 */
function setCountStatusBar(document, islimit, isClearCountBar) {
  const countLimit = islimit ? getNumericConfiguration("count") : null;
  const lineTotal = `${COUNT_TEXT}: ${document.lineCount}`;
  if (islimit && countLimit !== null) {
    const messageWithLimit = `${lineTotal} / ${countLimit}`;
    const fullMessage = `${
      document.lineCount > countLimit ? VSCODE_ARROWUP_ICON : ""
    } ${messageWithLimit}`;
    updateOrCreateStatusBarItem(
      COUNT_TEXT,
      fullMessage,
      document.lineCount > countLimit ? OVER_BAR_COLOR : undefined
    );
    if (isClearCountBar) clearNonCountStatusBars();
  } else {
    updateOrCreateStatusBarItem(COUNT_TEXT, lineTotal, undefined);
    if (isClearCountBar) clearNonCountStatusBars();
  }
}

/**
 * 其他文件 只展示count总数
 * @param {vscode.TextDocument} document - 当前激活的文本文档
 * @param {boolean} islimit - 是否启用上限制
 */
function handleUpdateOtherBar(document, islimit) {
  setCountStatusBar(document, islimit, false);
}

/**
 * vue文件 展示状态操作按钮
 * @param {vscode.TextDocument} document - 当前激活的文本文档
 * @param {Object} context - 上下文
 * @param {boolean} islimit - 是否启用上限制
 */
function setVueStatusBarBtn(document, context, islimit) {
  const applicableTags =
    NEED_COMPUTE_TAG.find((item) => item.lintFileType === "vue")?.tags || [];
  // 设置count
  setCountStatusBar(document, islimit, true);

  // 设置自定义标签操作栏
  for (const tag of applicableTags) {
    const tagTotal = getVueTextRegexTagCount(document, tag);
    if (tagTotal > 0) {
      if (islimit) {
        const tagLimit = getNumericConfiguration(tag);
        if (tagLimit !== null) {
          const message = `${tag.replace(
            tag[0],
            tag[0].toUpperCase()
          )}:${tagTotal}/${tagLimit}`;
          const isOverLimit = tagTotal > tagLimit;
          const iconForTag = isOverLimit ? VSCODE_ARROWUP_ICON : "";
          const fullMessageForTag = iconForTag
            ? `${iconForTag} ${message}`
            : message;
          createOrUpdateSBItemWithCmd(
            tag,
            fullMessageForTag,
            document,
            tag,
            isOverLimit ? OVER_BAR_COLOR : undefined,
            context
          );
        } else {
          const message = `${tag.replace(
            tag[0],
            tag[0].toUpperCase()
          )}:${tagTotal}`;
          createOrUpdateSBItemWithCmd(
            tag,
            message,
            document,
            tag,
            undefined,
            context
          );
        }
      } else {
        const message = `${tag.replace(
          tag[0],
          tag[0].toUpperCase()
        )}:${tagTotal}`;
        createOrUpdateSBItemWithCmd(
          tag,
          message,
          document,
          tag,
          undefined,
          context
        );
      }
    }
  }
}

/**
 * 创建或更新一个特定于某个标签的状态栏项，并绑定相应的命令以实现点击跳转功能
 * @param {string} key - 状态栏项的键名
 * @param {string} message - 显示的消息
 * @param {vscode.TextDocument} document - 文本文档
 * @param {string} tag - 标签名称
 * @param {string|undefined} color - 文字颜色
 * @param {Object} context - 插件上下文
 */
function createOrUpdateSBItemWithCmd(
  key,
  message,
  document,
  tag,
  color,
  context
) {
  if (!statusBarObj[key]) {
    statusBarObj[key] = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    statusBarObj[key].show();
  }
  statusBarObj[key].text = message;
  statusBarObj[key].color = color;

  const commandName = `fileline.jumpTo${tag.charAt(0).toUpperCase()}${tag.slice(
    1
  )}`;

  // Check if the command already exists before registering it
  vscode.commands.getCommands(true).then((commands) => {
    if (!commands.includes(commandName)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(commandName, () => {
          jumpToTagBlock(document, tag);
        })
      );
    }
    statusBarObj[key].command = commandName;
  });
}

/**
 * 实现点击状态栏项后跳转到对应的标签块位置的功能
 * @param {vscode.TextDocument} document - 文本文档
 * @param {string} tag - 标签名称
 */
function jumpToTagBlock(document, tag) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const text = document.getText();
  const startPattern = new RegExp(`<${tag}[^>]*>`, "gi");
  let match;
  let targetStartIndex = -1;
  while ((match = startPattern.exec(text)) !== null) {
    if (targetStartIndex === -1) {
      targetStartIndex = match.index;
    }
  }

  if (targetStartIndex === -1) return;

  const startPosition = document.positionAt(targetStartIndex);

  const endPattern = new RegExp(`</${tag}>`, "i");
  const remainingText = text.substring(targetStartIndex);
  const endIndexRelativeToStart = remainingText.search(endPattern);
  let endPosition;
  if (endIndexRelativeToStart !== -1) {
    const endIndex = targetStartIndex + endIndexRelativeToStart;
    endPosition = document.positionAt(endIndex);
  } else {
    endPosition = startPosition;
  }

  const selection = new vscode.Selection(startPosition, startPosition);
  editor.selection = selection;
  editor.revealRange(selection);
}

/**
 * 清除非计数状态栏项
 */
function clearNonCountStatusBars() {
  Object.keys(statusBarObj).forEach((key) => {
    if (key !== COUNT_TEXT) {
      disposeStatusBarItem(key);
    }
  });
}
/**
 * 创建或更新状态栏项
 * @param {string} key - 状态栏项的键名
 * @param {string} message - 显示的消息
 * @param {string|undefined} color - 文字颜色
 */
function updateOrCreateStatusBarItem(key, message, color) {
  if (!statusBarObj[key]) {
    statusBarObj[key] = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    statusBarObj[key].show();
  }
  statusBarObj[key].text = message;
  statusBarObj[key].color = color;
}
/**
 * vue文件 计算给定标签的行数
 * @param {vscode.TextDocument} document - 文本文档
 * @param {string} tag - 标签名称
 * @returns {number} 行数
 */
function getVueTextRegexTagCount(document, tag) {
  let content = document.getText();
  if (!content) {
    console.error("Document content is empty.");
    return 0;
  }
  if (document.fileName.endsWith(".vue")) {
    const vueBlocks = {
      template: /<template[^>]*>([\s\S]*?)<\/template>/gi,
      script: /<script[^>]*>([\s\S]*?)<\/script>/gi,
      style: /<style[^>]*>([\s\S]*?)<\/style>/gi,
    };
    const blockContentMatch = content.match(vueBlocks[tag]);
    if (blockContentMatch && Array.isArray(blockContentMatch)) {
      let sum = 0;
      for (const block of blockContentMatch) {
        sum += block.split("\n").length;
      }
      return sum;
    }
  }
  return 0;
}

module.exports = {
  COUNT_TEXT,
  VSCODE_ARROWUP_ICON,
  OVER_BAR_COLOR,
  NEED_COMPUTE_TAG,
  statusBarObj,
  clearAllStatusBars,
  disposeStatusBarItem,
  updateStatusBar,
  setCountStatusBar,
  handleUpdateOtherBar,
  setVueStatusBarBtn,
  createOrUpdateSBItemWithCmd,
  jumpToTagBlock,
  clearNonCountStatusBars,
  updateOrCreateStatusBarItem,
  getVueTextRegexTagCount,
};
