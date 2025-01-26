# FileLine
**其他语言版本: [English](README.md), [中文](README_zh.md).**

FileLine - vscode底部状态栏展示当前文件行数统计情况；
运行：使用 ctrl+shift+p , 输入 fileline 启动 , 可在底部栏查看当前文件行数统计情况;

功能：
1. 基础统计
Vue 文件：在状态栏中展示 Vue 文件的总行数（标记为 "count"），以及针对 "template", "script", 和 "style" 模块的单独统计总数。每个模块的统计数据仅在其存在时显示。
其他文件类型：对于非 Vue 文件，默认情况下仅展示总行数（标记为 "count"）。
2. 界限值展示
配置界限值：用户可以通过 VS Code 的设置界面进行自定义界限值的设定（路径为 设置 -> 扩展 -> Fileline）。此功能依赖于是否启用了 Vscode Plugin File Line: Alimit 配置项。当启用该配置且文件并且模块的实际行数超过设定的界限值时，会在状态栏中通过图标（例如箭头图标）及高亮颜色提醒。
3. 点击块跳转
快速导航：在 Vue 文件中，状态栏将提供 "template", "script", 和 "style" 模块的快捷操作入口。点击这些条目可以迅速跳转到对应模块在编辑器中的起始位置。