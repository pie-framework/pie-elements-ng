export class Logger {
  constructor(private verbose: boolean = false) {}

  isVerbose(): boolean {
    return this.verbose;
  }

  info(message: string): void {
    console.log(message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  warn(message: string): void {
    console.warn(`⚠️  ${message}`);
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
  }

  section(title: string): void {
    console.log(`\n${title}`);
    console.log('='.repeat(title.length));
  }

  /**
   * Show a progress message (only in verbose mode)
   * In non-verbose mode, use progressStart/progressComplete instead
   */
  progress(message: string): void {
    if (this.verbose) {
      console.log(`  ${message}`);
    }
  }

  /**
   * Show start of an operation (always shown)
   */
  progressStart(message: string): void {
    process.stdout.write(message);
  }

  /**
   * Complete a progress operation with success
   */
  progressComplete(details?: string): void {
    if (details) {
      console.log(` ✓ ${details}`);
    } else {
      console.log(' ✓');
    }
  }

  /**
   * Complete a progress operation with a count
   */
  progressCompleteWithCount(count: number, label: string): void {
    console.log(` ✓ (${count} ${label})`);
  }
}
