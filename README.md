# FileLine
**Read this in other languages: [English](README.md), [中文](README_zh.md).**

The status bar at the bottom of FileLine - vscode displays the statistics on the number of lines in the current file.

Run: Press ctrl+shift+p and enter fileline to start the file. You can view the statistics of the current fileline in the bottom bar.

Features:
1. Basic statistics
Vue files: Displays the total number of lines in the Vue file (labeled "count") in the status bar, as well as separate statistical totals for the "template", "script", and "style" modules. Statistics for each module are displayed only as long as it exists.
Other file types: For non-Vue files, only the total number of lines (marked "count") is displayed by default.
2. Limit value display
Configure boundary values: Users can customize the boundary values through the VS Code Settings interface (the path is Settings -> Extension -> Fileline). This function depends on whether the Vscode Plugin File Line: Alimit configuration item is enabled. When the configuration is enabled and the actual number of lines in the file and module exceeds the set limit value, it is alerted in the status bar by ICONS (such as arrow ICONS) and highlighted colors.
3. Click block to jump
Quick navigation: In the Vue file, the status bar will provide shortcuts to the "template", "script", and "style" modules. Click on these entries to quickly jump to the starting position of the corresponding module in the editor.

