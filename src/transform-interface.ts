/**
 * Microsoft has been building the compiler API doc. Maybe this
 * will be soon not needed.
 * https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md
 */

import * as fs from "fs";
import * as ts from "typescript";

// const fullFilePath = "test-files/multiple-interface.ts";
const fullFilePath = "test-files/test-file.ts";

const sourceText = fs.readFileSync(fullFilePath).toString();
const sourceFile = ts.createSourceFile(
  fullFilePath,
  sourceText,
  ts.ScriptTarget.ES2016,
  false
);

/**
 * Reverse properties within all interfaces.
 */
const interfaceTransformer =
  <T extends ts.Node>(context: ts.TransformationContext) =>
  (rootNode: T) => {
    const visitFn = (node: ts.Node): ts.Node => {
      switch (node.kind) {
        case ts.SyntaxKind.InterfaceDeclaration:
          const i = node as ts.InterfaceDeclaration;
          const members = i.members; // Each member is PropertySignature

          if (members.length > 1) {
            console.log(members);
            const transformedMembers = members
              .map((m) => {
                console.log("Visiting " + ts.SyntaxKind[m.kind]);
                if (m.kind === ts.SyntaxKind.PropertySignature) {
                  const p = m as ts.PropertySignature;
                  const newP = ts.factory.createPropertySignature(
                    p.modifiers,
                    p.name,
                    p.questionToken,
                    p.type
                  );
                  console.log(newP);
                  return newP;
                }

                return m;
              })
              // Key to the whole demo
              .reverse();

            return ts.factory.createInterfaceDeclaration(
              i.decorators,
              i.modifiers,
              i.name,
              i.typeParameters,
              i.heritageClauses,
              transformedMembers
            );
          }
        default:
          return ts.visitEachChild(node, visitFn, context);
      }
    };

    return ts.visitNode(rootNode, visitFn);
  };

const resultSourceFile = ts.transform(sourceFile, [interfaceTransformer]);

const transformedSourceFile = resultSourceFile.transformed[0] as ts.SourceFile;

const printer: ts.Printer = ts.createPrinter(
  {
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  },
  {
    substituteNode(hint, node) {
      // perform substitution if necessary...
      console.log("Visiting " + ts.SyntaxKind[node.kind]);
      return node;
    },
  }
);

// Without the printer, `transformedSourceFile.text` will be showing old text
const newFilePrinted = printer.printNode(
  ts.EmitHint.SourceFile,
  transformedSourceFile,
  sourceFile
);
// console.log(transformedSourceFile.text);

fs.writeFileSync(fullFilePath, newFilePrinted);
