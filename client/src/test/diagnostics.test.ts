/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import * as assert from "assert";
import { getDocUri, activate } from "./helper";

suite("Should get diagnostics", () => {
  const docUri = getDocUri("linkMix.user.coffee");

  test("Diagnoses coffeescript issues", async () => {
    await testDiagnostics(docUri, [
      {
        message: "Backticks are forbidden",
        range: toRange(0, 0, 0, Number.MAX_VALUE),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "ex",
      },
      {
        message: "Line exceeds maximum allowed length",
        range: toRange(56, 0, 56, Number.MAX_VALUE),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "ex",
      },
      {
        message: "Line exceeds maximum allowed length",
        range: toRange(57, 0, 57, Number.MAX_VALUE),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "ex",
      },
      {
        message: "Line exceeds maximum allowed length",
        range: toRange(64, 0, 64, Number.MAX_VALUE),
        severity: vscode.DiagnosticSeverity.Warning,
        source: "ex",
      },
    ]);
  });
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function testDiagnostics(
  docUri: vscode.Uri,
  expectedDiagnostics: vscode.Diagnostic[]
) {
  await activate(docUri);

  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}
