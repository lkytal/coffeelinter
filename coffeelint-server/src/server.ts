'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentIdentifier,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

let coffeeLint = require('coffeelint');
let fs = require('fs');
let path = require('path');

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

let coffeeLintConfigFile: string;
let projectLintConfig = {};
let enabled = true;
let useWorkspace = false;

interface Settings {
	coffeelinter: CoffeeLintSettings;
}

interface CoffeeLintSettings {
	enable: boolean,
	defaultRules: object;
}

connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	enabled = settings.coffeelinter.enable;

	if (useWorkspace == false) {
		projectLintConfig = settings.coffeelinter.defaultRules;
	}

	documents.all().forEach(validateTextDocument);
});

function loadWorkspaceConfig() {
	try {
		let content = fs.readFileSync(coffeeLintConfigFile, 'utf-8').replace(new RegExp("//.*", "gi"), "");
		projectLintConfig = JSON.parse(content);
		useWorkspace = true;
	}
	catch (error) {
		useWorkspace = false;
		console.log("No locale lint config");
	}
}

connection.onDidChangeWatchedFiles((change) => {
	loadWorkspaceConfig();
	documents.all().forEach(validateTextDocument);
});

connection.onInitialize((params): InitializeResult => {
	coffeeLintConfigFile = path.join(params.rootPath, 'coffeelint.json');

	loadWorkspaceConfig();

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
	let issues = coffeeLint.lint(text, projectLintConfig);

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
		})
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.listen();
