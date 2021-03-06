"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import CompletionProvider from "./completion-item-provider";
import { StylusDocumentSimbolsProvider } from "./symbols-provider";
import { activateColorDecorations } from "./color-decorators";

const DOCUMENT_SELECTOR = {
  language: "stylus",
  scheme: "file",
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const editorConfig = vscode.workspace.getConfiguration("editor");
  const config = vscode.workspace.getConfiguration("languageStylus");
  const varsFilePath: string = config.get("variablesFilePath");

  const completionItemProvider = new CompletionProvider();

  var filePath = path.join(vscode.workspace.rootPath, varsFilePath);

  if (varsFilePath) {
    if (fs.existsSync(filePath)) {
      var content = fs.readFileSync(filePath).toString();
      completionItemProvider.updateVariables(content);
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.uri.fsPath !== filePath) return;
        completionItemProvider.updateVariables(event.document.getText());
      });
    } else {
      vscode.window.showErrorMessage("cannot find the file at " + filePath);
    }
  }

  const completionProviderDisposable = vscode.languages.registerCompletionItemProvider(
    DOCUMENT_SELECTOR,
    completionItemProvider,
    "\\.",
    "$",
    "-",
    "&",
    "@",
    "["
  );
  context.subscriptions.push(completionProviderDisposable);

  vscode.languages.setLanguageConfiguration("stylus", {
    wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g,
    onEnterRules: [
      // Indent after .class_name, #id, @media, [attr=sddsf]
      {
        beforeText: /^([\s\/]?)+[\.#&@\[:].+[^,]$/gi,
        action: { indentAction: vscode.IndentAction.Indent },
      },
      // Indent after &
      {
        beforeText: /\s&(.*)[^,]$|&$/gi,
        action: { indentAction: vscode.IndentAction.Indent },
      },
      // Indent after keyfames e.g. 10%
      {
        beforeText: /^(\s?)+\d{1,3}%/gi,
        action: { indentAction: vscode.IndentAction.Indent },
      },
      // Indent after keyfames e.g. 10%
      {
        beforeText: /^(\s?)+for.+in.+$/gi,
        action: { indentAction: vscode.IndentAction.Indent },
      },
    ],
  });

  const symbolsProvider = new StylusDocumentSimbolsProvider();
  const symbolsProviderDisposable = vscode.languages.registerDocumentSymbolProvider(
    DOCUMENT_SELECTOR,
    symbolsProvider
  );
  context.subscriptions.push(symbolsProviderDisposable);

  if (editorConfig.get("colorDecorators")) {
    context.subscriptions.push(activateColorDecorations());
  }
}
