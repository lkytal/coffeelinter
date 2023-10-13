# Coffee Lint for VSCode

<a href="https://marketplace.visualstudio.com/items?itemName=lkytal.coffeelinter"><img src="https://vsmarketplacebadges.dev/version/lkytal.coffeelinter.svg?style=flat-square" alt="Version"></a>
<a href="https://marketplace.visualstudio.com/items?itemName=lkytal.coffeelinter"><img src="https://vsmarketplacebadges.dev/installs/lkytal.coffeelinter.svg?style=flat-square" alt="Installs"></a>

> Install [Coffee Lint](https://marketplace.visualstudio.com/items?itemName=lkytal.coffeelinter) via VSCode market.

Linter for CoffeeScript, which integrates [CoffeeLint](http://www.coffeelint.org/) into VS Code.

If you are new to CoffeeLint check the documentation [here](http://coffeelint.org/).

## Extension Settings

This extension contributes the following settings:

- `coffeelinter.enable`: enable/disable coffeelint. Is enabled by default.

- `coffeelinter.defaultRules`: default rules for coffeelint. You can modify it or overwrite it by adding a coffeelint.json file in the root of your workspace.

## Source code structure

- Extension itself in ./client

- Language server in ./server

## My Other extensions

- ### [FlatUI](https://marketplace.visualstudio.com/items?itemName=lkytal.FlatUI)
- ### [Quick Task](https://marketplace.visualstudio.com/items?itemName=lkytal.quicktask)
- ### [Pomodoro](https://marketplace.visualstudio.com/items?itemName=lkytal.pomodoro)
- ### [Translator Plus](https://marketplace.visualstudio.com/items?itemName=lkytal.translatorplus)

## Acknowledgment

> Based on [coffeelint](https://marketplace.visualstudio.com/items?itemName=slb235.vscode-coffeelint)
>
> <div>Icons made by <a href="http://www.flaticon.com/authors/vectors-market" title="Vectors Market">Vectors Market</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

## Development

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to start compiling the client and server in [watch mode](https://code.visualstudio.com/docs/editor/tasks#:~:text=The%20first%20entry%20executes,the%20HelloWorld.js%20file.).
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Launch Client` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).
- In the [Extension Development Host](https://code.visualstudio.com/api/get-started/your-first-extension#:~:text=Then%2C%20inside%20the%20editor%2C%20press%20F5.%20This%20will%20compile%20and%20run%20the%20extension%20in%20a%20new%20Extension%20Development%20Host%20window.) instance of VSCode, open a document in 'coffeescript' language mode.
