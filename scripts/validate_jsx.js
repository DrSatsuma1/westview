#!/usr/bin/env node
/**
 * JSX Structure Validator - Production Version
 * 
 * Uses acorn-jsx for reliable parsing (same approach as ESLint, Babel)
 * Handles all edge cases: comments, strings, complex nesting, fragments
 * 
 * Architecture:
 * - Parser: acorn-jsx converts JSX to AST
 * - Validators: Walk AST checking structure
 * - Reporter: Format errors with context
 */

const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const walk = require('acorn-walk');

// Extend acorn with JSX support
const parser = acorn.Parser.extend(jsx());

class JSXValidator {
  constructor(filepath, content) {
    this.filepath = filepath;
    this.content = content;
    this.lines = content.split('\n');
    this.errors = [];
    this.warnings = [];
    this.ast = null;
  }

  /**
   * Main validation entry point
   * Returns: { valid: boolean, errors: [], warnings: [] }
   */
  validate() {
    try {
      // Parse JSX to AST
      this.ast = parser.parse(this.content, {
        sourceType: 'module',
        ecmaVersion: 'latest',
        locations: true
      });

      // Run validation passes
      this.validateJSXStructure();
      this.checkCommonMistakes();

      return {
        valid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings
      };
    } catch (e) {
      // Parse error means invalid JSX
      this.errors.push({
        line: e.loc ? e.loc.line : 'unknown',
        column: e.loc ? e.loc.column : 'unknown',
        message: `Parse error: ${e.message}`,
        code: this.getLineContext(e.loc ? e.loc.line : 1)
      });

      return {
        valid: false,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * Validate JSX structure by walking AST
   */
  validateJSXStructure() {
    const jsxElements = [];
    
    // Manual tree walk since acorn-walk doesn't have JSX handlers
    const walkNode = (node) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'JSXElement') {
        // Check for mismatched tags
        const openName = getJSXName(node.openingElement.name);
        const closeName = node.closingElement ? getJSXName(node.closingElement.name) : null;

        if (closeName && openName !== closeName) {
          jsxElements.push({
            type: 'mismatch',
            openName,
            closeName,
            line: node.loc.start.line,
            openLine: node.openingElement.loc.start.line,
            closeLine: node.closingElement.loc.start.line
          });
        }

        // Check self-closing requirements for void elements
        if (node.openingElement.selfClosing) {
          const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
          if (!voidElements.includes(openName)) {
            jsxElements.push({
              type: 'unnecessary-self-close',
              name: openName,
              line: node.loc.start.line
            });
          }
        }
      }

      // Recursively walk all properties
      for (const key in node) {
        if (key === 'loc' || key === 'range') continue;
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(walkNode);
        } else if (value && typeof value === 'object') {
          walkNode(value);
        }
      }
    };

    walkNode(this.ast);

    // Convert findings to errors/warnings
    jsxElements.forEach(item => {
      if (item.type === 'mismatch') {
        this.errors.push({
          line: item.closeLine,
          message: `Mismatched tags: opening <${item.openName}> at line ${item.openLine}, closing </${item.closeName}> at line ${item.closeLine}`,
          code: this.getLineContext(item.closeLine)
        });
      } else if (item.type === 'unnecessary-self-close') {
        this.warnings.push({
          line: item.line,
          message: `Element <${item.name}> doesn't need to be self-closing`,
          code: this.getLineContext(item.line)
        });
      }
    });
  }

  /**
   * Check for common React/JSX mistakes
   */
  checkCommonMistakes() {
    // Manual tree walk for JSX attributes
    const walkNode = (node) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'JSXAttribute' && node.name) {
        const attrName = node.name.name;

        // Check for 'class' instead of 'className'
        if (attrName === 'class') {
          this.warnings.push({
            line: node.loc.start.line,
            message: `Use 'className' instead of 'class' in JSX`,
            code: this.getLineContext(node.loc.start.line)
          });
        }

        // Check for 'for' instead of 'htmlFor'
        if (attrName === 'for') {
          this.warnings.push({
            line: node.loc.start.line,
            message: `Use 'htmlFor' instead of 'for' in JSX`,
            code: this.getLineContext(node.loc.start.line)
          });
        }
      }

      // Recursively walk all properties
      for (const key in node) {
        if (key === 'loc' || key === 'range') continue;
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(walkNode);
        } else if (value && typeof value === 'object') {
          walkNode(value);
        }
      }
    };

    walkNode(this.ast);
  }

  /**
   * Get line context for error reporting
   */
  getLineContext(lineNum) {
    if (lineNum < 1 || lineNum > this.lines.length) return '';
    return this.lines[lineNum - 1].trim();
  }
}

/**
 * Get JSX element name from AST node
 */
function getJSXName(node) {
  if (node.type === 'JSXIdentifier') {
    return node.name;
  } else if (node.type === 'JSXMemberExpression') {
    return getJSXName(node.object) + '.' + getJSXName(node.property);
  } else if (node.type === 'JSXNamespacedName') {
    return node.namespace.name + ':' + node.name.name;
  }
  return '';
}

/**
 * Count approximate lines changed between two versions
 */
function countLinesChanged(oldContent, newContent) {
  const oldLines = new Set(oldContent.split('\n'));
  const newLines = new Set(newContent.split('\n'));

  const added = [...newLines].filter(line => !oldLines.has(line));
  const removed = [...oldLines].filter(line => !newLines.has(line));

  return added.length + removed.length;
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: validate_jsx.js <filepath> [max_lines_changed] [original_filepath]');
    process.exit(1);
  }

  const filepath = args[0];
  const maxLines = args[1] ? parseInt(args[1]) : null;
  const originalPath = args[2] || null;

  // Read file
  let content;
  try {
    content = fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    console.log(`❌ Error: Cannot read file: ${filepath}`);
    console.log(`   ${e.message}`);
    process.exit(1);
  }

  // Check line count if original provided (guideline, not enforced)
  if (maxLines && originalPath) {
    try {
      const originalContent = fs.readFileSync(originalPath, 'utf8');
      const linesChanged = countLinesChanged(originalContent, content);

      if (linesChanged > maxLines) {
        console.log(`⚠️  Lines changed: ${linesChanged} exceeds guideline of ${maxLines}`);
        console.log(`   Consider: Is this truly one atomic change?`);
        console.log(`   If multiple concerns, consider splitting.`);
        // Note: This is a warning, not an error - atomic changes can be >30 lines
      } else {
        console.log(`✓ Lines changed: ${linesChanged} (within guideline of ${maxLines})`);
      }
    } catch (e) {
      console.log(`⚠️  Could not read original file: ${e.message}`);
    }
  }

  // Validate JSX structure
  const validator = new JSXValidator(filepath, content);
  const result = validator.validate();

  // Report results
  if (result.errors.length > 0) {
    console.log(`❌ JSX Validation Errors in ${filepath}:`);
    result.errors.forEach(error => {
      console.log(`   • Line ${error.line}: ${error.message}`);
      if (error.code) {
        console.log(`     ${error.code}`);
      }
    });
  }

  if (result.warnings.length > 0) {
    console.log(`⚠️  JSX Warnings in ${filepath}:`);
    result.warnings.forEach(warning => {
      console.log(`   • Line ${warning.line}: ${warning.message}`);
      if (warning.code) {
        console.log(`     ${warning.code}`);
      }
    });
  }

  if (result.valid && result.errors.length === 0) {
    console.log(`✅ JSX structure valid in ${filepath}`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { JSXValidator, parser };
