import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PIE Elements NG - Evaluation Test Runner for React Elements
 *
 * This test runner discovers and executes YAML-based evaluation specs
 * for PIE elements. It provides comprehensive testing across 10 dimensions:
 * rendering, interactions, accessibility, state, scoring, browser compat,
 * performance, configuration, error handling, and testing.
 *
 * Architecture:
 * 1. Discovery: Recursively finds evals.yaml files
 * 2. Parsing: Loads and validates YAML specs
 * 3. Generation: Creates Playwright test cases dynamically
 * 4. Execution: Runs actions and assertions
 * 5. Reporting: Captures screenshots on failure, generates reports
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface EvalSpec {
  version: number;
  component: {
    element: string;
    framework: 'svelte' | 'react';
    tagName?: string;
  };
  examplesApp: {
    app: string;
    routeTemplate: string;
  };
  evals: Evaluation[];
}

interface Evaluation {
  id: string;
  sampleId?: string;
  severity: 'error' | 'warn';
  gradeBand?: string;
  subject?: string;
  intent: string;
  notes?: string[];
  steps: Action[];
  expected?: {
    session?: Record<string, Matcher>;
    outcome?: Record<string, Matcher>;
  };
  spiritChecks?: string[];
}

interface Action {
  action: string;
  [key: string]: unknown;
}

interface Matcher {
  equals?: unknown;
  contains?: string | number;
  exists?: boolean;
  greaterThan?: number;
  lessThan?: number;
  greaterThanOrEqual?: number;
  lessThanOrEqual?: number;
  matches?: string;
}

// ============================================================================
// YAML Discovery
// ============================================================================

function findEvalFiles(dir: string): string[] {
  const evalFiles: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name === 'evals.yaml') {
        evalFiles.push(fullPath);
      }
    }
  }

  if (fs.existsSync(dir)) {
    traverse(dir);
  }

  return evalFiles;
}

// ============================================================================
// YAML Parsing
// ============================================================================

function loadEvalSpec(filePath: string): EvalSpec {
  const content = fs.readFileSync(filePath, 'utf-8');
  const spec = yaml.load(content) as EvalSpec;

  // Basic validation
  if (spec.version !== 1) {
    throw new Error(`Unsupported eval spec version: ${spec.version}`);
  }

  return spec;
}

// ============================================================================
// Action Interpreter
// ============================================================================

class ActionInterpreter {
  constructor(private page: Page) {}

