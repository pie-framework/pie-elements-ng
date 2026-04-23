import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PieDocsContract } from './types.js';

export interface ContractValidationIssue {
  elementName: string;
  message: string;
}

export interface ContractValidationResult {
  issues: ContractValidationIssue[];
}

export const validateContracts = (
  contracts: Array<{ packageDir: string; contract: PieDocsContract }>
): ContractValidationResult => {
  const issues: ContractValidationIssue[] = [];
  const seenElementNames = new Set<string>();

  for (const entry of contracts) {
    const { contract, packageDir } = entry;
    if (seenElementNames.has(contract.elementName)) {
      issues.push({
        elementName: contract.elementName,
        message: `Duplicate elementName detected: ${contract.elementName}`,
      });
    } else {
      seenElementNames.add(contract.elementName);
    }

    if (!contract.views.length) {
      issues.push({
        elementName: contract.elementName,
        message: 'No views declared in contract',
      });
      continue;
    }

    for (const view of contract.views) {
      for (const pointer of [view.pie, view.config]) {
        const filePath = join(packageDir, pointer.file);
        if (!existsSync(filePath)) {
          issues.push({
            elementName: contract.elementName,
            message: `Missing source file for view "${view.view}": ${pointer.file}`,
          });
        }
      }
    }
  }

  return { issues };
};
