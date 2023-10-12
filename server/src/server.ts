"use strict";

import * as coffeeLint from "coffeelint";
import configFinder from "coffeelint/lib/configfinder";
// import * as fs from "fs";
// import * as path from "path";
// import { URL } from "url";

import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,

  // ProposedFeatures,
  // InitializeParams,
  // DidChangeConfigurationNotification,

  // CompletionItem,
  // CompletionItemKind,

  // TextDocumentPositionParams,
  // TextDocumentSyncKind,
  InitializeResult,

  // IConnection,
  // IPCMessageReader,
  // IPCMessageWriter,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  DidChangeConfigurationNotification,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

const connection = createConnection(ProposedFeatures.all);
// const connection = createConnection(
//   new IPCMessageReader(process),
//   new IPCMessageWriter(process)
// );

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Pretty sure we can't support completion...
      // completionProvider: {
      //   resolveProvider: true,
      // },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  // We could read and cache the .coffeelint.json for each workspace
  // and update that cache automatically on workspace folder change...
  //
  // if (hasWorkspaceFolderCapability) {
  //   connection.workspace.onDidChangeWorkspaceFolders((_event) => {
  //     connection.console.log("Workspace folder change event received.");
  //     // TODO need to load see if we should load a different coffee config from the new folder?
  //   });
  // }
});

