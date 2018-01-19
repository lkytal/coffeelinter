'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as coffeeLint from 'coffeelint';
const { URL } = require('url');

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentIdentifier,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

let enabled = true;
let lintConfig = {};
let settingConfig = {};
let workspaceConfig = {};

interface Settings {
	coffeelinter: CoffeeLintSettings;
}

interface CoffeeLintSettings {
	enable: boolean,
	defaultRules: object;
}

function mergeConfig(_settingConfig, _workspaceConfig) {
	settingConfig = _settingConfig;
	workspaceConfig = _workspaceConfig;

	lintConfig = Object.assign({}, settingConfig);
	Object.assign(lintConfig, workspaceConfig);
}

connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	enabled = settings.coffeelinter.enable;

	mergeConfig(settings.coffeelinter.defaultRules, workspaceConfig);

	documents.all().forEach(validateTextDocument);
});

function loadWorkspaceConfig(coffeeLintConfigURI: string) {
	try {
		//console.log(coffeeLintConfigURI);

		let content = fs.readFileSync(coffeeLintConfigURI, 'utf-8').replace(new RegExp("//.*", "gi"), "");
		workspaceConfig = JSON.parse(content);
	}
	catch (error) {
		//workspaceConfig = {};
		console.log("No valide locale lint config");
	}

	mergeConfig(settingConfig, workspaceConfig);
}

connection.onDidChangeWatchedFiles((change) => {
	loadWorkspaceConfig(new URL(change.changes[0].uri));
	documents.all().forEach(validateTextDocument);
});

connection.onInitialize((params): InitializeResult => {
	let sourcePath = params.rootPath || "";
	let coffeeLintConfigFile = path.join(sourcePath, 'coffeelint.json');

	loadWorkspaceConfig(coffeeLintConfigFile);

	return {
		capabilities: {
			textDocumentSync: documents.syncKind
		}
	}
});

documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];

	if (!enabled) {
		return connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}

	let text = textDocument.getText();
	let issues = coffeeLint.lint(text, lintConfig);

	for (let issue of issues) {
		let severity;

		if (issue.level === "warning" || issue.level === "warn") {
			severity = DiagnosticSeverity.Warning;
		}
		else if (issue.level === "error") {
			severity = DiagnosticSeverity.Error;
		}
		else if (issue.level === "hint") {
			severity = DiagnosticSeverity.Hint;
		}
		else {
			severity = DiagnosticSeverity.Information;
		}

		diagnostics.push({
			severity: severity,
			range: {
				start: { line: issue.lineNumber - 1, character: 0 },
				end: { line: issue.lineNumber - 1, character: Number.MAX_VALUE } // end of line
			},
			source: "CoffeeLint",
			message: issue.message
		});
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.listen();
