'use strict';

import * as path from 'path';

import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
	let serverModule = context.asAbsolutePath(path.join('server/src', 'server.js'));
	let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };

	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}

	let clientOptions: LanguageClientOptions = {
		documentSelector: ['coffeescript'],
        diagnosticCollectionName: 'coffeelint',
		synchronize: {
			configurationSection: 'coffeelinter',
			fileEvents: workspace.createFileSystemWatcher('**/coffeelint.json')
		}
	}

	let client = new LanguageClient('CoffeeLint Client', serverOptions, clientOptions);
	context.subscriptions.push(client.start());

	//let monitor = new SettingMonitor(client, 'coffeelinter').start();
}

export function deactivate() {
}
