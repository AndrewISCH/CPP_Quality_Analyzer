import { DiagnosticLevel } from '../core/rules-builder/types';
import * as vscode from 'vscode';

export const EXTENSION_IDENTIFIER = 'cpp-quality-analyzer';
export const CONFIG_FILENAME = '.cppquality.json';
export const SUPPORTED_LANGUAGE_IDS = ['cpp'];
export const TRIGGER_ON_TYPE_DELAY_IN_MS = 500;

export const SEVERITY_LEVEL_MAPPING: Record<
  DiagnosticLevel,
  vscode.DiagnosticSeverity
> = {
  error: vscode.DiagnosticSeverity.Error,
  warn: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
};