// The example settings
interface CoffeeLintSettings {
  enable: boolean;
  defaultRules: object;
}
const defaultSettings: CoffeeLintSettings = {
  enable: true,
  defaultRules: {
    arrow_spacing: {
      level: "warn",
    },
    braces_spacing: {
      level: "warn",
      spaces: 1,
      empty_object_spaces: 0,
    },
    camel_case_classes: {
      level: "warn",
    },
    coffeescript_error: {
      level: "error",
    },
    colon_assignment_spacing: {
      level: "warn",
      spacing: {
        left: 0,
        right: 1,
      },
    },
    cyclomatic_complexity: {
      level: "warn",
      value: 15,
    },
    duplicate_key: {
      level: "error",
    },
    empty_constructor_needs_parens: {
      level: "ignore",
    },
    ensure_comprehensions: {
      level: "warn",
    },
    eol_last: {
      level: "ignore",
    },
    indentation: {
      value: 2,
      level: "ignore",
    },
    line_endings: {
      level: "ignore",
      value: "unix",
    },
    max_line_length: {
      value: 100,
      level: "warn",
      limitComments: true,
    },
    missing_fat_arrows: {
      level: "ignore",
      is_strict: false,
    },
    newlines_after_classes: {
      value: 3,
      level: "ignore",
    },
    no_backticks: {
      level: "warn",
    },
    no_debugger: {
      level: "warn",
      console: false,
    },
    no_empty_functions: {
      level: "ignore",
    },
    no_empty_param_list: {
      level: "ignore",
    },
    no_implicit_braces: {
      level: "warn",
      strict: true,
    },
    no_implicit_parens: {
      level: "ignore",
      strict: true,
    },
    no_interpolation_in_single_quotes: {
      level: "ignore",
    },
    no_nested_string_interpolation: {
      level: "warn",
    },
    no_plusplus: {
      level: "ignore",
    },
    no_private_function_fat_arrows: {
      level: "warn",
    },
    no_stand_alone_at: {
      level: "ignore",
    },
    no_tabs: {
      level: "ignore",
    },
    no_this: {
      level: "ignore",
    },
    no_throwing_strings: {
      level: "error",
    },
    no_trailing_semicolons: {
      level: "error",
    },
    no_trailing_whitespace: {
      level: "warn",
      allowed_in_comments: false,
      allowed_in_empty_lines: true,
    },
    no_unnecessary_double_quotes: {
      level: "ignore",
    },
    no_unnecessary_fat_arrows: {
      level: "warn",
    },
    non_empty_constructor_needs_parens: {
      level: "ignore",
    },
    prefer_english_operator: {
      level: "ignore",
      doubleNotLevel: "ignore",
    },
    space_operators: {
      level: "warn",
    },
    spacing_after_comma: {
      level: "warn",
    },
    transform_messes_up_line_numbers: {
      level: "warn",
    },
  },
};
let globalSettings: CoffeeLintSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<CoffeeLintSettings>> = new Map();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <CoffeeLintSettings>(
      (change.settings.coffeelinter || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

async function getDocumentSettings(
  resource: string
): Promise<CoffeeLintSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }

  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "coffeelinter",
    });
    result.then((settings) => {
      if (!hasWorkspaceFolderCapability) {
        // FIXME need to merge in the coffeelint.json
        // but how can we call getWorkspaceFolder(resource) to know our base path?
        // it doesn't exist on connection.workspace
        // const sourcePath = connection.workspace.getWorkspaceFolder(resource);
        // let coffeeLintConfigFile = path.join(sourcePath, 'coffeelint.json');
        // loadWorkspaceConfig(coffeeLintConfigFile);
      } else {
        // FIXME how to get root path?
        // merge coffeelint.json from root path
        // let sourcePath = resource.rootUri || "";
        // let coffeeLintConfigFile = path.join(sourcePath, 'coffeelint.json');
        // loadWorkspaceConfig(coffeeLintConfigFile);
      }
      return settings;
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// let enabled = true;
let lintConfig = {};
let settingConfig = {};
let workspaceConfig = {};

function mergeConfig(paramSettingConfig: object, paramWorkspaceConfig: object) {
  settingConfig = paramSettingConfig;
  workspaceConfig = paramWorkspaceConfig;

  lintConfig = Object.assign({}, settingConfig);
  Object.assign(lintConfig, workspaceConfig);
}

function loadWorkspaceConfig(coffeeLintConfigURI: string) {
  try {
    workspaceConfig = configFinder.getConfig(coffeeLintConfigURI);
  } catch (error) {
    console.log("No valid local lint config");
  }

  mergeConfig(settingConfig, workspaceConfig);
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const diagnostics: Diagnostic[] = [];
  const settings = await getDocumentSettings(textDocument.uri);

  console.log("CoffeeLint settings for " + textDocument.uri, settings);
  if (!settings.enable) {
    return connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }

  const text = textDocument.getText();
  const literate =
    textDocument.uri.slice(textDocument.uri.length - 10) == ".litcoffee";
  const issues = coffeeLint.lint(text, lintConfig, literate);

  for (const issue of issues) {
    let severity;

    if (issue.level === "warning" || issue.level === "warn") {
      severity = DiagnosticSeverity.Warning;
    } else if (issue.level === "error") {
      severity = DiagnosticSeverity.Error;
    } else if (issue.level === "hint") {
      severity = DiagnosticSeverity.Hint;
    } else {
      severity = DiagnosticSeverity.Information;
    }

    const diagnostic: Diagnostic = {
      severity: severity,
      range: {
        start: { line: issue.lineNumber - 1, character: 0 },
        end: { line: issue.lineNumber - 1, character: Number.MAX_VALUE }, // end of line
      },
      source: "CoffeeLint",
      message: issue.message,
    };
    // if (hasDiagnosticRelatedInformationCapability) {
    //   diagnostic.relatedInformation = [
    //     {
    //       location: {
    //         uri: textDocument.uri,
    //         range: Object.assign({}, diagnostic.range),
    //       },
    //       message: ... not sure we have any additional info... ,
    //     },
    //   ];
    // }
    diagnostics.push(diagnostic);
  }

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// connection.onDidChangeWatchedFiles(_change => {
// 	// Monitored files have change in VSCode
// 	connection.console.log('We received an file change event');
// });

// // This handler provides the initial list of the completion items.
// connection.onCompletion(
// 	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
// 		// The pass parameter contains the position of the text document in
// 		// which code complete got requested. For the example we ignore this
// 		// info and always provide the same completion items.
// 		return [
// 			{
// 				label: 'TypeScript',
// 				kind: CompletionItemKind.Text,
// 				data: 1
// 			},
// 			{
// 				label: 'JavaScript',
// 				kind: CompletionItemKind.Text,
// 				data: 2
// 			}
// 		];
// 	}
// );

// // This handler resolves additional information for the item selected in
// // the completion list.
// connection.onCompletionResolve(
// 	(item: CompletionItem): CompletionItem => {
// 		if (item.data === 1) {
// 			item.detail = 'TypeScript details';
// 			item.documentation = 'TypeScript documentation';
// 		} else if (item.data === 2) {
// 			item.detail = 'JavaScript details';
// 			item.documentation = 'JavaScript documentation';
// 		}
// 		return item;
// 	}
// );

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
