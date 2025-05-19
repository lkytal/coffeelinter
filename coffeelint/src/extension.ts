'use strict';

import * as path from 'path';

import { Disposable, ExtensionContext, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

export function activate(context: ExtensionContext) {
	let serverModule = context.asAbsolutePath(path.join('server/src', 'server.js'));
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6004"] };

	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: ['coffeescript'],
		diagnosticCollectionName: 'coffeelint',
		synchronize: {
			configurationSection: 'coffeelinter',
			fileEvents: workspace.createFileSystemWatcher('**/coffeelint.json')
		}
	};

	let client = new LanguageClient('CoffeeLint Client', serverOptions, clientOptions);
	client.start();
	context.subscriptions.push(client);
}

export function deactivate() {
	console.log("CoffeeLint deactivate");
}
