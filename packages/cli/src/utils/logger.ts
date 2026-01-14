export class Logger {
  constructor(private verbose: boolean = false) {}

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
}
