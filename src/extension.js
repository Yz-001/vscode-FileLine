const vscode = require("vscode");

// Define the tags that need to be computed, grouped by file type
const NEED_COMPUTE_TAG = [
  { lintFileType: "vue", tags: ["template", "script", "style"] },
];

let statusBarObj = {};
let islimit = false; // Default value, will be set from configuration

function getConfiguration(configName) {
  return vscode.workspace
    .getConfiguration()
    .get(`vscodePluginFileLine.${configName}`);
}

// Function to clear all status bars
function clearAllStatusBars() {
  Object.keys(statusBarObj).forEach((key) => {
    disposeStatusBarItem(key);
  });
}

// Function to dispose a single status bar item
function disposeStatusBarItem(key) {
  statusBarObj[key]?.dispose();
  delete statusBarObj[key];
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("fileline.examine", () => {
      islimit = getConfiguration("alimit");
      vscode.window.showInformationMessage("Welcome to use fileLine plugin!");
      updateStatusBar(vscode.window.activeTextEditor?.document);
    })
  );

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (
      event.affectsConfiguration("vscodePluginFileLine.alimit") ||
      event.affectsConfiguration("vscodePluginFileLine.count") ||
      event.affectsConfiguration("vscodePluginFileLine.template") ||
      event.affectsConfiguration("vscodePluginFileLine.script") ||
      event.affectsConfiguration("vscodePluginFileLine.style")
    ) {
      islimit = getConfiguration("alimit");
      updateStatusBar(vscode.window.activeTextEditor?.document);
    }
  });

  function updateStatusBar(document) {
    if (!document) {
      clearAllStatusBars(); // Clear all status bars when no document is active
      return;
    }

    if (document.fileName.endsWith(".vue")) {
      setStatusBarBtn(document, context);
    } else {
      handleNonVueDocument(document);
    }
  }

  function handleNonVueDocument(document) {
    const countLimit = getNumericConfiguration("count");
    const lineTotal = `Count: ${document.lineCount}`;
    if (islimit && countLimit !== null) {
      const messageWithLimit = `${lineTotal} / ${countLimit}`;
      const icon = "$(arrow-circle-up)";
      const fullMessage = `${icon} ${messageWithLimit}`;
      updateOrCreateStatusBarItem(
        "count",
        fullMessage,
        document.lineCount > countLimit ? "red" : undefined
      );
      clearNonCountStatusBars(); // Clear non-count status bars
    } else {
      updateOrCreateStatusBarItem("count", lineTotal);
      clearNonCountStatusBars();
    }
  }

  function setStatusBarBtn(document, context) {
    const applicableTags =
      NEED_COMPUTE_TAG.find((item) => item.lintFileType === "vue")?.tags || [];

    // First handle Count status bar item
    const countLimit = getNumericConfiguration("count");
    const lineTotal = `Count: ${document.lineCount}`;
    if (islimit && countLimit !== null) {
      const messageWithLimit = `${lineTotal} / ${countLimit}`;
      const icon = "$(arrow-circle-up)";
      const fullMessage = `${icon} ${messageWithLimit}`;
      updateOrCreateStatusBarItem(
        "count",
        fullMessage,
        document.lineCount > countLimit ? "red" : undefined
      );
    } else {
      updateOrCreateStatusBarItem("count", lineTotal);
    }

    for (const tag of applicableTags) {
      const tagTotal = getTextRegexTagCount(document, tag);
      if (tagTotal > 0) {
        if (islimit) {
          const tagLimit = getNumericConfiguration(tag);
          if (tagLimit !== null) {
            const message = `${tag.replace(
              tag[0],
              tag[0].toUpperCase()
            )}:${tagTotal}/${tagLimit}`;
            const isOverLimit = tagTotal > tagLimit;
            const iconForTag = isOverLimit ? "$(arrow-circle-up)" : "";
            const fullMessageForTag = iconForTag
              ? `${iconForTag} ${message}`
              : message;
            createOrUpdateSBItemWithCmd(
              tag,
              fullMessageForTag,
              document,
              tag,
              isOverLimit ? "red" : undefined,
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

    const commandName = `fileline.jumpTo${tag
      .charAt(0)
      .toUpperCase()}${tag.slice(1)}`;

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

  function clearNonCountStatusBars() {
    Object.keys(statusBarObj).forEach((key) => {
      if (key !== "count") {
        disposeStatusBarItem(key);
      }
    });
  }

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

  function getTextRegexTagCount(document, tag) {
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

  function getNumericConfiguration(configName) {
    if (!islimit) return null;
    const configValue = getConfiguration(configName);
    const numericValue = Number(configValue);
    return isNaN(numericValue) || configValue === "" ? null : numericValue;
  }

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      vscode.window.activeTextEditor &&
      event.document === vscode.window.activeTextEditor.document
    ) {
      updateStatusBar(event.document);
    }
  });

  vscode.workspace.onDidOpenTextDocument((document) => {
    if (
      vscode.window.activeTextEditor &&
      document === vscode.window.activeTextEditor.document
    ) {
      updateStatusBar(document);
    }
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateStatusBar(editor.document);
    } else {
      clearAllStatusBars(); // Clear all status bars when no editor is active
    }
  });

  if (!vscode.window.activeTextEditor) {
    clearAllStatusBars(); // Ensure all status bars are cleared on activation if no editor is active
  } else {
    updateStatusBar(vscode.window.activeTextEditor.document);
  }
}

function deactivate() {
  clearAllStatusBars(); // Clean up all status bars on deactivation
}

module.exports = {
  activate,
  deactivate,
};
