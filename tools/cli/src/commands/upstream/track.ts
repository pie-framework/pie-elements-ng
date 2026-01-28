import { Command, Args } from '@oclif/core';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  getCurrentCommit,
  getCommitsSince,
  getCommitDetails,
  getAuthorName,
} from '../../utils/git.js';
import { Logger } from '../../utils/logger.js';
import { DEFAULT_PATHS, HISTORY_FILE } from '../../lib/upstream/sync-constants.js';

interface UpstreamState {
  lastCheck: string;
  upstreamCommits: {
    pieElements: string;
    pieLib: string;
  };
  checkedBy: string;
}

export default class Track extends Command {
  static override description = 'Track upstream repository changes';

  static override examples = [
    '<%= config.bin %> <%= command.id %> show',
    '<%= config.bin %> <%= command.id %> record',
    '<%= config.bin %> <%= command.id %> compare <commit-sha>',
  ];

  static override args = {
    action: Args.string({
      description: 'Action to perform',
      required: true,
      options: ['show', 'record', 'compare'],
    }),
    commit: Args.string({
      description: 'Commit SHA for compare action',
      required: false,
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { args } = await this.parse(Track);

    switch (args.action) {
      case 'show':
        await this.showCommits();
        break;
      case 'record':
        await this.recordState();
        break;
      case 'compare':
        if (!args.commit) {
          this.error('Commit SHA required for compare action');
        }
        await this.compareCommit(args.commit);
        break;
      default:
        this.error(`Unknown action: ${args.action}`);
    }
  }

  private async showCommits(): Promise<void> {
    this.logger.section('📊 Upstream Repository Status');

    const pieElements = DEFAULT_PATHS.PIE_ELEMENTS;
    const pieLib = DEFAULT_PATHS.PIE_LIB;

    if (!existsSync(HISTORY_FILE)) {
      this.logger.warn('No history file found. Run "record" first to establish baseline.');
      return;
    }

    const history: UpstreamState = JSON.parse(await readFile(HISTORY_FILE, 'utf-8'));

    this.logger.info(`\nLast checked: ${history.lastCheck}`);
    this.logger.info(`Checked by: ${history.checkedBy}\n`);

    // Show new commits for pie-elements
    this.logger.section('📦 pie-elements');
    const elementsCommits = getCommitsSince(history.upstreamCommits.pieElements, pieElements);
    if (elementsCommits.length === 0) {
      this.logger.info('   No new commits');
    } else {
      this.logger.info(`   ${elementsCommits.length} new commits:`);
      for (const commit of elementsCommits.slice(0, 10)) {
        this.logger.info(`   ${commit}`);
      }
      if (elementsCommits.length > 10) {
        this.logger.info(`   ... and ${elementsCommits.length - 10} more`);
      }
    }

    // Show new commits for pie-lib
    this.logger.section('\n📚 pie-lib');
    const libCommits = getCommitsSince(history.upstreamCommits.pieLib, pieLib);
    if (libCommits.length === 0) {
      this.logger.info('   No new commits');
    } else {
      this.logger.info(`   ${libCommits.length} new commits:`);
      for (const commit of libCommits.slice(0, 10)) {
        this.logger.info(`   ${commit}`);
      }
      if (libCommits.length > 10) {
        this.logger.info(`   ... and ${libCommits.length - 10} more`);
      }
    }
  }

  private async recordState(): Promise<void> {
    const pieElements = DEFAULT_PATHS.PIE_ELEMENTS;
    const pieLib = DEFAULT_PATHS.PIE_LIB;

    const state: UpstreamState = {
      lastCheck: new Date().toISOString(),
      upstreamCommits: {
        pieElements: getCurrentCommit(pieElements),
        pieLib: getCurrentCommit(pieLib),
      },
      checkedBy: getAuthorName(pieElements),
    };

    await writeFile(HISTORY_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');

    this.logger.success('✅ Upstream state recorded');
    this.logger.info(`   pie-elements: ${state.upstreamCommits.pieElements.substring(0, 8)}`);
    this.logger.info(`   pie-lib: ${state.upstreamCommits.pieLib.substring(0, 8)}`);
  }

  private async compareCommit(commit: string): Promise<void> {
    const pieElements = DEFAULT_PATHS.PIE_ELEMENTS;

    this.logger.section(`📋 Commit Details: ${commit.substring(0, 8)}`);

    try {
      const details = getCommitDetails(commit, pieElements);
      this.log(details);
    } catch (error) {
      this.error(`Failed to get commit details: ${error}`);
    }
  }
}
