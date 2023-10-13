import * as path from "path";
import { ExtensionContext, workspace } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );
  // const debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      // options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "coffeescript" }],
    diagnosticCollectionName: "coffeelint",
    synchronize: {
      configurationSection: "coffeelinter",
      fileEvents: workspace.createFileSystemWatcher("**/coffeelint.json"),
    },
  };

  client = new LanguageClient(
    "lkytal.coffeelinter.language-client",
    "CoffeeLint Client",
    serverOptions,
    clientOptions
  );
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  console.log("CoffeeLint deactivate");
  if (!client) {
    return undefined;
  }
  return client.stop();
}