  async execute(action: Action): Promise<void> {
    switch (action.action) {
      case 'navigate':
        await this.navigate(action);
        break;
      case 'click':
        await this.click(action);
        break;
      case 'type':
        await this.type(action);
        break;
      case 'select':
        await this.select(action);
        break;
      case 'observe':
        await this.observe(action);
        break;
      case 'wait':
        await this.wait(action);
        break;
      case 'axe':
        await this.axe(action);
        break;
      case 'dispatchEvent':
        await this.dispatchEvent(action);
        break;
      case 'clickAt':
        await this.clickAt(action);
        break;
      case 'dragSlider':
        await this.dragSlider(action);
        break;
      case 'uploadFile':
        await this.uploadFile(action);
        break;
      case 'playMedia':
        await this.playMedia(action);
        break;
      case 'screenshot':
        await this.screenshot(action);
        break;
      case 'compareScreenshot':
        await this.compareScreenshot(action);
        break;
      case 'checkStyle':
        await this.checkStyle(action);
        break;
      case 'checkLayout':
        await this.checkLayout(action);
        break;
      case 'checkColorContrast':
        await this.checkColorContrast(action);
        break;
      case 'checkFont':
        await this.checkFont(action);
        break;
      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }

  private async navigate(action: Action): Promise<void> {
    const { path: routePath, params } = action as {
      path: string;
      params?: Record<string, string>;
    };

    let url = `http://localhost:5174${routePath}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  private async click(action: Action): Promise<void> {
    const { target } = action as { target: { description: string; hint: string } };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible', timeout: 10000 });
    await element.click();
  }

  private async type(action: Action): Promise<void> {
    const { target, text } = action as {
      target: { description: string; hint: string };
      text: string;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });
    await element.fill(text);
  }

  private async select(action: Action): Promise<void> {
    const { target, value } = action as {
      target: { description: string; hint: string };
      value: string;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });
    await element.selectOption(value);
  }

  private async observe(action: Action): Promise<void> {
    const { target, expected } = action as {
      target: { description: string; hint: string };
      expected?: Matcher;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible', timeout: 10000 });

    if (expected) {
      await this.applyMatchers(element, expected);
    }
  }

  private async wait(action: Action): Promise<void> {
    const { condition, timeout } = action as {
      condition?: 'load' | 'domcontentloaded' | 'networkidle';
      timeout?: number;
    };

    if (condition) {
      await this.page.waitForLoadState(condition, { timeout });
    } else if (timeout) {
      await this.page.waitForTimeout(timeout);
    }
  }

  private async axe(action: Action): Promise<void> {
    const { expected } = action as {
      expected?: {
        maxViolations?: number;
        wcagLevel?: 'A' | 'AA' | 'AAA';
      };
    };

    const axeBuilder = new AxeBuilder({ page: this.page });

    if (expected?.wcagLevel) {
      const tags = [`wcag2${expected.wcagLevel.toLowerCase()}`];
      axeBuilder.withTags(tags);
    }

    const results = await axeBuilder.analyze();

    const maxViolations = expected?.maxViolations ?? 0;
    const actualViolations = results.violations.length;

    if (actualViolations > maxViolations) {
      const violationSummary = results.violations
        .map((v) => `- ${v.id}: ${v.description} (${v.nodes.length} instances)`)
        .join('\n');

      throw new Error(
        `Accessibility violations found: ${actualViolations} (max: ${maxViolations})\n${violationSummary}`
      );
    }
  }

  private async dispatchEvent(action: Action): Promise<void> {
    const { target, eventName, detail } = action as {
      target: { description: string; hint: string };
      eventName: string;
      detail?: Record<string, unknown>;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'attached' });

    await element.evaluate(
      (el, { name, eventDetail }) => {
        const event = new CustomEvent(name, { detail: eventDetail, bubbles: true });
        el.dispatchEvent(event);
      },
      { name: eventName, eventDetail: detail }
    );
  }

  private async clickAt(action: Action): Promise<void> {
    const { target, coordinates } = action as {
      target: { description: string; hint: string };
      coordinates: { x: number; y: number };
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    const box = await element.boundingBox();
    if (!box) {
      throw new Error(`Element not found or not visible: ${target.description}`);
    }

    await this.page.mouse.click(box.x + coordinates.x, box.y + coordinates.y);
  }

  private async dragSlider(action: Action): Promise<void> {
    const { target, value } = action as {
      target: { description: string; hint: string };
      value: number;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    // Set slider value using fill (works for range inputs)
    await element.fill(value.toString());
  }

  private async uploadFile(action: Action): Promise<void> {
    const { target, filePath } = action as {
      target: { description: string; hint: string };
      filePath: string;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'attached' });

    // Resolve file path relative to test file
    const absolutePath = path.resolve(path.dirname(__filename), filePath);
    await element.setInputFiles(absolutePath);
  }

  private async playMedia(action: Action): Promise<void> {
    const { target, command, seekTime } = action as {
      target: { description: string; hint: string };
      command: 'play' | 'pause' | 'seekTo';
      seekTime?: number;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    await element.evaluate(
      (el, { cmd, time }) => {
        const mediaEl = el as HTMLMediaElement;
        if (cmd === 'play') {
          mediaEl.play();
        } else if (cmd === 'pause') {
          mediaEl.pause();
        } else if (cmd === 'seekTo' && time !== undefined) {
          mediaEl.currentTime = time;
        }
      },
      { cmd: command, time: seekTime }
    );
  }

  private async screenshot(action: Action): Promise<void> {
    const { target, name, fullPage } = action as {
      target?: { description: string; hint: string };
      name: string;
      fullPage?: boolean;
    };

    const screenshotDir = path.join(__dirname, '__screenshots__');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, `${name}.png`);

    if (target) {
      const element = this.page.locator(target.hint).first();
      await element.waitFor({ state: 'visible' });
      await element.screenshot({ path: screenshotPath });
    } else {
      await this.page.screenshot({ path: screenshotPath, fullPage: fullPage ?? false });
    }
  }

  private async compareScreenshot(action: Action): Promise<void> {
    const { target, name, threshold } = action as {
      target?: { description: string; hint: string };
      name: string;
      threshold?: number;
    };

    const maxDiffPixelRatio = threshold ?? 0.1;

    if (target) {
      const element = this.page.locator(target.hint).first();
      await element.waitFor({ state: 'visible' });
      await expect(element).toHaveScreenshot(`${name}.png`, { maxDiffPixelRatio });
    } else {
      await expect(this.page).toHaveScreenshot(`${name}.png`, { maxDiffPixelRatio });
    }
  }

  private async checkStyle(action: Action): Promise<void> {
    const { target, property, expected } = action as {
      target: { description: string; hint: string };
      property: string;
      expected: Matcher;
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    const value = await element.evaluate((el, prop) => {
      const computed = window.getComputedStyle(el);
      return computed.getPropertyValue(prop);
    }, property);

    // Parse numeric values (e.g., "44px" -> 44)
    const numericValue = Number.parseFloat(value);

    if ('equals' in expected) {
      if (typeof expected.equals === 'number') {
        expect(numericValue).toBe(expected.equals);
      } else {
        expect(value).toBe(expected.equals);
      }
    }

    if ('contains' in expected) {
      expect(value).toContain(expected.contains.toString());
    }

    if ('greaterThan' in expected && expected.greaterThan !== undefined) {
      expect(numericValue).toBeGreaterThan(expected.greaterThan);
    }

    if ('lessThan' in expected && expected.lessThan !== undefined) {
      expect(numericValue).toBeLessThan(expected.lessThan);
    }

    if ('greaterThanOrEqual' in expected && expected.greaterThanOrEqual !== undefined) {
      expect(numericValue).toBeGreaterThanOrEqual(expected.greaterThanOrEqual);
    }

    if ('lessThanOrEqual' in expected && expected.lessThanOrEqual !== undefined) {
      expect(numericValue).toBeLessThanOrEqual(expected.lessThanOrEqual);
    }

    if ('matches' in expected && expected.matches) {
      expect(value).toMatch(new RegExp(expected.matches));
    }
  }

  private async checkLayout(action: Action): Promise<void> {
    const { target, expected } = action as {
      target: { description: string; hint: string };
      expected: {
        boundingBox?: {
          minWidth?: number;
          maxWidth?: number;
          minHeight?: number;
          maxHeight?: number;
        };
        spacing?: {
          margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
          padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
        };
      };
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    if (expected.boundingBox) {
      const box = await element.boundingBox();
      if (!box) {
        throw new Error(`Element not visible: ${target.description}`);
      }

      if (expected.boundingBox.minWidth !== undefined) {
        expect(box.width).toBeGreaterThanOrEqual(expected.boundingBox.minWidth);
      }
      if (expected.boundingBox.maxWidth !== undefined) {
        expect(box.width).toBeLessThanOrEqual(expected.boundingBox.maxWidth);
      }
      if (expected.boundingBox.minHeight !== undefined) {
        expect(box.height).toBeGreaterThanOrEqual(expected.boundingBox.minHeight);
      }
      if (expected.boundingBox.maxHeight !== undefined) {
        expect(box.height).toBeLessThanOrEqual(expected.boundingBox.maxHeight);
      }
    }

    if (expected.spacing) {
      const computedStyle = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          marginTop: Number.parseFloat(computed.marginTop),
          marginRight: Number.parseFloat(computed.marginRight),
          marginBottom: Number.parseFloat(computed.marginBottom),
          marginLeft: Number.parseFloat(computed.marginLeft),
          paddingTop: Number.parseFloat(computed.paddingTop),
          paddingRight: Number.parseFloat(computed.paddingRight),
          paddingBottom: Number.parseFloat(computed.paddingBottom),
          paddingLeft: Number.parseFloat(computed.paddingLeft),
        };
      });

      if (expected.spacing.margin !== undefined) {
        if (typeof expected.spacing.margin === 'number') {
          expect(computedStyle.marginTop).toBe(expected.spacing.margin);
          expect(computedStyle.marginRight).toBe(expected.spacing.margin);
          expect(computedStyle.marginBottom).toBe(expected.spacing.margin);
          expect(computedStyle.marginLeft).toBe(expected.spacing.margin);
        } else {
          if (expected.spacing.margin.top !== undefined) {
            expect(computedStyle.marginTop).toBe(expected.spacing.margin.top);
          }
          if (expected.spacing.margin.right !== undefined) {
            expect(computedStyle.marginRight).toBe(expected.spacing.margin.right);
          }
          if (expected.spacing.margin.bottom !== undefined) {
            expect(computedStyle.marginBottom).toBe(expected.spacing.margin.bottom);
          }
          if (expected.spacing.margin.left !== undefined) {
            expect(computedStyle.marginLeft).toBe(expected.spacing.margin.left);
          }
        }
      }

      if (expected.spacing.padding !== undefined) {
        if (typeof expected.spacing.padding === 'number') {
          expect(computedStyle.paddingTop).toBe(expected.spacing.padding);
          expect(computedStyle.paddingRight).toBe(expected.spacing.padding);
          expect(computedStyle.paddingBottom).toBe(expected.spacing.padding);
          expect(computedStyle.paddingLeft).toBe(expected.spacing.padding);
        } else {
          if (expected.spacing.padding.top !== undefined) {
            expect(computedStyle.paddingTop).toBe(expected.spacing.padding.top);
          }
          if (expected.spacing.padding.right !== undefined) {
            expect(computedStyle.paddingRight).toBe(expected.spacing.padding.right);
          }
          if (expected.spacing.padding.bottom !== undefined) {
            expect(computedStyle.paddingBottom).toBe(expected.spacing.padding.bottom);
          }
          if (expected.spacing.padding.left !== undefined) {
            expect(computedStyle.paddingLeft).toBe(expected.spacing.padding.left);
          }
        }
      }
    }
  }

  private async checkColorContrast(action: Action): Promise<void> {
    const { target, expected } = action as {
      target: { description: string; hint: string };
      expected: {
        ratio?: Matcher;
      };
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    const contrastData = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const color = computed.color;

      // Find non-transparent background color by walking up DOM
      let bgColor = computed.backgroundColor;
      let currentEl: Element | null = el;
      while (currentEl && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
        currentEl = currentEl.parentElement;
        if (currentEl) {
          bgColor = window.getComputedStyle(currentEl).backgroundColor;
        }
      }
      // Default to white if no background found
      const backgroundColor =
        bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent'
          ? 'rgb(255, 255, 255)'
          : bgColor;

      // Parse RGB values
      const parseRgb = (rgb: string): [number, number, number] => {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return [0, 0, 0];
        return [
          Number.parseInt(match[1], 10),
          Number.parseInt(match[2], 10),
          Number.parseInt(match[3], 10),
        ];
      };

      // Calculate relative luminance
      const getLuminance = (rgb: [number, number, number]): number => {
        const [r, g, b] = rgb.map((val) => {
          const sRGB = val / 255;
          return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const fgRgb = parseRgb(color);
      const bgRgb = parseRgb(backgroundColor);

      const fgLuminance = getLuminance(fgRgb);
      const bgLuminance = getLuminance(bgRgb);

      const lighter = Math.max(fgLuminance, bgLuminance);
      const darker = Math.min(fgLuminance, bgLuminance);

      const contrastRatio = (lighter + 0.05) / (darker + 0.05);

      return { contrastRatio, color, backgroundColor };
    });

    if (expected.ratio) {
      const ratio = contrastData.contrastRatio;

      if (
        'greaterThanOrEqual' in expected.ratio &&
        expected.ratio.greaterThanOrEqual !== undefined
      ) {
        expect(ratio).toBeGreaterThanOrEqual(expected.ratio.greaterThanOrEqual);
      }

      if ('greaterThan' in expected.ratio && expected.ratio.greaterThan !== undefined) {
        expect(ratio).toBeGreaterThan(expected.ratio.greaterThan);
      }

      if ('equals' in expected.ratio) {
        const tolerance = 0.1;
        expect(Math.abs(ratio - Number(expected.ratio.equals))).toBeLessThan(tolerance);
      }
    }
  }

  private async checkFont(action: Action): Promise<void> {
    const { target, expected } = action as {
      target: { description: string; hint: string };
      expected: {
        fontSize?: Matcher;
        lineHeight?: Matcher;
        fontFamily?: Matcher;
        fontWeight?: Matcher;
      };
    };

    const element = this.page.locator(target.hint).first();
    await element.waitFor({ state: 'visible' });

    const fontData = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: Number.parseFloat(computed.fontSize),
        lineHeight:
          computed.lineHeight === 'normal'
            ? 1.2
            : Number.parseFloat(computed.lineHeight) / Number.parseFloat(computed.fontSize),
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
      };
    });

    if (expected.fontSize) {
      this.applyNumericMatcher(fontData.fontSize, expected.fontSize);
    }

    if (expected.lineHeight) {
      this.applyNumericMatcher(fontData.lineHeight, expected.lineHeight);
    }

    if (expected.fontFamily) {
      if ('contains' in expected.fontFamily && expected.fontFamily.contains) {
        expect(fontData.fontFamily).toContain(expected.fontFamily.contains.toString());
      }
      if ('equals' in expected.fontFamily) {
        expect(fontData.fontFamily).toBe(expected.fontFamily.equals);
      }
      if ('matches' in expected.fontFamily && expected.fontFamily.matches) {
        expect(fontData.fontFamily).toMatch(new RegExp(expected.fontFamily.matches));
      }
    }

    if (expected.fontWeight) {
      const weightNum = Number.parseInt(fontData.fontWeight, 10);
      if ('equals' in expected.fontWeight) {
        expect(weightNum).toBe(Number(expected.fontWeight.equals));
      }
      if (
        'greaterThanOrEqual' in expected.fontWeight &&
        expected.fontWeight.greaterThanOrEqual !== undefined
      ) {
        expect(weightNum).toBeGreaterThanOrEqual(expected.fontWeight.greaterThanOrEqual);
      }
    }
  }

  private applyNumericMatcher(value: number, matcher: Matcher): void {
    if ('equals' in matcher) {
      expect(value).toBe(Number(matcher.equals));
    }
    if ('greaterThan' in matcher && matcher.greaterThan !== undefined) {
      expect(value).toBeGreaterThan(matcher.greaterThan);
    }
    if ('lessThan' in matcher && matcher.lessThan !== undefined) {
      expect(value).toBeLessThan(matcher.lessThan);
    }
    if ('greaterThanOrEqual' in matcher && matcher.greaterThanOrEqual !== undefined) {
      expect(value).toBeGreaterThanOrEqual(matcher.greaterThanOrEqual);
    }
    if ('lessThanOrEqual' in matcher && matcher.lessThanOrEqual !== undefined) {
      expect(value).toBeLessThanOrEqual(matcher.lessThanOrEqual);
    }
  }

  private async applyMatchers(locator: ReturnType<Page['locator']>, matcher: Matcher) {
    if ('equals' in matcher) {
      const text = await locator.textContent();
      expect(text?.trim()).toBe(matcher.equals);
    }

    if ('contains' in matcher) {
      const text = await locator.textContent();
      expect(text).toContain(matcher.contains);
    }

    if ('exists' in matcher) {
      if (matcher.exists) {
        await expect(locator).toBeVisible();
      } else {
        await expect(locator).not.toBeVisible();
      }
    }

    if ('greaterThan' in matcher) {
      const text = await locator.textContent();
      const value = Number.parseFloat(text || '0');
      expect(value).toBeGreaterThan(matcher.greaterThan);
    }

    if ('lessThan' in matcher) {
      const text = await locator.textContent();
      const value = Number.parseFloat(text || '0');
      expect(value).toBeLessThan(matcher.lessThan);
    }

    if ('matches' in matcher) {
      const text = await locator.textContent();
      expect(text).toMatch(new RegExp(matcher.matches));
    }
  }
}

// ============================================================================
// Test Generation
// ============================================================================

const evalsDir = path.resolve(__dirname, '../../../../docs/evals/elements-react');
const evalFiles = findEvalFiles(evalsDir);

for (const evalFile of evalFiles) {
  const spec = loadEvalSpec(evalFile);
  const elementName = spec.component.element.replace('@pie-element/', '');

  test.describe(`${elementName} (React)`, () => {
    for (const evaluation of spec.evals) {
      const testTitle = `[${evaluation.severity}] ${evaluation.id}: ${evaluation.intent}`;

      test(testTitle, async ({ page }) => {
        // Log evaluation metadata
        console.log(`\n  Intent: ${evaluation.intent}`);
        if (evaluation.notes?.length) {
          console.log('  Notes:');
          for (const note of evaluation.notes) console.log(`    - ${note}`);
        }
        if (evaluation.spiritChecks?.length) {
          console.log('  Spirit Checks:');
          for (const check of evaluation.spiritChecks) console.log(`    - ${check}`);
        }

        const interpreter = new ActionInterpreter(page);

        try {
          // Execute all steps
          for (const step of evaluation.steps) {
            await interpreter.execute(step);
          }

          // TODO: Validate expected session and outcome
          // This requires extracting state from rendered components
          // May need custom event listeners or DOM queries

          if (evaluation.expected?.session || evaluation.expected?.outcome) {
            console.log('  Expected state validation: Not yet implemented');
          }
        } catch (error) {
          // Capture screenshot on failure
          const screenshotPath = path.join(
            __dirname,
            'screenshots',
            `${evaluation.id.replace(/\//g, '-')}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });

          if (evaluation.severity === 'error') {
            throw error;
          } else {
            console.warn(`  ⚠️  Warning: ${error}`);
          }
        }
      });
    }
  });
}

// If no eval files found, create a placeholder test
if (evalFiles.length === 0) {
  test('No evaluation files found', () => {
    console.log('No evals.yaml files found in', evalsDir);
    console.log('Create evaluation specs in docs/evals/elements-react/');
    test.skip();
  });
}
