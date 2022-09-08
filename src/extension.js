// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// import { window, StatusBarItem } from 'vscode';
// import { getConfiguration } from "./configuration.js";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const NEED_COMPUTE_TAG = ['script', 'style']
let computeMap = new Map()
let matchMap = new Map()
let statusBarObj = {}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	let statusBarEvent=vscode.commands.registerCommand('fileline.range', function (tag='style') {
		// vscode.window.showInformationMessage('click!!!');
		gotoDocumentRange(vscode.window.activeTextEditor.document.fileName,tag)

		// 跳转到文件的指定范围
		function gotoDocumentRange(path,tag){
			// const path = '/Users/somefile.txt';
			// const {start,end}=matchMap.get(tag)
			// console.log('matchMap',matchMap);
			// vscode.window.activeTextEditor.document.offsetAt(new vscode.Position(100,0))
			// const options = {
			// 	// 选中第3行第9列到第3行第17列
			// 	selection: new vscode.Range(new vscode.Position(...start), new vscode.Position(...end)),
			// 	// 是否预览，默认true，预览的意思是下次再打开文件是否会替换当前文件
			// 	preview: false,
			// 	// 显示在第二个编辑器
			// 	viewColumn: vscode.ViewColumn.Two
			// };
			// vscode.window.showTextDocument(vscode.Uri.file(path), options);
		}
	})

	let disposable = vscode.commands.registerCommand('fileline.examine', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user

		//alimit a为开头 因为配置是按字母排序的 
		let islimit = getConfiguration('alimit')

		vscode.window.showInformationMessage('welcome use fileLine plugin!');

		/**
		 * 根据文档内容，获取标签总数
		 * @param {*} document 当前文档内容
		 * @param {*} tag 标签名
		 * @returns 统计的标签数
		 */
		function getTextRegexTagCount(document, tag) {
			let content = document.replace(/\"/g, '\'')
			let contentList = content.split('\r')
			let joinStr = ``
			for (const index in contentList) {
				joinStr += `"${index}${contentList[index]}"+`
			}
			const textMatch = joinStr.match(new RegExp(`\<${tag}((.|\n)*?)\<\/${tag}\>`, 'ig'))
			const textsearch = joinStr.match(new RegExp(`\<${tag}((.|\n)*?)\<\/${tag}\>`, 'i'))

			// 存在多个相同标签的情况 总数需要叠加
			if (textMatch) {
				let sum = 0
				for (const matchIndex in textMatch) {
					const currentSum=textMatch[matchIndex].split('\n').length
					console.log('textMatch: ', textMatch);
					sum += currentSum
					//set
					matchMap.set(tag,{start:[textsearch.index,0],end:[textsearch.index+currentSum-1,contentList[matchIndex].length]})
				}
				return sum
			}
		}

		/**
		 * 统计最新状态栏文字
		 * @param {*} document 当前文档内容
		 * @param {*} lineCount 当前文档内容总行数
		 * @returns 最后bar展示的文字
		 */
		async function getBarMessage(document, lineCount) {
			// const fileName = document.fileName;

			// 总数直接取返回文档参数 额外写 
			let countLimit = getConfiguration('count') && islimit ? `/ ${getConfiguration('count')}` : '';
			const lineTotal = lineCount ? `Count: ${lineCount} ${countLimit}` : '';
			const iconLimit = countLimit && lineTotal>getConfiguration('count')  ? `$(arrow-circle-up)`: '';
			computeMap.set(`${iconLimit} Count`, lineTotal)

			// for (const tag of NEED_COMPUTE_TAG) {
			// 	// 启用界限配置才会展示指定界限数
			// 	const tagLimit = getConfiguration(tag) && islimit ? `/ ${getConfiguration(tag)}` : '';
			// 	const tagTotal = getTextRegexTagCount(document, tag);
			// 	//超过界限值 出现icon 
			// 	const iconLimit = tagLimit && tagTotal>getConfiguration(tag)  ? `$(arrow-circle-up)`: '';
			// 	const message = tagTotal ? ` ${iconLimit} ${tag.replace(tag[0], tag[0].toUpperCase())}:${tagTotal} ${tagLimit}` : '';
			// 	computeMap.set(tag, message)
			// }
			return [...computeMap.values()].join(" ")
		}

		/**
		 * 更新状态栏文字
		 * @param {*} document 当前文档内容
		 */
		async function updateStatusBar(document) {
			// no file return 
			if (!vscode.window.activeTextEditor) {
				return;
			}

			let message = ''
			if (document) {
				message = await getBarMessage(document.getText(), document.lineCount)
				setStatusBarBtn(document.getText())
			}

			// set statusbar
			vscode.window.setStatusBarMessage(message);
		}


		//初始化状态栏 没有文件情况下不展示
		if (vscode.window.activeTextEditor) {
			updateStatusBar(vscode.window.activeTextEditor.document)
		}

		// 修改文档内容触发
		vscode.workspace.onDidChangeTextDocument((activeTextEditor) => {
			updateStatusBar(activeTextEditor.document);
		})

		// 打开文档内容触发
		vscode.workspace.onDidOpenTextDocument((document) => {
			updateStatusBar(document);
		});

		// 获取用户在设置配置数 如果没有设置，返回undefined
		function getConfiguration(configName) {
			return vscode.workspace.getConfiguration().get(`vscodePluginFileLine.${configName}`);
		}
		
		// 设置底部状态栏按钮
		function setStatusBarBtn(document) {
			for (const tag of NEED_COMPUTE_TAG) {
				// 启用界限配置才会展示指定界限数
				const tagLimit = getConfiguration(tag) && islimit ? `/ ${getConfiguration(tag)}` : '';
				const tagTotal = getTextRegexTagCount(document, tag);
				//超过界限值 出现icon 
				const iconLimit = tagLimit && tagTotal>getConfiguration(tag)  ? `$(arrow-circle-up)`: '';
				const message = tagTotal ? `${iconLimit} ${tag.replace(tag[0], tag[0].toUpperCase())}:${tagTotal} ${tagLimit}` : '';
				
				// 有对应的值 更新 没有注销  
				// 没有更新文字和隐藏item api 所以采用注销
				if(message){
					if(tag in statusBarObj){
						statusBarObj[tag].dispose();
					}
					statusBarObj[tag] = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
					statusBarObj[tag].text = message
					statusBarObj[tag].command = 'fileline.range'
					statusBarObj[tag].show()
				}else{
					statusBarObj[tag].dispose();
				}
			}
		}
	});

	context.subscriptions.push(disposable,statusBarEvent);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
